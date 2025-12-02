 
import React, { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { useStore } from '../../store';

interface JudgmentZoneProps {
    width?: number;
    height?: number;
}

export const JudgmentZone: React.FC<JudgmentZoneProps> = ({ width = 300, height = 300 }) => {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    
    const { gameState } = useStore();
    const voteHistory = gameState?.voteHistory || [];
    const latestVote = voteHistory.length > 0 ? voteHistory[voteHistory.length - 1] : null;
    const currentVotes = latestVote?.votes || [];
    
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
                pixelRatio: window.devicePixelRatio
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

    // Handle new votes
    useEffect(() => {
        if (!engineRef.current || !latestVote) return;

        const newVotes = currentVotes.filter(seatId => !addedVotesRef.current.has(seatId));
        
        if (newVotes.length > 0) {
            newVotes.forEach(seatId => {
                const seat = gameState?.seats.find(s => s.id === seatId);
                const userName = seat?.userName || `Seat ${seatId}`;
                
                // Randomize spawn position slightly
                const x = (width / 2) + (Math.random() * 40 - 20);
                const y = -50 - (Math.random() * 50);

                const chip = Matter.Bodies.circle(x, y, 15, {
                    restitution: 0.5, // Bounciness
                    friction: 0.05,
                    render: {
                        fillStyle: seat?.isDead ? '#57534e' : '#f59e0b',
                        strokeStyle: '#78350f',
                        lineWidth: 2,
                        // We can use sprites here later
                        // sprite: { texture: '...' }
                    },
                    label: userName
                });

                Matter.Composite.add(engineRef.current!.world, chip);
                addedVotesRef.current.add(seatId);
                
                // Play sound (mock)
                // playSound('chip_drop');
            });
        }
        
        // Reset if new round
        if (latestVote.votes.length === 0 && addedVotesRef.current.size > 0) {
             // Check if it's actually a new round or just empty
             // For now, simple clear if empty
             // But wait, if we just started, length is 0.
        }
        
    }, [currentVotes, gameState, width]);

    // Reset logic when nomination changes
    useEffect(() => {
        addedVotesRef.current.clear();
        if (engineRef.current) {
            const bodies = Matter.Composite.allBodies(engineRef.current.world);
            const chips = bodies.filter(b => !b.isStatic);
            Matter.Composite.remove(engineRef.current.world, chips);
        }
    }, [gameState?.voting?.nomineeSeatId]);

    return (
        <div className="relative mx-auto border border-stone-800 bg-stone-950/50 rounded-lg overflow-hidden shadow-inner" style={{ width, height }}>
            <div ref={sceneRef} className="absolute inset-0" />
            <div className="absolute top-2 left-2 text-xs text-stone-500 font-cinzel pointer-events-none">
                JUDGMENT ZONE
            </div>
        </div>
    );
};
