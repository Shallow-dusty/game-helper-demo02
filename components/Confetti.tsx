import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
    active: boolean;
    colors?: string[];
}

interface Particle {
    x: number;
    y: number;
    w: number;
    h: number;
    vx: number;
    vy: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
}

export const Confetti: React.FC<ConfettiProps> = ({ active, colors = ['#ef4444', '#3b82f6', '#fbbf24', '#10b981', '#8b5cf6'] }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!active) {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
                animationIdRef.current = null;
            }
            // Clear canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize handler
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        // Initialize particles
        const particleCount = 150;
        particlesRef.current = [];
        for (let i = 0; i < particleCount; i++) {
            particlesRef.current.push(createParticle(canvas.width, canvas.height, colors));
        }

        // Animation Loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;

                // Reset if out of bounds
                if (p.y > canvas.height) {
                    particlesRef.current[i] = createParticle(canvas.width, canvas.height, colors, true);
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
            });

            animationIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, [active, colors]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[100]"
            style={{ width: '100%', height: '100%' }}
        />
    );
};

function createParticle(width: number, height: number, colors: string[], top = false): Particle {
    return {
        x: Math.random() * width,
        y: top ? -20 : Math.random() * height - height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 10 + 5,
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)] || '#ffffff',
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.2
    };
}
