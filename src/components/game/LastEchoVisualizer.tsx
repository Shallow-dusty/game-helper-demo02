import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface LastEchoVisualizerProps {
  isActive: boolean;
  seatId: number;
}

/**
 * 最后回响 (Last Echo)
 * Visualizes audio input from a player.
 * Currently simulates audio levels with random data for visual effect.
 */
export const LastEchoVisualizer: React.FC<LastEchoVisualizerProps> = ({ isActive, seatId }) => {
  const [levels, setLevels] = useState<number[]>(new Array(10).fill(0));
  const requestRef = useRef<number>();

  useEffect(() => {
    if (!isActive) {
      setLevels(new Array(10).fill(0));
      return;
    }

    const animate = () => {
      // Simulate audio data
      const newLevels = Array.from({ length: 10 }, () => Math.random() * 100);
      setLevels(newLevels);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="flex items-end justify-center gap-1 h-12 w-24 pointer-events-none">
      {levels.map((level, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-cyan-400/80 rounded-t-sm shadow-[0_0_5px_rgba(34,211,238,0.5)]"
          animate={{ height: `${level}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      ))}
    </div>
  );
};
