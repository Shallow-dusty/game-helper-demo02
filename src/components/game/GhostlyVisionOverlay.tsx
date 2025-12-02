import React from 'react';
import { motion } from 'framer-motion';
import { Ghost, Eye } from 'lucide-react';

interface GhostlyVisionOverlayProps {
  /** 是否启用亡者视界 */
  isActive: boolean;
  /** 玩家名称 */
  playerName?: string;
}

/**
 * "亡者视界" (Ghostly Vision) - 死亡玩家滤镜效果
 * 
 * 当玩家死亡后，其界面会呈现：
 * - 灰度/褪色滤镜效果
 * - 幽灵般的边缘发光
 * - 浮动的幽灵粒子
 * - 顶部"亡者视界"标识
 */
export const GhostlyVisionOverlay: React.FC<GhostlyVisionOverlayProps> = ({
  isActive,
  playerName
}) => {
  if (!isActive) return null;

  return (
    <>
      {/* 全局滤镜效果 - 使用 CSS filter 应用到整个页面 */}
      <style>{`
        .ghostly-vision-active {
          filter: saturate(0.3) brightness(0.85) contrast(1.1);
          transition: filter 1s ease-in-out;
        }
        .ghostly-vision-active::after {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            135deg,
            rgba(100, 116, 139, 0.1) 0%,
            transparent 50%,
            rgba(71, 85, 105, 0.15) 100%
          );
          z-index: 9998;
        }
      `}</style>

      {/* 幽灵边框效果 */}
      <div 
        className="fixed inset-0 pointer-events-none z-[1050]"
        style={{
          boxShadow: 'inset 0 0 100px rgba(148, 163, 184, 0.3), inset 0 0 200px rgba(71, 85, 105, 0.2)',
        }}
      />

      {/* 顶部亡者视界标识 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[1051] pointer-events-none"
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-full border border-slate-700/50 shadow-lg">
          <Ghost className="w-5 h-5 text-slate-400 animate-pulse" />
          <span className="text-sm font-cinzel text-slate-300">亡者视界</span>
          <Eye className="w-4 h-4 text-slate-500" />
        </div>
      </motion.div>

      {/* 角落幽灵提示 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-20 left-4 z-[1051] pointer-events-none"
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/60 backdrop-blur-sm rounded-lg border border-slate-800/50">
          <div className="relative">
            <Ghost className="w-8 h-8 text-slate-500" />
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute inset-0"
            >
              <Ghost className="w-8 h-8 text-slate-400 blur-sm" />
            </motion.div>
          </div>
          <div className="text-xs">
            <p className="text-slate-400 font-cinzel">{playerName || '你'}</p>
            <p className="text-slate-500">已成为亡者</p>
          </div>
        </div>
      </motion.div>

      {/* 浮动幽灵粒子 */}
      <div className="fixed inset-0 pointer-events-none z-[1049] overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: `${Math.random() * 100}vw`,
              y: '110vh'
            }}
            animate={{ 
              opacity: [0, 0.4, 0],
              y: '-10vh',
              x: `${Math.random() * 100}vw`
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: i * 2,
              ease: 'linear'
            }}
            className="absolute"
          >
            <Ghost 
              className="text-slate-600/30" 
              style={{ 
                width: `${20 + Math.random() * 30}px`,
                height: `${20 + Math.random() * 30}px`
              }}
            />
          </motion.div>
        ))}
      </div>

      {/* 底部雾气效果 */}
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-[1048]"
        style={{
          background: 'linear-gradient(to top, rgba(71, 85, 105, 0.4) 0%, transparent 100%)',
        }}
      />
    </>
  );
};

/**
 * Hook: 检测当前用户是否处于亡者状态
 */
export const useGhostlyVision = (isDead: boolean, isEnabled = true) => {
  React.useEffect(() => {
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

  return isDead && isEnabled;
};

export default GhostlyVisionOverlay;
