import React, { useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffect } from '../../hooks/useSoundEffect';

interface CorruptionOverlayProps {
  /** 腐蚀阶段：0=无, 1=轻微, 2=严重, 3=决战 */
  stage: 0 | 1 | 2 | 3;
}

/**
 * 腐蚀蔓延效果 (Spreading Corruption)
 * 
 * 随着玩家死亡，界面逐渐被"腐蚀"：
 * - Stage 1 (≤66% 存活): 边缘暗角 + 轻微噪点纹理
 * - Stage 2 (≤4人存活): 更强的暗角 + 脉动血脉纹理 + 边缘蔓藤
 * - Stage 3 (决战): 最强暗角 + 老电影噪点滤镜 + 低频Drone音轨
 */
export const CorruptionOverlay: React.FC<CorruptionOverlayProps> = ({ stage }) => {
  const { playSound } = useSoundEffect();
  const droneAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevStageRef = useRef(stage);

  // Stage 3 时淡入低频 Drone 音轨
  useEffect(() => {
    let fadeTimer: ReturnType<typeof setInterval> | undefined;

    if (stage === 3 && prevStageRef.current !== 3) {
      // 进入 Stage 3，启动 Drone
      try {
        const audio = droneAudioRef.current ?? new Audio('/audio/sfx/drone_low.mp3');

        audio.loop = true;
        audio.volume = 0;
        droneAudioRef.current = audio;

        audio.play().catch(() => { /* ignore autoplay errors */ });
        
        // 淡入效果
        let vol = 0;
        fadeTimer = setInterval(() => {
          vol = Math.min(vol + 0.02, 0.25);
          if (droneAudioRef.current) droneAudioRef.current.volume = vol;
          if (vol >= 0.25 && fadeTimer) clearInterval(fadeTimer);
        }, 100);
      } catch {
        console.warn('Failed to play drone audio');
      }
    } else if (stage < 3 && prevStageRef.current === 3 && droneAudioRef.current) {
      // 离开 Stage 3，淡出 Drone
      const audio = droneAudioRef.current;
      let vol = audio.volume;

      fadeTimer = setInterval(() => {
        vol = Math.max(vol - 0.02, 0);
        audio.volume = vol;
        if (vol <= 0) {
          if (fadeTimer) clearInterval(fadeTimer);
          audio.pause();
          droneAudioRef.current = null;
        }
      }, 100);
    }
    
    prevStageRef.current = stage;
    
    return () => {
      if (fadeTimer) clearInterval(fadeTimer);
    };
  }, [stage]);

  // 组件卸载时清理音频
  useEffect(() => () => {
    if (droneAudioRef.current) {
      droneAudioRef.current.pause();
      droneAudioRef.current = null;
    }
  }, []);

  // Stage 2 进入时播放音效
  useEffect(() => {
    if (stage === 2 && prevStageRef.current < 2) {
      playSound('death_toll', { volume: 0.3 });
    }
  }, [stage, playSound]);

  // 生成随机的血脉纹理点
  const veinPoints = useMemo(() => {
    if (stage < 2) return [];
    const points: { x: number; y: number; size: number; delay: number }[] = [];
    const count = stage === 3 ? 12 : 8; // Stage 3 更多血脉点
    for (let i = 0; i < count; i++) {
      // 边缘位置
      const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
      let x = 0, y = 0;
      if (edge === 0) { x = Math.random() * 100; y = Math.random() * 20; }
      else if (edge === 1) { x = 80 + Math.random() * 20; y = Math.random() * 100; }
      else if (edge === 2) { x = Math.random() * 100; y = 80 + Math.random() * 20; }
      else { x = Math.random() * 20; y = Math.random() * 100; }
      
      points.push({
        x,
        y,
        size: 80 + Math.random() * 120,
        delay: Math.random() * 2
      });
    }
    return points;
  }, [stage]);

  // 生成蔓藤路径 - Stage 1 开始显示
  const vinePaths = useMemo(() => {
    if (stage < 1) return [];
    // Stage 1: 轻微蔓藤，Stage 2+: 更多蔓藤
    // 使用 0-100 坐标系
    const basePaths = [
      // 左上角蔓藤
      'M0,0 Q30,20 15,60 Q5,80 20,120 Q10,150 0,180',
      // 右上角蔓藤  
      'M100,0 Q95,25 98,70 Q96,100 99,140',
    ];
    if (stage >= 2) {
      // 添加更多蔓藤
      basePaths.push(
        // 左下角蔓藤
        'M0,100 Q25,95 10,85 Q30,75 5,65',
        // 右下角蔓藤
        'M100,100 Q96,92 98,82'
      );
    }
    return basePaths;
  }, [stage]);

  if (stage === 0) return null;

  // 根据 stage 计算不同参数
  const vignetteOpacity = stage === 1 ? 0.6 : stage === 2 ? 0.85 : 1;
  const noiseOpacity = stage === 1 ? 0.15 : stage === 2 ? 0.25 : 0.4;
  const vignetteIntensity = stage === 3 ? '20%' : '30%';

  return (
    <AnimatePresence>
      {/* 基础暗角层 */}
      <motion.div
        key="corruption-vignette"
        initial={{ opacity: 0 }}
        animate={{ opacity: vignetteOpacity }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: `
            radial-gradient(
              ellipse at center,
              transparent ${vignetteIntensity},
              rgba(40, 10, 10, 0.3) 50%,
              rgba(20, 5, 5, 0.6) 70%,
              rgba(10, 0, 0, 0.9) 100%
            )
          `
        }}
      />

      {/* 噪点纹理层 - 使用 SVG filter */}
      <motion.div
        key="corruption-noise"
        initial={{ opacity: 0 }}
        animate={{ opacity: noiseOpacity }}
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

      {/* 边缘裂纹装饰 - SVG (Stage 1 开始显示) */}
      {stage >= 1 && (
        <motion.svg
          key="corruption-cracks"
          className="absolute inset-0 w-full h-full pointer-events-none z-[5]"
          initial={{ opacity: 0 }}
          animate={{ opacity: stage === 3 ? 0.6 : stage === 2 ? 0.4 : 0.25 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, delay: 0.5 }}
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="crack-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(60, 10, 10, 0.8)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="vine-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(30, 15, 5, 0.9)" />
              <stop offset="50%" stopColor="rgba(20, 10, 5, 0.7)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          {/* 左上角裂纹 */}
          <path
            d="M0,0 L0,80 Q10,60 5,40 Q15,30 10,15 Q20,10 30,0 Z"
            fill="url(#crack-gradient)"
          />
          {/* 右上角裂纹 */}
          <path
            d="M100,0 L95,0 Q96,15 98,10 Q99,25 100,60 Z"
            fill="url(#crack-gradient)"
          />
          {/* 左下角裂纹 */}
          <path
            d="M0,100 L30,100 Q15,97 10,95 Q20,92 0,88 Z"
            fill="url(#crack-gradient)"
          />
          {/* 右下角裂纹 */}
          <path
            d="M100,100 L100,88 Q96,92 98,95 Q97,97 95,100 Z"
            fill="url(#crack-gradient)"
          />
          {/* 蔓藤装饰 */}
          {vinePaths.map((path, idx) => (
            <motion.path
              key={`vine-${idx}`}
              d={path}
              stroke="rgba(40, 20, 10, 0.6)"
              strokeWidth={stage === 3 ? 0.5 : 0.3} // Adjusted stroke width for 0-100 scale
              fill="none"
              vectorEffect="non-scaling-stroke" // Keep stroke width consistent
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, delay: idx * 0.3, ease: 'easeOut' }}
            />
          ))}
        </motion.svg>
      )}

      {/* Stage 3: 老电影噪点滤镜效果 */}
      {stage === 3 && (
        <motion.div
          key="film-grain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 pointer-events-none z-[6]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'overlay',
          }}
        />
      )}

      {/* Stage 3: 脉动边框效果 */}
      {stage === 3 && (
        <motion.div
          key="pulsing-border"
          className="absolute inset-0 pointer-events-none z-[7]"
          animate={{
            boxShadow: [
              'inset 0 0 100px rgba(80, 0, 0, 0.4)',
              'inset 0 0 150px rgba(100, 0, 0, 0.6)',
              'inset 0 0 100px rgba(80, 0, 0, 0.4)',
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </AnimatePresence>
  );
};

export default CorruptionOverlay;
