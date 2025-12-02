import { useEffect, useState } from 'react';
import { useStore } from '../store';

/**
 * Hook: 用于管理亡者视界效果
 * 
 * 根据玩家死亡状态和设置，控制全屏滤镜效果
 */
export const useGhostlyVision = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  
  // 从 store 获取玩家状态
  const mySeatId = useStore(s => s.mySeatId);
  const seats = useStore(s => s.gameState?.seats);
  
  // 检查当前玩家是否死亡
  const isDead = mySeatId !== null && seats?.[mySeatId]?.isDead === true;

  // 应用全局滤镜效果
  useEffect(() => {
    const appElement = document.getElementById('root');
    if (appElement) {
      if (isDead && isEnabled) {
        appElement.classList.add('ghostly-vision-active');
      } else {
        appElement.classList.remove('ghostly-vision-active');
      }
    }
    
    return () => {
      appElement?.classList.remove('ghostly-vision-active');
    };
  }, [isDead, isEnabled]);

  return {
    isActive: isDead && isEnabled,
    isDead,
    isEnabled,
    setIsEnabled,
  };
};
