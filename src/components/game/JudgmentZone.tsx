 
import React, { useEffect, useRef, useMemo } from 'react';
import Matter from 'matter-js';
import { useStore } from '../../store';
import { useSoundEffect } from '../../hooks/useSoundEffect';

interface JudgmentZoneProps {
    width?: number;
    height?: number;
}

// 时钟表盘组件
const ClockFace: React.FC<{ 
    width: number; 
    height: number; 
    voteProgress: number; // 0-1，表示投票进度
    isOverHalf: boolean;
}> = ({ width, height, voteProgress, isOverHalf }) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const clockRadius = Math.min(width, height) * 0.4;
    
    // 时钟指针角度 (从12点位置开始，顺时针旋转)
    const handAngle = -90 + (voteProgress * 360); // -90 使指针从12点开始
    
    // 罗马数字
    const romanNumerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    
    return (
        <svg 
            className="absolute inset-0 pointer-events-none" 
            width={width} 
            height={height}
            style={{ zIndex: 0 }}
        >
            {/* 红色辉光（超过半数时） */}
            {isOverHalf && (
                <defs>
                    <filter id="red-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="8" result="blur"/>
                        <feFlood floodColor="#dc2626" floodOpacity="0.6" result="color"/>
                        <feComposite in="color" in2="blur" operator="in" result="glow"/>
                        <feMerge>
                            <feMergeNode in="glow"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
            )}
            
            {/* 外圈装饰 */}
            <circle 
                cx={centerX} 
                cy={centerY} 
                r={clockRadius + 5}
                fill="none"
                stroke="#44403c"
                strokeWidth="2"
                opacity="0.5"
            />
            
            {/* 时钟表盘背景 */}
            <circle 
                cx={centerX} 
                cy={centerY} 
                r={clockRadius}
                fill="rgba(28, 25, 23, 0.3)"
                stroke={isOverHalf ? "#dc2626" : "#78716c"}
                strokeWidth="2"
                filter={isOverHalf ? "url(#red-glow)" : undefined}
            />
            
            {/* 刻度线 */}
            {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const innerR = clockRadius - 15;
                const outerR = clockRadius - 5;
                const x1 = centerX + Math.cos(angle) * innerR;
                const y1 = centerY + Math.sin(angle) * innerR;
                const x2 = centerX + Math.cos(angle) * outerR;
                const y2 = centerY + Math.sin(angle) * outerR;
                
                return (
                    <line
                        key={i}
                        x1={x1} y1={y1}
                        x2={x2} y2={y2}
                        stroke="#78716c"
                        strokeWidth={i % 3 === 0 ? 2 : 1}
                        opacity="0.6"
                    />
                );
            })}
            
            {/* 罗马数字 (只显示主要的4个) */}
            {[0, 3, 6, 9].map((i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const numRadius = clockRadius - 28;
                const x = centerX + Math.cos(angle) * numRadius;
                const y = centerY + Math.sin(angle) * numRadius;
                
                return (
                    <text
                        key={i}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#a8a29e"
                        fontSize="10"
                        fontFamily="Cinzel, serif"
                        opacity="0.7"
                    >
                        {romanNumerals[i]}
                    </text>
                );
            })}
            
            {/* 时针（投票进度） */}
            <line
                x1={centerX}
                y1={centerY}
                x2={centerX + Math.cos((handAngle) * Math.PI / 180) * (clockRadius * 0.5)}
                y2={centerY + Math.sin((handAngle) * Math.PI / 180) * (clockRadius * 0.5)}
                stroke={isOverHalf ? "#dc2626" : "#d6d3d1"}
                strokeWidth="3"
                strokeLinecap="round"
                style={{
                    transition: 'all 0.5s ease-out',
                    filter: isOverHalf ? 'drop-shadow(0 0 4px #dc2626)' : 'none'
                }}
            />
            
            {/* 分针（更长的指针） */}
            <line
                x1={centerX}
                y1={centerY}
                x2={centerX + Math.cos((handAngle) * Math.PI / 180) * (clockRadius * 0.7)}
                y2={centerY + Math.sin((handAngle) * Math.PI / 180) * (clockRadius * 0.7)}
                stroke={isOverHalf ? "#ef4444" : "#a8a29e"}
                strokeWidth="2"
                strokeLinecap="round"
                style={{
                    transition: 'all 0.5s ease-out',
                    filter: isOverHalf ? 'drop-shadow(0 0 3px #ef4444)' : 'none'
                }}
            />
            
            {/* 中心点 */}
            <circle 
                cx={centerX} 
                cy={centerY} 
                r="5"
                fill={isOverHalf ? "#dc2626" : "#78716c"}
                stroke="#44403c"
                strokeWidth="1"
            />
        </svg>
    );
};

