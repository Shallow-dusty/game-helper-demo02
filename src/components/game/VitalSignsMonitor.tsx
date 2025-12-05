import React from 'react';
import { motion } from 'framer-motion';

interface VitalSignsMonitorProps {
  status: 'ALIVE' | 'DEAD' | 'POISONED' | 'DRUNK';
}

/**
 * 生命体征 (Vital Signs)
 * ECG-style heartbeat animation.
 */
export const VitalSignsMonitor: React.FC<VitalSignsMonitorProps> = ({ status }) => {
  const color = status === 'DEAD' ? '#44403c' : status === 'POISONED' || status === 'DRUNK' ? '#d97706' : '#22c55e';
  const speed = status === 'DEAD' ? 0 : status === 'POISONED' || status === 'DRUNK' ? 0.5 : 1.5;

  return (
    <div className="w-20 h-8 overflow-hidden relative bg-black/40 rounded border border-stone-800/50">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(transparent_1px,transparent_1px),linear-gradient(90deg,#333_1px,transparent_1px)] bg-[size:4px_4px]" />
      
      {/* ECG Line */}
      <svg viewBox="0 0 100 40" className="w-full h-full">
        <motion.path
          d="M0,20 L10,20 L15,10 L20,30 L25,20 L35,20 L40,5 L45,35 L50,20 L100,20"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, x: -100 }}
          animate={status === 'DEAD' 
            ? { pathLength: 1, x: 0 } 
            : { x: [0, -100] }
          }
          transition={status === 'DEAD' 
            ? { duration: 0 } 
            : { duration: 2 / speed, repeat: Infinity, ease: "linear" }
          }
        />
        {/* Flatline for Dead */}
        {status === 'DEAD' && (
           <line x1="0" y1="20" x2="100" y2="20" stroke={color} strokeWidth="2" />
        )}
      </svg>
    </div>
  );
};
