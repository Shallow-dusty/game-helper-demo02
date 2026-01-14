import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull } from 'lucide-react';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import { useTranslation } from 'react-i18next';

interface DeathEchoEffectProps {
  /** 触发死亡效果的座位ID，null表示不触发 */
  deathSeatId: number | null;
  /** 死亡玩家名称 */
  playerName?: string;
  /** 效果结束后的回调 */
  onComplete?: () => void;
}

// 灰烬粒子形状 SVG 路径
const ASH_SHAPES = [
  'M0,0 Q2,-3 5,-2 Q8,0 6,3 Q3,5 0,3 Q-2,1 0,0', // 不规则形状1
  'M0,0 L3,-2 L6,0 L5,3 L2,4 L-1,2 Z', // 不规则多边形
  'M0,0 Q4,-1 3,2 Q1,4 -1,2 Q-2,0 0,0', // 弯曲形状
  'M0,0 L2,-3 L4,-1 L3,2 L0,3 L-2,1 Z', // 碎片形状
];

/**
 * "最后的回响" (Last Echo) - 死亡视觉/音效反馈组件
 * 
 * 当玩家被标记死亡时触发：
 * - 全屏灰烬色闪光效果
 * - 骷髅图标从中心扩散
 * - 不规则灰烬粒子飘散
 * - 死亡丧钟音效
 * - 玩家名称淡出动画
 */
export const DeathEchoEffect: React.FC<DeathEchoEffectProps> = ({
  deathSeatId,
  playerName,
  onComplete
}) => {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [lastDeathId, setLastDeathId] = useState<number | null>(null);
  const { playSound } = useSoundEffect();

  // 生成灰烬粒子
  const ashParticles = useMemo(() => {
    if (!isActive) return [];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 30, // 中心附近
      y: 50 + (Math.random() - 0.5) * 30,
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 360,
      shape: ASH_SHAPES[Math.floor(Math.random() * ASH_SHAPES.length)],
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1.5,
      // 随机飘散方向
      dx: (Math.random() - 0.5) * 60,
      dy: -20 - Math.random() * 40, // 向上飘
      dr: (Math.random() - 0.5) * 180, // 旋转
    }));
  }, [isActive]);

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
          {/* 灰烬色闪光遮罩 */}
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
              background: 'radial-gradient(circle at center, rgba(87, 83, 78, 0.8) 0%, rgba(68, 64, 60, 0.6) 40%, rgba(41, 37, 36, 0.4) 70%, transparent 100%)',
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
              border: '4px solid rgba(168, 162, 158, 0.8)',
              boxShadow: '0 0 60px rgba(120, 113, 108, 0.6), inset 0 0 40px rgba(120, 113, 108, 0.4)',
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
                className="w-24 h-24 text-stone-400 drop-shadow-[0_0_30px_rgba(168,162,158,0.8)]" 
                strokeWidth={1.5}
              />
              {/* 骷髅发光效果 */}
              <div className="absolute inset-0 animate-pulse">
                <Skull 
                  className="w-24 h-24 text-stone-300 blur-sm opacity-50" 
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
              <p className="text-2xl font-cinzel text-stone-400 drop-shadow-[0_0_10px_rgba(168,162,158,0.8)]">
                {playerName}
              </p>
              <p className="text-sm text-stone-500/80 mt-1 font-serif">
                {t('game.deathEcho.departed')}
              </p>
            </motion.div>
          )}

          {/* 边缘灰烬渐变 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none z-[1099]"
            style={{
              boxShadow: 'inset 0 0 150px rgba(87, 83, 78, 0.6), inset 0 0 80px rgba(68, 64, 60, 0.4)',
            }}
          />

          {/* 灰烬粒子效果 */}
          {ashParticles.map(particle => (
            <motion.div
              key={particle.id}
              className="fixed pointer-events-none z-[1104]"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: 0,
                y: 0,
                rotate: particle.rotation 
              }}
              animate={{ 
                opacity: [0, 0.8, 0.6, 0],
                scale: [0, 1, 0.8, 0.3],
                x: particle.dx,
                y: particle.dy,
                rotate: particle.rotation + particle.dr,
              }}
              transition={{ 
                duration: particle.duration,
                delay: particle.delay,
                ease: 'easeOut'
              }}
            >
              <svg 
                width={particle.size * 2} 
                height={particle.size * 2} 
                viewBox="-5 -5 15 15"
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                <path
                  d={particle.shape}
                  fill={`rgba(${60 + Math.random() * 40}, ${55 + Math.random() * 30}, ${50 + Math.random() * 20}, 0.9)`}
                  style={{ filter: 'blur(0.5px)' }}
                />
              </svg>
            </motion.div>
          ))}
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
