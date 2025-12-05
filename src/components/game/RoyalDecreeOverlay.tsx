import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, X } from 'lucide-react';
import { useSoundEffect } from '../../hooks/useSoundEffect';

interface RoyalDecreeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  author?: string; // e.g., "The King", "Town Crier"
}

export const RoyalDecreeOverlay: React.FC<RoyalDecreeOverlayProps> = ({ 
  isOpen, 
  onClose, 
  title = "Royal Decree", 
  message,
  author = "By Order of the King"
}) => {
  const { playSound } = useSoundEffect();

  useEffect(() => {
    if (isOpen) {
      playSound('notification'); // Ideally a 'scroll_unroll' sound
    }
  }, [isOpen, playSound]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className="relative w-full max-w-lg"
          >
            {/* Parchment Background */}
            <div className="relative bg-[#f5e6d3] text-[#2c1810] p-12 rounded-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
              {/* Texture Overlay */}
              <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] pointer-events-none mix-blend-multiply"></div>
              <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(139,69,19,0.3)] pointer-events-none"></div>
              
              {/* Ragged Edges (CSS Mask or SVG would be better, simple border radius for now) */}
              
              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center gap-6">
                <div className="mb-2">
                  <Scroll className="w-12 h-12 text-[#8b4513] opacity-80" />
                </div>
                
                <h2 className="text-3xl font-cinzel font-bold tracking-widest text-[#8b4513] border-b-2 border-[#8b4513]/30 pb-2 w-full">
                  {title}
                </h2>
                
                <p className="font-serif text-lg leading-relaxed italic text-[#4a3728]">
                  "{message}"
                </p>
                
                <div className="mt-4 pt-4 border-t border-[#8b4513]/20 w-full flex flex-col items-center gap-2">
                  <span className="font-cinzel text-sm font-bold text-[#8b4513] uppercase tracking-widest">
                    {author}
                  </span>
                  {/* Wax Seal */}
                  <motion.div 
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="w-16 h-16 rounded-full bg-[#800000] shadow-lg flex items-center justify-center border-4 border-[#600000] mt-2"
                  >
                    <span className="font-cinzel text-[#cc0000] text-2xl font-bold drop-shadow-md">R</span>
                  </motion.div>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-[#8b4513]/50 hover:text-[#8b4513] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
