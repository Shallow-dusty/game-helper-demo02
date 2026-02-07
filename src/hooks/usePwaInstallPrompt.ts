import { useCallback, useEffect, useState } from 'react';

const DISMISS_UNTIL_KEY = 'pwa_install_prompt_dismiss_until';
const DEFAULT_DISMISS_DAYS = 7;

const isStandalone = () => {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
};

export const usePwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      return;
    }

    const dismissUntilRaw = window.localStorage.getItem(DISMISS_UNTIL_KEY);
    const dismissUntil = dismissUntilRaw ? Number.parseInt(dismissUntilRaw, 10) : 0;
    if (Number.isFinite(dismissUntil) && dismissUntil > Date.now()) {
      return;
    }

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setCanInstall(true);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setCanInstall(false);
      window.localStorage.removeItem(DISMISS_UNTIL_KEY);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setCanInstall(false);

    return choice.outcome === 'accepted';
  }, [deferredPrompt]);

  const dismissInstallPrompt = useCallback((days: number = DEFAULT_DISMISS_DAYS) => {
    const dismissUntil = Date.now() + days * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(DISMISS_UNTIL_KEY, String(dismissUntil));
    setDeferredPrompt(null);
    setCanInstall(false);
  }, []);

  return {
    canInstall,
    promptInstall,
    dismissInstallPrompt,
  };
};
