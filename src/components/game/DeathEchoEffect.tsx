import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull } from 'lucide-react';
import { useSoundEffect } from '../../hooks/useSoundEffect';

interface DeathEchoEffectProps {
  /** 触发死亡效果的座位ID，null表示不触发 */
  deathSeatId: number | null;
  /** 死亡玩家名称 */
  playerName?: string;
  /** 效果结束后的回调 */
  onComplete?: () => void;
}

/**
 * "最后的回响" (Last Echo) - 死亡视觉/音效反馈组件
 * 
 * 当玩家被标记死亡时触发：
 * - 全屏血红闪光效果
 * - 骷髅图标从中心扩散
 * - 死亡丧钟音效
 * - 玩家名称淡出动画
 */
export const DeathEchoEffect: React.FC<DeathEchoEffectProps> = ({
  deathSeatId,
  playerName,
  onComplete
}) => {
  const [isActive, setIsActive] = useState(false);
  const [lastDeathId, setLastDeathId] = useState<number | null>(null);
  const { playSound } = useSoundEffect();

  // 检测新的死亡事件
  useEffect(() => {
    if (deathSeatId !== null && deathSeatId !== lastDeathId) {
      setLastDeathId(deathSeatId);
      setIsActive(true);
      
      // 播放死亡丧钟音效
      playSound('death_toll');
      
      // 效果持续时间后自动结束
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, 2500);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [deathSeatId, lastDeathId, playSound, onComplete]);

  // 重置状态当 deathSeatId 变为 null
  useEffect(() => {
    if (deathSeatId === null) {
      setLastDeathId(null);
    }
  }, [deathSeatId]);

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* 血红闪光遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0.6, 0.3, 0.5, 0],
            }}
            transition={{ 
              duration: 2,
              times: [0, 0.1, 0.3, 0.5, 1],
              ease: 'easeOut'
            }}
            className="fixed inset-0 pointer-events-none z-[1100]"
            style={{
              background: 'radial-gradient(circle at center, rgba(139, 0, 0, 0.8) 0%, rgba(80, 0, 0, 0.6) 40%, rgba(30, 0, 0, 0.4) 70%, transparent 100%)',
            }}
          />

          {/* 脉冲波纹效果 */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1101]"
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '4px solid rgba(220, 38, 38, 0.8)',
              boxShadow: '0 0 60px rgba(220, 38, 38, 0.6), inset 0 0 40px rgba(220, 38, 38, 0.4)',
            }}
          />

          {/* 骷髅图标 */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ 
              scale: [0, 1.5, 1],
              opacity: [0, 1, 0],
              rotate: [- 180, 0, 0]
            }}
            transition={{ 
              duration: 2,
              times: [0, 0.3, 1],
              ease: 'easeOut'
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1102]"
          >
            <div className="relative">
              <Skull 
                className="w-24 h-24 text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]" 
                strokeWidth={1.5}
              />
              {/* 骷髅发光效果 */}
              <div className="absolute inset-0 animate-pulse">
                <Skull 
                  className="w-24 h-24 text-red-400 blur-sm opacity-50" 
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </motion.div>

          {/* 玩家名称显示 */}
          {playerName && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
              transition={{ 
                duration: 2.5,
                times: [0, 0.2, 0.7, 1],
                ease: 'easeOut'
              }}
              className="fixed top-[60%] left-1/2 -translate-x-1/2 pointer-events-none z-[1103] text-center"
            >
              <p className="text-2xl font-cinzel text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]">
                {playerName}
              </p>
              <p className="text-sm text-red-400/80 mt-1 font-serif">
                已离开人世...
              </p>
            </motion.div>
          )}

          {/* 边缘血迹渐变 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none z-[1099]"
            style={{
              boxShadow: 'inset 0 0 150px rgba(139, 0, 0, 0.6), inset 0 0 80px rgba(80, 0, 0, 0.4)',
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Hook: 用于触发死亡效果
 */
export const useDeathEcho = () => {
  const [deathInfo, setDeathInfo] = useState<{ seatId: number; playerName: string } | null>(null);

  const triggerDeathEcho = useCallback((seatId: number, playerName: string) => {
    setDeathInfo({ seatId, playerName });
  }, []);

  const clearDeathEcho = useCallback(() => {
    setDeathInfo(null);
  }, []);

  return {
    deathSeatId: deathInfo?.seatId ?? null,
    playerName: deathInfo?.playerName,
    triggerDeathEcho,
    clearDeathEcho,
  };
};

export default DeathEchoEffect;
