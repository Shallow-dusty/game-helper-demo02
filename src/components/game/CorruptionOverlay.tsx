import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffect } from '../../hooks/useSoundEffect';

interface CorruptionOverlayProps {
  /** 腐蚀阶段：0=无, 1=轻微, 2=严重 */
  stage: 0 | 1 | 2;
}

/**
 * 腐蚀蔓延效果 (Spreading Corruption)
 * 
 * 随着玩家死亡，界面逐渐被"腐蚀"：
 * - Stage 1 (≤66% 存活): 边缘暗角 + 轻微噪点纹理
 * - Stage 2 (≤4人存活): 更强的暗角 + 脉动血脉纹理 + 低频嗡鸣音
 */
export const CorruptionOverlay: React.FC<CorruptionOverlayProps> = ({ stage }) => {
  const { playSound } = useSoundEffect();

  // Stage 2 时播放环境音效 (仅播放一次)
  React.useEffect(() => {
    if (stage === 2) {
      // 可以在这里添加持续的低频嗡鸣 (需要额外的 BGM 控制)
      // 暂时使用 death_toll 作为过渡效果
      playSound('death_toll', { volume: 0.3 });
    }
  }, [stage, playSound]);

  // 生成随机的血脉纹理点
  const veinPoints = useMemo(() => {
    if (stage < 2) return [];
    const points: { x: number; y: number; size: number; delay: number }[] = [];
    for (let i = 0; i < 8; i++) {
      // 边缘位置
      const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      let x = 0, y = 0;
      if (edge === 0) { x = Math.random() * 100; y = Math.random() * 15; }
      else if (edge === 1) { x = 85 + Math.random() * 15; y = Math.random() * 100; }
      else if (edge === 2) { x = Math.random() * 100; y = 85 + Math.random() * 15; }
      else { x = Math.random() * 15; y = Math.random() * 100; }
      
      points.push({
        x,
        y,
        size: 80 + Math.random() * 120,
        delay: Math.random() * 2
      });
    }
    return points;
  }, [stage]);

  if (stage === 0) return null;

  return (
    <AnimatePresence>
      {/* 基础暗角层 */}
      <motion.div
        key="corruption-vignette"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 1 ? 0.6 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              transparent 30%,
              rgba(40, 10, 10, 0.3) 60%,
              rgba(20, 5, 5, 0.6) 80%,
              rgba(10, 0, 0, 0.85) 100%
            )
          `
        }}
      />

      {/* 噪点纹理层 - 使用 SVG filter */}
      <motion.div
        key="corruption-noise"
        initial={{ opacity: 0 }}
        animate={{ opacity: stage === 1 ? 0.15 : 0.25 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 pointer-events-none z-[2] mix-blend-overlay"
      >
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="corruption-noise-filter">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.8"
                numOctaves="4"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <rect
            width="100%"
            height="100%"
            filter="url(#corruption-noise-filter)"
            opacity="0.5"
          />
        </svg>
      </motion.div>

      {/* Stage 2: 血脉纹理 - 脉动的红色斑点 */}
      {stage >= 2 && veinPoints.map((point, idx) => (
        <motion.div
          key={`vein-${idx}`}
          className="absolute pointer-events-none z-[3]"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: point.size,
            height: point.size,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            delay: point.delay,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `
                radial-gradient(
                  circle at center,
                  rgba(80, 0, 0, 0.6) 0%,
                  rgba(50, 0, 0, 0.3) 40%,
                  transparent 70%
                )
              `,
              filter: 'blur(20px)',
            }}
          />
        </motion.div>
      ))}

      {/* Stage 2: 颜色叠加层 */}
      {stage >= 2 && (
        <motion.div
          key="corruption-color"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 pointer-events-none z-[4] mix-blend-multiply"
          style={{
            backgroundColor: '#1a0505'
          }}
        />
      )}

      {/* 边缘裂纹装饰 - SVG */}
      {stage >= 2 && (
        <motion.svg
          key="corruption-cracks"
          className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, delay: 0.5 }}
        >
          <defs>
            <linearGradient id="crack-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(60, 10, 10, 0.8)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          {/* 左上角裂纹 */}
          <path
            d="M0,0 L0,80 Q10,60 5,40 Q15,30 10,15 Q20,10 30,0 Z"
            fill="url(#crack-gradient)"
          />
          {/* 右下角裂纹 */}
          <path
            d="M100%,100% L100%,calc(100% - 80px) Q calc(100% - 10px),calc(100% - 60px) calc(100% - 5px),calc(100% - 40px) Q calc(100% - 15px),calc(100% - 30px) calc(100% - 10px),calc(100% - 15px) Q calc(100% - 20px),calc(100% - 10px) calc(100% - 30px),100% Z"
            fill="url(#crack-gradient)"
            style={{ transform: 'rotate(180deg)', transformOrigin: 'center' }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  );
};

export default CorruptionOverlay;
