import React, { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, FlameKindling } from 'lucide-react';

interface CandlelightOverlayProps {
  width: number;
  height: number;
  isActive?: boolean;
}

/**
 * 烛光守夜模式 (Candlelight Night)
 * - 全屏 95% 黑暗遮罩
 * - 鼠标/手指位置化为"烛光"，仅照亮光圈内区域
 * - 光圈边缘羽化，模拟真实光源
 * - 扫过死亡玩家座位时可触发环境音效
 */
export const CandlelightOverlay: React.FC<CandlelightOverlayProps> = ({ width, height, isActive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const mousePos = useRef({ x: width / 2, y: height / 2 });
  const targetPos = useRef({ x: width / 2, y: height / 2 });
  const flickerOffset = useRef({ x: 0, y: 0 });
  
  // 烛光参数
  const CANDLE_RADIUS = 120; // 基础光圈半径
  const FLICKER_INTENSITY = 8; // 闪烁强度
  const SMOOTHING = 0.15; // 移动平滑度
  const DARKNESS_OPACITY = 0.92; // 黑暗遮罩透明度

  // 处理鼠标/触摸移动
  const handlePointerMove = useCallback((e: React.PointerEvent | PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      targetPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, []);

  // 渲染循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const flickerSpeed = 0.003;

    const render = (time: number) => {
      // 平滑移动
      mousePos.current.x += (targetPos.current.x - mousePos.current.x) * SMOOTHING;
      mousePos.current.y += (targetPos.current.y - mousePos.current.y) * SMOOTHING;

      // 烛光闪烁效果
      flickerOffset.current.x = Math.sin(time * flickerSpeed) * FLICKER_INTENSITY;
      flickerOffset.current.y = Math.cos(time * flickerSpeed * 1.3) * FLICKER_INTENSITY * 0.7;

      const candleX = mousePos.current.x + flickerOffset.current.x;
      const candleY = mousePos.current.y + flickerOffset.current.y;

      // 动态光圈大小（呼吸效果）
      const breathingRadius = CANDLE_RADIUS + Math.sin(time * 0.002) * 10;

      // 清除画布
      ctx.clearRect(0, 0, width, height);

      // 创建遮罩
      ctx.save();
      ctx.fillStyle = `rgba(5, 2, 2, ${DARKNESS_OPACITY})`;
      ctx.fillRect(0, 0, width, height);

      // 创建烛光渐变
      const gradient = ctx.createRadialGradient(
        candleX, candleY, 0,
        candleX, candleY, breathingRadius
      );
      
      // 多层渐变模拟真实烛光
      gradient.addColorStop(0, 'rgba(0, 0, 0, 1)'); // 中心完全透明（显示底层）
      gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.95)');
      gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      // 使用 destination-out 混合模式"挖洞"
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(candleX, candleY, breathingRadius, 0, Math.PI * 2);
      ctx.fill();

      // 添加温暖的烛光色调
      ctx.globalCompositeOperation = 'source-over';
      const warmGlow = ctx.createRadialGradient(
        candleX, candleY, 0,
        candleX, candleY, breathingRadius * 0.8
      );
      warmGlow.addColorStop(0, 'rgba(255, 180, 80, 0.15)');
      warmGlow.addColorStop(0.5, 'rgba(255, 120, 40, 0.08)');
      warmGlow.addColorStop(1, 'rgba(255, 80, 20, 0)');
      
      ctx.fillStyle = warmGlow;
      ctx.beginPath();
      ctx.arc(candleX, candleY, breathingRadius * 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    // 添加全局指针事件监听
    const handleGlobalPointerMove = (e: PointerEvent) => handlePointerMove(e);
    window.addEventListener('pointermove', handleGlobalPointerMove);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('pointermove', handleGlobalPointerMove);
    };
  }, [width, height, handlePointerMove]);

  // 不在夜晚或烛光未激活时不渲染
  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
        className="absolute inset-0 pointer-events-none z-[100]"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full"
          style={{ pointerEvents: 'none' }}
        />
        
        {/* 烛光图标指示器（可选，跟随鼠标） */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: mousePos.current.x - 12,
            top: mousePos.current.y - 24,
            filter: 'drop-shadow(0 0 8px rgba(255, 150, 50, 0.8))'
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Flame className="w-6 h-6 text-amber-400" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * ST 防窥开关按钮
 */
interface CandlelightToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export const CandlelightToggle: React.FC<CandlelightToggleProps> = ({ enabled, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300
        ${enabled 
          ? 'bg-amber-900/50 border border-amber-600/50 text-amber-400' 
          : 'bg-stone-900/50 border border-stone-700/50 text-stone-500'
        }
        hover:border-amber-500/50 hover:text-amber-300
      `}
      title={enabled ? '关闭烛光模式' : '开启烛光模式（防窥）'}
    >
      {enabled ? (
        <Flame className="w-4 h-4" />
      ) : (
        <FlameKindling className="w-4 h-4" />
      )}
      <span className="text-xs font-cinzel">
        {enabled ? '烛光开启' : '烛光关闭'}
      </span>
    </button>
  );
};

export default CandlelightOverlay;
