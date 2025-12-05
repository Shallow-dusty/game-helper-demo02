import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSoundEffect } from '../../hooks/useSoundEffect';

interface BloodPactEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

export const BloodPactEffect: React.FC<BloodPactEffectProps> = ({ isActive, onComplete }) => {
  const { playSound } = useSoundEffect();

  useEffect(() => {
    if (isActive) {
      playSound('death_toll');
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete, playSound]);

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[160] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Red Flash */}
        <motion.div
          className="absolute inset-0 bg-red-950 mix-blend-multiply"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.5 }}
        />

        {/* Blood Splatter (SVG) */}
        <motion.svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full opacity-80 mix-blend-multiply"
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, 0.8, 0] }}
          transition={{ duration: 2, ease: "circOut" }}
        >
          <defs>
            <radialGradient id="blood-grad">
              <stop offset="0%" stopColor="#8a0303" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <path
            d="M50,50 Q60,40 70,50 T90,50 T50,90 T10,50 T30,50"
            fill="url(#blood-grad)"
            filter="blur(2px)"
          />
          <circle cx="40" cy="40" r="5" fill="#600000" />
          <circle cx="60" cy="60" r="8" fill="#600000" />
          <circle cx="30" cy="70" r="3" fill="#600000" />
        </motion.svg>

        {/* Contract Symbol */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ scale: 0.8, opacity: 0, rotate: -45 }}
          animate={{ scale: 1.2, opacity: [0, 1, 0], rotate: 0 }}
          transition={{ duration: 2.5 }}
        >
          <div className="w-64 h-64 border-4 border-red-900 rounded-full flex items-center justify-center opacity-50">
             <div className="w-48 h-48 border-2 border-red-800 rotate-45" />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
