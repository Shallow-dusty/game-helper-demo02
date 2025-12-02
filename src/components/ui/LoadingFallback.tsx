import React from 'react';

interface LoadingFallbackProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

/**
 * 通用加载占位组件
 * 用于 React.lazy 的 Suspense fallback
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = '加载中...',
  size = 'md',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-14 h-14 border-4',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} border-stone-700 border-t-amber-500 rounded-full animate-spin`}
      />
      <span className={`${textSizes[size]} text-stone-400 font-cinzel`}>
        {message}
      </span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-stone-950 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center min-h-[200px]">
      {content}
    </div>
  );
};

/**
 * 骨架屏加载组件
 */
export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-stone-800/50 rounded ${className}`} />
);

/**
 * 游戏视图加载占位
 */
export const GrimoireLoadingFallback: React.FC = () => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-stone-500 bg-stone-950">
    <div className="w-12 h-12 border-4 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
    <span className="text-sm font-cinzel">正在加载魔典...</span>
  </div>
);

/**
 * 控制面板加载占位
 */
export const ControlsLoadingFallback: React.FC = () => (
  <div className="w-80 bg-stone-900 h-full flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
      <span className="text-xs text-stone-500">加载控制面板...</span>
    </div>
  </div>
);

/**
 * 模态框加载占位
 */
export const ModalLoadingFallback: React.FC = () => (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-stone-900 rounded-xl p-8 flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-3 border-stone-700 border-t-amber-500 rounded-full animate-spin" />
      <span className="text-sm text-stone-400">加载中...</span>
    </div>
  </div>
);

export default LoadingFallback;
