import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n'; // 国际化配置 - 必须在 App 之前导入
import App from './App';

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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✓ Service Worker 注册成功:', registration);

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
      .catch(error => {
        console.warn('✗ Service Worker 注册失败:', error);
      });
  });

  // 处理 Service Worker 控制器变化
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('✓ Service Worker 已更新');
  });
}