import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun } from 'lucide-react';
import { useSoundEffect } from '../../hooks/useSoundEffect';

interface DawnLightProps {
  /** 是否触发破晓效果 */
  isActive: boolean;
  /** 座位位置列表 (用于依次点亮) */
  seatPositions?: { id: number; x: number; y: number; isDead: boolean }[];
  /** 效果完成回调 */
  onComplete?: () => void;
}

/**
 * 破晓之光 (The Breaking Dawn)
 * 
 * 昼夜转场仪式感特效：
 * - ST 点击"天亮"时触发
 * - 全屏先黑暗，然后金色扇形光束从右上角扫过
 * - 光束扫过时，存活 Token 依次点亮
 * - 配合日出音效
 */
export const DawnLight: React.FC<DawnLightProps> = ({
  isActive,
  seatPositions = [],
  onComplete
}) => {
  const [phase, setPhase] = useState<'idle' | 'blackout' | 'sweep' | 'glow' | 'fade'>('idle');
  const [litSeats, setLitSeats] = useState<Set<number>>(new Set());
  const { playSound } = useSoundEffect();

  // 存活座位按角度排序 (从右上角开始)
  const sortedAliveSeats = useMemo(() => {
    return seatPositions
      .filter(s => !s.isDead)
      .sort((a, b) => {
        // 从右上角(-45度)开始顺时针排序
        const angleA = Math.atan2(a.y - 50, a.x - 100) * 180 / Math.PI;
        const angleB = Math.atan2(b.y - 50, b.x - 100) * 180 / Math.PI;
        return angleA - angleB;
      });
  }, [seatPositions]);

  useEffect(() => {
    if (isActive && phase === 'idle') {
      // 开始动画序列 (总时长缩短到 ~2.5秒)
      setPhase('blackout');
      playSound('day_bell');

      // 黑屏持续 300ms
      setTimeout(() => {
        setPhase('sweep');
        // 播放鸟鸣音效
        playSound('bird_chirp');
      }, 300);

      // 扫光持续 1500ms
      setTimeout(() => setPhase('glow'), 1800);

      // 发光持续 500ms 后淡出
      setTimeout(() => setPhase('fade'), 2300);

      // 完成
      setTimeout(() => {
        setPhase('idle');
        setLitSeats(new Set());
        onComplete?.();
      }, 2800);
    }
  }, [isActive, phase, playSound, onComplete]);

  // 扫光阶段依次点亮座位 (加快速度)
  useEffect(() => {
    if (phase !== 'sweep') return;

    sortedAliveSeats.forEach((seat, idx) => {
      setTimeout(() => {
        setLitSeats(prev => new Set([...prev, seat.id]));
      }, 50 + idx * 100); // 每100ms点亮一个
    });
  }, [phase, sortedAliveSeats]);

  if (phase === 'idle') return null;

  return (
    <AnimatePresence>
      {/* 黑屏遮罩 */}
      {phase === 'blackout' && (
        <motion.div
          key="blackout"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black z-[2000]"
        />
      )}

      {/* 扫光效果 */}
      {(phase === 'sweep' || phase === 'glow') && (
        <>
          {/* 暗色背景 */}
          <motion.div
            key="dark-bg"
            initial={{ opacity: 1 }}
            animate={{ opacity: phase === 'glow' ? 0.3 : 0.8 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black z-[2000]"
          />

          {/* 金色扫光 */}
          <motion.div
            key="light-sweep"
            className="fixed inset-0 z-[2001] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute"
              style={{
                top: '-50%',
                right: '-50%',
                width: '200%',
                height: '200%',
                background: `
                  conic-gradient(
                    from -90deg at 100% 0%,
                    transparent 0deg,
                    rgba(251, 191, 36, 0.3) 15deg,
                    rgba(245, 158, 11, 0.5) 30deg,
                    rgba(251, 191, 36, 0.3) 45deg,
                    transparent 60deg,
                    transparent 360deg
                  )
                `,
                transformOrigin: '100% 0%',
              }}
              initial={{ rotate: -30 }}
              animate={{ rotate: 150 }}
              transition={{ 
                duration: 2,
                ease: 'easeInOut'
              }}
            />
          </motion.div>

          {/* 太阳图标 */}
          <motion.div
            key="sun"
            className="fixed top-8 right-8 z-[2002]"
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ 
              scale: phase === 'glow' ? 1.2 : 1,
              opacity: 1, 
              rotate: 0 
            }}
            transition={{ 
              duration: 1,
              ease: 'easeOut'
            }}
          >
            <Sun 
              className="w-16 h-16 text-amber-400" 
              style={{
                filter: 'drop-shadow(0 0 30px rgba(251, 191, 36, 0.8)) drop-shadow(0 0 60px rgba(245, 158, 11, 0.5))'
              }}
            />
          </motion.div>

          {/* 座位点亮效果 */}
          {seatPositions.map(seat => (
            <motion.div
              key={`seat-glow-${seat.id}`}
              className="fixed z-[2003] pointer-events-none"
              style={{
                left: `${seat.x}%`,
                top: `${seat.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: litSeats.has(seat.id) ? 1 : 0,
                scale: litSeats.has(seat.id) ? 1 : 0.5,
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {!seat.isDead && (
                <div 
                  className="w-12 h-12 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(251, 191, 36, 0.8) 0%, rgba(245, 158, 11, 0.4) 50%, transparent 70%)',
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)',
                  }}
                />
              )}
            </motion.div>
          ))}
        </>
      )}

      {/* 淡出 */}
      {phase === 'fade' && (
        <motion.div
          key="fade"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 bg-black z-[2000]"
        />
      )}
    </AnimatePresence>
  );
};

export default DawnLight;