export const JudgmentZone: React.FC<JudgmentZoneProps> = ({ width = 300, height = 300 }) => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    
    const { gameState } = useStore();
    const { playSound } = useSoundEffect();
    const voteHistory = gameState?.voteHistory || [];
    const latestVote = voteHistory.length > 0 ? voteHistory[voteHistory.length - 1] : null;
    const currentVotes = latestVote?.votes || [];
    
    const addedVotesRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!sceneRef.current) return;

        const Engine = Matter.Engine,
              Render = Matter.Render,
              Runner = Matter.Runner,
              Bodies = Matter.Bodies,
              Composite = Matter.Composite,
              World = Matter.World;

        const engine = Engine.create();
        engineRef.current = engine;

        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width,
                height,
                wireframes: false,
                background: 'transparent',
                pixelRatio: window.devicePixelRatio,
            }
        });
        renderRef.current = render;

        // --- Circular Boundaries ---
        // Create a set of rectangles arranged in a circle to form a container
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * 0.45; // Slightly larger than visual clock
        const segments = 24;
        const wallThickness = 50;
        const walls: Matter.Body[] = [];

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = cx + Math.cos(angle) * (radius + wallThickness / 2);
            const y = cy + Math.sin(angle) * (radius + wallThickness / 2);
            
            const wall = Bodies.rectangle(x, y, wallThickness, 100, {
                isStatic: true,
                angle: angle + Math.PI / 2,
                render: { visible: false } // Invisible physics walls
            });
            walls.push(wall);
        }

        // Add a "floor" sensor or just rely on the circle?
        // The circle should hold them.

        Composite.add(engine.world, walls);

        // Custom Rendering for Chips (Shadows & Highlights)
        if (render.context && typeof Matter.Events?.on === 'function') {
            Matter.Events.on(render, 'afterRender', () => {
                const ctx = render.context;
                if (!ctx) return;
                const bodies = Matter.Composite.allBodies(engine.world);
                
                bodies.filter(b => !b.isStatic).forEach(body => {
                    const pos = body.position;
                    const radius = 15;
                    
                    // Shadow
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(pos.x + 2, pos.y + 2, radius, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.fill();
                    ctx.restore();
                    
                    // Body (Gradient)
                    ctx.save();
                    const gradient = ctx.createRadialGradient(
                        pos.x - 5, pos.y - 5, 0,
                        pos.x, pos.y, radius
                    );
                    const baseColor = body.render.fillStyle! as string;
                    gradient.addColorStop(0, '#ffffff'); // Highlight
                    gradient.addColorStop(0.3, baseColor);
                    gradient.addColorStop(1, '#000000'); // Shadow edge
                    
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();
                    
                    // Border
                    ctx.strokeStyle = body.render.strokeStyle! as string;
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Text (Name) - Simplified
                    // ctx.fillStyle = '#fff';
                    // ctx.font = '10px Arial';
                    // ctx.textAlign = 'center';
                    // ctx.fillText(body.label.substring(0, 2), pos.x, pos.y + 4);

                    ctx.restore();
                });
            });
        }

        Render.run(render);
        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);

        return () => {
            Render.stop(render);
            Runner.stop(runner);
            if (render.canvas) render.canvas.remove();
            World.clear(engine.world, false);
            Engine.clear(engine);
        };
    }, [width, height]);

    // Handle Votes (Chips)
    useEffect(() => {
        if (!engineRef.current || !latestVote) return;

        const newVotes = currentVotes.filter(seatId => !addedVotesRef.current.has(seatId));
        
        if (newVotes.length > 0) {
            newVotes.forEach(seatId => {
                // ... (existing chip spawning logic)
                const seat = gameState?.seats.find(s => s.id === seatId);
                const userName = seat?.userName || `Seat ${seatId}`;
                
                // Spawn from top edges randomly
                const angle = -Math.PI / 2 + (Math.random() * 0.5 - 0.25); // Top cone
                const spawnRadius = Math.min(width, height) * 0.4;
                const x = (width / 2) + Math.cos(angle) * spawnRadius;
                const y = (height / 2) + Math.sin(angle) * spawnRadius;

                const chip = Matter.Bodies.circle(x, y, 15, {
                    restitution: 0.6,
                    friction: 0.005,
                    density: 0.04,
                    render: {
                        fillStyle: seat?.isDead ? '#57534e' : '#f59e0b',
                        strokeStyle: seat?.isDead ? '#292524' : '#b45309',
                    },
                    label: userName
                });

                // Apply initial force towards center
                Matter.Body.setVelocity(chip, {
                    x: (width/2 - x) * 0.05 + (Math.random() - 0.5) * 2,
                    y: (height/2 - y) * 0.05 + (Math.random() - 0.5) * 2
                });

                Matter.Composite.add(engineRef.current!.world, chip);
                addedVotesRef.current.add(seatId);
                playSound('chip_drop');
            });
        }
    }, [currentVotes, gameState, width, height, playSound]);

    // Play Gavel sound on vote conclusion
    useEffect(() => {
        if (voteHistory.length > 0) {
            // Check if the last vote was just added (simple check: mount or update)
            // Ideally we want to track prev length, but for now playing on length change is okay
            // provided we don't play on initial load if it's old history.
            // A better way is to check timestamp or just rely on the fact that this component
            // is likely always mounted or we accept a sound on rejoin.
            // For now, let's assume if it's a recent vote (within last 5 seconds)
            const lastVote = voteHistory[voteHistory.length - 1];
            if (lastVote && Date.now() - lastVote.timestamp < 5000) {
                 playSound('gavel');
            }
        }
    }, [voteHistory.length, playSound]);

    // Reset
    useEffect(() => {
        addedVotesRef.current.clear();
        if (engineRef.current) {
            const bodies = Matter.Composite.allBodies(engineRef.current.world);
            const chips = bodies.filter(b => !b.isStatic);
            Matter.Composite.remove(engineRef.current.world, chips);
        }
    }, [gameState?.voting?.nomineeSeatId]);

    const { voteProgress, isOverHalf } = useMemo(() => {
        const totalPlayers = gameState?.seats.filter(s => s.roleId && !s.isDead).length || 1;
        const requiredVotes = Math.ceil(totalPlayers / 2);
        const currentVoteCount = currentVotes.length;
        return { 
            voteProgress: Math.min(currentVoteCount / totalPlayers, 1), 
            isOverHalf: currentVoteCount >= requiredVotes 
        };
    }, [gameState?.seats, currentVotes.length]);

    return (
        <div className="relative mx-auto rounded-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]" style={{ width, height }}>
            {/* Background Image (Placeholder) */}
            <div className="absolute inset-0 bg-[#1c1917]">
                 {/* Placeholder for clock_face_stone.png */}
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-50" />
                 <div className="absolute inset-0 rounded-full border-[10px] border-[#292524]" />
            </div>

            {/* Clock Face SVG Overlay */}
            <ClockFace 
                width={width} 
                height={height} 
                voteProgress={voteProgress}
                isOverHalf={isOverHalf}
            />
            
            {/* Physics Canvas */}
            <div ref={sceneRef} className="absolute inset-0" style={{ zIndex: 10 }} />
            
            {/* Counter */}
            <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 z-20 px-4 py-1 rounded-full border ${
                isOverHalf ? 'bg-red-900/80 border-red-500 text-red-100' : 'bg-black/60 border-stone-600 text-stone-300'
            } font-cinzel font-bold backdrop-blur-sm transition-colors duration-300`}>
                {currentVotes.length} VOTES
            </div>
        </div>
    );
};
