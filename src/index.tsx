import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n'; // 国际化配置 - 必须在 App 之前导入
import App from './App';
import { useStore } from './store';
import { captureException, initMonitoring } from './lib/monitoring';
import { initWebVitals } from './lib/webVitals';

initMonitoring();
initWebVitals();

window.addEventListener('error', (event) => {
  captureException(event.error ?? new Error(event.message), {
    source: 'window.error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  captureException(event.reason ?? new Error('Unhandled promise rejection'), {
    source: 'window.unhandledrejection',
  });
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ============================================================
// Service Worker 注册 - PWA 离线支持
// ============================================================

if ('serviceWorker' in navigator) {
  const registerPeriodicRoomSync = async (registration: ServiceWorkerRegistration) => {
    const periodicSync = (registration as ServiceWorkerRegistration & {
      periodicSync?: {
        register: (tag: string, options: { minInterval: number }) => Promise<void>;
      };
    }).periodicSync;

    if (!periodicSync) return;

    try {
      await periodicSync.register('room-state-sync', {
        minInterval: 30 * 60 * 1000,
      });
      console.log('✓ Periodic room sync 已注册');
    } catch (error) {
      console.warn('✗ Periodic room sync 注册失败:', error);
    }
  };

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✓ Service Worker 注册成功:', registration);
        void registerPeriodicRoomSync(registration);

        // 检查更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 有新版本的 Service Worker
                console.log('⚠ 检测到新版本，刷新后生效');
                // 可选：显示"有新版本"的通知
              }
            });
          }
        });
      })
      .catch((error: unknown) => {
        console.warn('✗ Service Worker 注册失败:', error);
      });
  });

  // 处理 Service Worker 控制器变化
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('✓ Service Worker 已更新');
  });

  navigator.serviceWorker.addEventListener('message', (event: MessageEvent<{ type?: string }>) => {
    if (event.data?.type !== 'PERIODIC_ROOM_SYNC') {
      return;
    }
    const syncToCloud = useStore.getState().syncToCloud;
    if (typeof syncToCloud === 'function') {
      void syncToCloud();
    }
  });
}
