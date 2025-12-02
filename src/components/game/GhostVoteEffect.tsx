import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ghost } from 'lucide-react';
import { useSoundEffect } from '../../hooks/useSoundEffect';

/**
 * GhostVoteEffect - 幽灵投票视觉效果
 * 
 * 当死亡玩家使用其最后的投票权时，显示幽灵般的视觉效果
 * - 半透明幽灵图标从座位升起
 * - 幽灵般的光晕效果
 * - 幽灵低语音效
 */

interface GhostVoteEffectProps {
  /** 发起投票的座位ID */
  voterSeatId: number | null;
  /** 被投票的座位ID */
  targetSeatId: number | null;
  /** 投票者名称 */
  voterName?: string;
  /** 投票者位置 */
  voterPosition?: { x: number; y: number };
  /** 目标位置 */
  targetPosition?: { x: number; y: number };
  /** 效果完成后回调 */
  onComplete?: () => void;
}

// 幽灵粒子轨迹
const GHOST_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  offsetX: (Math.random() - 0.5) * 30,
  offsetY: (Math.random() - 0.5) * 30,
  delay: Math.random() * 0.3,
  size: 4 + Math.random() * 6,
}));

export const GhostVoteEffect: React.FC<GhostVoteEffectProps> = ({
  voterSeatId,
  targetSeatId,
  voterName,
  voterPosition,
  targetPosition,
  onComplete
}) => {
  const [isActive, setIsActive] = useState(false);
  const [lastVoteKey, setLastVoteKey] = useState<string | null>(null);
  const { playSound } = useSoundEffect();

  // 创建唯一的投票键
  const voteKey = useMemo(() => {
    if (voterSeatId === null || targetSeatId === null) return null;
    return `${voterSeatId}-${targetSeatId}-${Date.now()}`;
  }, [voterSeatId, targetSeatId]);

  // 检测新的幽灵投票
  useEffect(() => {
    if (voteKey && voteKey !== lastVoteKey && voterPosition && targetPosition) {
      setLastVoteKey(voteKey);
      setIsActive(true);
      
      // 播放幽灵低语音效
      playSound('ghost_whisper');
      
      // 效果持续时间后自动结束
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [voteKey, lastVoteKey, voterPosition, targetPosition, playSound, onComplete]);

  // 重置状态
  useEffect(() => {
    if (voterSeatId === null || targetSeatId === null) {
      setLastVoteKey(null);
    }
  }, [voterSeatId, targetSeatId]);

  if (!isActive || !voterPosition || !targetPosition) {
    return null;
  }

  // 计算幽灵飞行路径
  const startX = voterPosition.x;
  const startY = voterPosition.y;
  const endX = targetPosition.x;
  const endY = targetPosition.y;
  
  // 贝塞尔曲线控制点（弧形路径）
  const midX = (startX + endX) / 2;
  const midY = Math.min(startY, endY) - 80; // 向上弯曲

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* 背景暗化效果 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-purple-900/20 pointer-events-none z-[500]"
          />

          {/* 起点光晕 */}
          <motion.div
            className="fixed pointer-events-none z-[501]"
            style={{
              left: startX,
              top: startY,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 0.6, 0] }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          >
            <div
              className="w-20 h-20 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(192, 132, 252, 0.6) 0%, transparent 70%)',
                boxShadow: '0 0 40px rgba(192, 132, 252, 0.5)',
              }}
            />
          </motion.div>

          {/* 终点光晕 */}
          <motion.div
            className="fixed pointer-events-none z-[501]"
            style={{
              left: endX,
              top: endY,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 0, 1.5, 0], opacity: [0, 0, 0.6, 0] }}
            transition={{ duration: 2, times: [0, 0.5, 0.8, 1], ease: 'easeOut' }}
          >
            <div
              className="w-24 h-24 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, transparent 70%)',
                boxShadow: '0 0 50px rgba(239, 68, 68, 0.4)',
              }}
            />
          </motion.div>

          {/* 幽灵图标飞行 */}
          <motion.div
            className="fixed pointer-events-none z-[502]"
            style={{
              left: startX,
              top: startY,
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 0,
              opacity: 0 
            }}
            animate={{
              x: [0, midX - startX, endX - startX],
              y: [0, midY - startY, endY - startY],
              scale: [0, 1.2, 0.8],
              opacity: [0, 0.9, 0],
            }}
            transition={{
              duration: 1.5,
              times: [0, 0.5, 1],
              ease: 'easeInOut',
            }}
          >
            <div className="relative transform -translate-x-1/2 -translate-y-1/2">
              {/* 幽灵主体 */}
              <Ghost 
                className="w-12 h-12 text-purple-300 drop-shadow-[0_0_20px_rgba(192,132,252,0.8)]"
                strokeWidth={1.5}
              />
              
              {/* 发光层 */}
              <Ghost 
                className="absolute inset-0 w-12 h-12 text-purple-200 blur-sm opacity-50"
                strokeWidth={1.5}
              />
              
              {/* 拖尾效果 */}
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: [0.8, 0.4, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <Ghost 
                  className="w-12 h-12 text-purple-400/30 blur-md"
                  strokeWidth={1.5}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* 幽灵粒子轨迹 */}
          {GHOST_PARTICLES.map(particle => (
            <motion.div
              key={particle.id}
              className="fixed pointer-events-none z-[501]"
              style={{
                left: startX + particle.offsetX,
                top: startY + particle.offsetY,
              }}
              initial={{ 
                x: 0, 
                y: 0, 
                scale: 0,
                opacity: 0 
              }}
              animate={{
                x: [0, (midX - startX) + particle.offsetX * 0.5, (endX - startX) + particle.offsetX],
                y: [0, (midY - startY) + particle.offsetY * 0.5, (endY - startY) + particle.offsetY],
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                times: [0, 0.5, 1],
                ease: 'easeInOut',
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: particle.size,
                  height: particle.size,
                  background: 'radial-gradient(circle, rgba(192, 132, 252, 0.8) 0%, transparent 70%)',
                  boxShadow: '0 0 10px rgba(192, 132, 252, 0.5)',
                }}
              />
            </motion.div>
          ))}

          {/* 投票者名称 */}
          {voterName && (
            <motion.div
              className="fixed pointer-events-none z-[503] text-center"
              style={{
                left: startX,
                top: startY - 60,
                transform: 'translateX(-50%)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0, 1, 0], y: [10, 0, -20] }}
              transition={{ duration: 1.5, times: [0, 0.3, 1] }}
            >
              <p className="text-sm text-purple-300 font-cinzel drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]">
                👻 {voterName}
              </p>
              <p className="text-xs text-purple-400/60 mt-0.5">
                最后的投票
              </p>
            </motion.div>
          )}

          {/* SVG 连线轨迹 */}
          <svg
            className="fixed inset-0 pointer-events-none z-[500]"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <linearGradient id="ghostTrailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(192, 132, 252, 0.8)" />
                <stop offset="50%" stopColor="rgba(147, 51, 234, 0.6)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.4)" />
              </linearGradient>
              <filter id="ghostTrailGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            
            <motion.path
              d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
              fill="none"
              stroke="url(#ghostTrailGradient)"
              strokeWidth={3}
              strokeLinecap="round"
              filter="url(#ghostTrailGlow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0, 0.8, 0] }}
              transition={{ duration: 2, times: [0, 0.6, 1], ease: 'easeInOut' }}
            />
          </svg>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Hook: 用于触发幽灵投票效果
 */
export const useGhostVoteEffect = () => {
  const [voteInfo, setVoteInfo] = useState<{
    voterSeatId: number;
    targetSeatId: number;
    voterName: string;
    voterPosition: { x: number; y: number };
    targetPosition: { x: number; y: number };
  } | null>(null);

  const triggerGhostVote = React.useCallback((
    voterSeatId: number,
    targetSeatId: number,
    voterName: string,
    voterPosition: { x: number; y: number },
    targetPosition: { x: number; y: number }
  ) => {
    setVoteInfo({ voterSeatId, targetSeatId, voterName, voterPosition, targetPosition });
  }, []);

  const clearGhostVote = React.useCallback(() => {
    setVoteInfo(null);
  }, []);

  return {
    voteInfo,
    triggerGhostVote,
    clearGhostVote,
  };
};

export default GhostVoteEffect;
