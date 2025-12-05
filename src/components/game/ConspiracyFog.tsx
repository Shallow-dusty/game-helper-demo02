import React, { useEffect, useRef } from 'react';

interface ConspiracyFogProps {
  width: number;
  height: number;
  intensity?: number; // 0-1
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  opacity: number;
}

/**
 * 密谋迷雾 (Conspiracy Fog)
 * Canvas-based particle system for drifting fog.
 */
export const ConspiracyFog: React.FC<ConspiracyFogProps> = ({ width, height, intensity = 0.5 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const createParticle = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2, // Slower movement
      vy: (Math.random() - 0.5) * 0.2,
      size: 60 + Math.random() * 120, // Slightly larger, softer puffs
      life: 0,
      maxLife: 300 + Math.random() * 300, // Longer life
      opacity: 0
    });

    // Init particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 30 * intensity; i++) { // Reduced density
        particlesRef.current.push(createParticle());
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Update and draw particles
      particlesRef.current.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        // Fade in/out
        if (p.life < 100) p.opacity = (p.life / 100) * 0.2 * intensity; // Slower fade in
        else if (p.life > p.maxLife - 100) p.opacity = ((p.maxLife - p.life) / 100) * 0.2 * intensity;

        // Reset if dead or out of bounds
        if (p.life >= p.maxLife || p.x < -150 || p.x > width + 150 || p.y < -150 || p.y > height + 150) {
          particlesRef.current[i] = createParticle();
        }

        // Draw fog puff
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(180, 200, 220, ${p.opacity})`); // Cool blue-grey
        gradient.addColorStop(1, 'rgba(180, 200, 220, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [width, height, intensity]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="absolute inset-0 pointer-events-none z-[15] mix-blend-screen opacity-60"
    />
  );
};
