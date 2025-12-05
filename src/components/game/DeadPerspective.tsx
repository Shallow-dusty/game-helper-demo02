import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeadPerspectiveProps {
  isActive: boolean;
}

/**
 * 亡者视界 (Shroud of the Dead)
 * - Visual filter for dead players.
 * - Desaturates colors, adds cold blue tint, and slight blur.
 */
export const DeadPerspective: React.FC<DeadPerspectiveProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 2 }}
        className="fixed inset-0 pointer-events-none z-[95] mix-blend-hard-light"
        style={{
          backdropFilter: 'grayscale(80%) sepia(20%) hue-rotate(180deg) blur(1px)',
          background: 'linear-gradient(to bottom, rgba(10, 20, 30, 0.4), rgba(0, 10, 20, 0.6))'
        }}
      >
        {/* Ghostly Vignette */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, transparent 40%, rgba(0, 10, 20, 0.8) 100%)'
          }}
        />
        
        {/* Floating Particles (Optional, CSS only for performance) */}
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse"></div>
      </motion.div>
    </AnimatePresence>
  );
};
