import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun } from 'lucide-react';
import { useSoundEffect } from '../../hooks/useSoundEffect';

interface DawnAnimationProps {
  isActive: boolean;
  onComplete?: () => void;
}

export const DawnAnimation: React.FC<DawnAnimationProps> = ({ isActive, onComplete }) => {
  const { playSound } = useSoundEffect();

  useEffect(() => {
    if (isActive) {
      playSound('morning_crow'); // Or a majestic dawn sound
      const timer = setTimeout(() => {
        onComplete?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete, playSound]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
      >
        {/* Blinding Light Background */}
        <motion.div
          className="absolute inset-0 bg-amber-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 4, times: [0, 0.3, 1] }}
        />

        {/* Sun Rays */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ rotate: 0, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 45, scale: 1.5, opacity: [0, 1, 0] }}
          transition={{ duration: 4, ease: "easeOut" }}
        >
          <div className="w-[200vw] h-[200vw] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,200,100,0.3)_10deg,transparent_20deg)] rounded-full" />
        </motion.div>

        {/* Sun Icon */}
        <motion.div
          className="relative z-10 text-amber-500 drop-shadow-[0_0_50px_rgba(255,160,0,0.8)]"
          initial={{ y: 50, opacity: 0, scale: 0.5 }}
          animate={{ y: 0, opacity: [0, 1, 0], scale: 1.2 }}
          transition={{ duration: 3, ease: "easeOut" }}
        >
          <Sun className="w-32 h-32" />
        </motion.div>

        {/* Text */}
        <motion.div
          className="absolute bottom-1/4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: [0, 1, 0], y: 0 }}
          transition={{ duration: 3, delay: 0.5 }}
        >
          <h1 className="text-4xl font-cinzel font-bold text-amber-900 tracking-[0.5em]">DAWN BREAKS</h1>
          <p className="text-amber-800/60 font-serif mt-2 italic">The night has ended...</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
