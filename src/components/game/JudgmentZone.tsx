 
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
    const voteHistory = gameState?.voteHistory ?? [];
    const latestVote = voteHistory.length > 0 ? voteHistory[voteHistory.length - 1] : null;
    const currentVotes = latestVote?.votes ?? [];
    
    // Track added bodies to avoid duplicates
    const addedVotesRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!sceneRef.current) return;

        // Setup Matter JS
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
                // 启用阴影
                hasBounds: false,
            }
        });
        renderRef.current = render;

        // Boundaries
        const ground = Bodies.rectangle(width / 2, height + 30, width, 60, { isStatic: true, render: { visible: false } });
        const leftWall = Bodies.rectangle(-30, height / 2, 60, height, { isStatic: true, render: { visible: false } });
        const rightWall = Bodies.rectangle(width + 30, height / 2, 60, height, { isStatic: true, render: { visible: false } });
        
        // Funnel/Bowl shape (optional)
        const leftSlope = Bodies.rectangle(0, height - 50, 200, 20, { 
            isStatic: true, 
            angle: Math.PI / 4,
            render: { fillStyle: '#292524' }
        });
        const rightSlope = Bodies.rectangle(width, height - 50, 200, 20, { 
            isStatic: true, 
            angle: -Math.PI / 4,
            render: { fillStyle: '#292524' }
        });

        Composite.add(engine.world, [ground, leftWall, rightWall, leftSlope, rightSlope]);

        // 自定义渲染：添加3D阴影效果
        Matter.Events.on(render, 'afterRender', () => {
            const ctx = render.context;
            const bodies = Matter.Composite.allBodies(engine.world);

            bodies.filter(b => !b.isStatic).forEach(body => {
                const pos = body.position;
                const radius = 15;

                // 绘制阴影
                ctx.save();
                ctx.beginPath();
                ctx.arc(pos.x + 3, pos.y + 3, radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fill();
                ctx.restore();

                // 绘制内部高光渐变
                ctx.save();
                const gradient = ctx.createRadialGradient(
                    pos.x - 4, pos.y - 4, 0,
                    pos.x, pos.y, radius
                );
                const baseColor = body.render.fillStyle ?? '#f59e0b';
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                gradient.addColorStop(0.3, baseColor);
                gradient.addColorStop(1, baseColor);

                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius - 1, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.restore();
            });
        });

        Render.run(render);
        
        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);

        return () => {
            Render.stop(render);
            Runner.stop(runner);
            render.canvas.remove();
            World.clear(engine.world, false);
            Engine.clear(engine);
        };
    }, [width, height]);

    // Handle new votes
    useEffect(() => {
        if (!engineRef.current || !latestVote) return;

        const newVotes = currentVotes.filter(seatId => !addedVotesRef.current.has(seatId));
        
        if (newVotes.length > 0) {
            newVotes.forEach(seatId => {
                const seat = gameState?.seats.find(s => s.id === seatId);
                const userName = seat?.userName ?? `Seat ${String(seatId)}`;
                
                // Randomize spawn position slightly
                const x = (width / 2) + (Math.random() * 40 - 20);
                const y = -50 - (Math.random() * 50);

                const chip = Matter.Bodies.circle(x, y, 15, {
                    restitution: 0.5, // Bounciness
                    friction: 0.05,
                    render: {
                        fillStyle: seat?.isDead ? '#57534e' : '#f59e0b',
                        strokeStyle: seat?.isDead ? '#44403c' : '#b45309',
                        lineWidth: 3,
                    },
                    label: userName
                });

                Matter.Composite.add(engineRef.current.world, chip);
                addedVotesRef.current.add(seatId);
                
                // 播放筹码掉落音效
                playSound('chip_drop');
            });
        }
        
        // Reset if new round
        if (latestVote.votes.length === 0 && addedVotesRef.current.size > 0) {
             // Check if it's actually a new round or just empty
             // For now, simple clear if empty
             // But wait, if we just started, length is 0.
        }
        
    }, [currentVotes, gameState, width, playSound]);

    // Reset logic when nomination changes
    useEffect(() => {
        addedVotesRef.current.clear();
        if (engineRef.current) {
            const bodies = Matter.Composite.allBodies(engineRef.current.world);
            const chips = bodies.filter(b => !b.isStatic);
            Matter.Composite.remove(engineRef.current.world, chips);
        }
    }, [gameState?.voting?.nomineeSeatId]);

    // 计算投票进度和是否超过半数
    const { voteProgress, isOverHalf } = useMemo(() => {
        const totalPlayers = gameState?.seats.filter(s => s.seenRoleId && !s.isDead).length ?? 1;
        const requiredVotes = Math.ceil(totalPlayers / 2);
        const currentVoteCount = currentVotes.length;
        const progress = Math.min(currentVoteCount / totalPlayers, 1);
        const overHalf = currentVoteCount >= requiredVotes;
        return { voteProgress: progress, isOverHalf: overHalf };
    }, [gameState?.seats, currentVotes.length]);

    return (
        <div className="relative mx-auto border-[3px] border-[#44403c] bg-[#1c1917] rounded-full overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]" style={{ width, height }}>
            {/* 纹理背景 */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#292524] to-[#0c0a09] opacity-90 pointer-events-none"></div>

            {/* 时钟表盘背景 */}
            <ClockFace 
                width={width} 
                height={height} 
                voteProgress={voteProgress}
                isOverHalf={isOverHalf}
            />
            
            {/* Matter.js 物理区域 */}
            <div ref={sceneRef} className="absolute inset-0" style={{ zIndex: 1 }} />
            
            {/* 标题 */}
            <div className="absolute top-6 left-0 right-0 text-center pointer-events-none" style={{ zIndex: 2 }}>
                <div className="text-xs text-[#78716c] font-cinzel tracking-[0.3em] uppercase opacity-80">Judgment Zone</div>
                <div className="text-lg text-[#d6d3d1] font-cinzel font-bold tracking-widest drop-shadow-md mt-1">审判区域</div>
            </div>
            
            {/* 投票计数器 */}
            <div 
                className={`absolute bottom-8 left-0 right-0 mx-auto w-fit text-sm font-cinzel font-bold pointer-events-none px-4 py-1.5 rounded-full border transition-all duration-300 ${
                    isOverHalf 
                        ? 'text-red-200 bg-red-950/80 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                        : 'text-[#d4af37] bg-[#292524]/80 border-[#57534e] shadow-lg'
                }`}
                style={{ zIndex: 2 }}
            >
                {currentVotes.length} 票
            </div>
        </div>
    );
};
