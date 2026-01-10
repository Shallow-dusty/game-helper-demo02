/**
 * useUpdateNotification - Service Worker 更新检测 Hook
 *
 * 监听Service Worker的controllerchange事件
 * 当新版本可用时显示更新通知
 */

import { useEffect, useState } from 'react';

export const useUpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Listen for controller change (new service worker activated)
    const handleControllerChange = () => {
      console.log('📦 New service worker activated, update available');
      setUpdateAvailable(true);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Also check for waiting service worker on load
    const registration = navigator.serviceWorker.controller;
    if (registration) {
      // Service worker is already controlling the page
      // Check periodically for updates
      const checkInterval = setInterval(() => {
        navigator.serviceWorker.getRegistrations()
          .then(registrations => {
            registrations.forEach(reg => {
              if (reg.waiting) {
                console.log('📦 Update waiting, showing notification');
                setUpdateAvailable(true);
              }
            });
          })
          .catch(err => {
            console.warn('Failed to check service worker registrations:', err);
          });
      }, 60000); // Check every 60 seconds

      return () => {
        clearInterval(checkInterval);
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    // Skip waiting on all service workers
    navigator.serviceWorker.getRegistrations()
      .then(registrations => {
        registrations.forEach(registration => {
          if (registration.waiting) {
            // Tell the service worker to skip waiting
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      })
      .catch(err => {
        console.warn('Failed to get service worker registrations:', err);
      });

    // After service worker claims the client, reload
    const refreshingTimeout = setTimeout(() => {
      window.location.reload();
    }, 1000);

    return () => clearTimeout(refreshingTimeout);
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  return {
    updateAvailable,
    refreshing,
    handleRefresh,
    handleDismiss,
  };
};

export default useUpdateNotification;
