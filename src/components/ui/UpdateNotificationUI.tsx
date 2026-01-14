/**
 * UpdateNotificationUI - 新版本可用通知组件
 *
 * Service Worker检测到新版本时显示通知
 * 用户可选择立即刷新或稍后刷新
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download } from 'lucide-react';
import { Button } from './button';

interface UpdateNotificationUIProps {
  isOpen: boolean;
  onRefresh: () => void;
  onDismiss: () => void;
}

export const UpdateNotificationUI: React.FC<UpdateNotificationUIProps> = ({
  isOpen,
  onRefresh,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const [isDismissing, setIsDismissing] = useState(false);

  if (!isOpen) return null;

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(onDismiss, 300);
  };

  const handleRefresh = () => {
    onRefresh();
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        bg-gradient-to-r from-amber-900 to-stone-900
        border border-amber-600/50 rounded-lg shadow-xl
        p-4 max-w-sm
        backdrop-blur-sm
        animate-in slide-in-from-bottom-4 fade-in duration-300
        ${isDismissing ? 'animate-out slide-out-to-bottom-4 fade-out duration-300' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-1">
          <Download className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <h3 className="font-cinzel font-bold text-amber-100 text-sm">
              {t('ui.updateNotification.title')}
            </h3>
            <p className="text-stone-400 text-xs mt-0.5">
              {t('ui.updateNotification.message')}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-stone-500 hover:text-stone-300 transition-colors flex-shrink-0 mt-0.5"
          title={t('ui.updateNotification.remindLater')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-stone-400 hover:text-stone-300"
        >
          {t('ui.updateNotification.later')}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleRefresh}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {t('ui.updateNotification.refresh')}
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="mt-3 h-0.5 bg-stone-800 rounded overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse"
          style={{
            width: '100%',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
};

export default UpdateNotificationUI;
