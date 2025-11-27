import React, { useState } from 'react';
import { useStore } from '../store';

export const WaitingArea: React.FC = () => {
    const gameState = useStore(state => state.gameState);
    const user = useStore(state => state.user);
    const joinSeat = useStore(state => state.joinSeat);
    const [joiningId, setJoiningId] = useState<number | null>(null);

    if (!gameState || !user) return null;

    // 检查 seats 数组是否有效
    if (!gameState.seats || !Array.isArray(gameState.seats) || gameState.seats.length === 0) {
        console.warn('WaitingArea: seats 数组无效', gameState.seats);
        return null;
    }

    // Storyteller doesn't need to sit
    if (user.isStoryteller) return null;

    // Check if user is already seated
    const isSeated = gameState.seats.some(s => s.userId === user.id);
    if (isSeated) return null;

    const handleJoinSeat = async (seatId: number) => {
        if (joiningId !== null) return; // 防止重复点击
        
        setJoiningId(seatId);
        try {
            await joinSeat(seatId);
        } finally {
            setJoiningId(null);
        }
    };

    return (
        <div className="absolute inset-0 z-40 bg-stone-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-cinzel text-amber-500 mb-2 tracking-widest drop-shadow-lg">
                    {gameState.roomId}
                </h1>
                <p className="text-stone-400 font-serif italic">请选择您的座位 (Choose your seat)</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl w-full overflow-y-auto p-4 max-h-[70vh] scrollbar-thin">
                {gameState.seats.map(seat => {
                    const isTaken = !!seat.userId || seat.isVirtual;
                    const isJoining = joiningId === seat.id;
                    
                    return (
                        <button
                            key={seat.id}
                            onClick={() => !isTaken && !isJoining && handleJoinSeat(seat.id)}
                            disabled={isTaken || isJoining}
                            className={`
                                relative group p-4 rounded-lg border-2 flex flex-col items-center gap-3 transition-all duration-300
                                ${isJoining
                                    ? 'border-amber-500 bg-amber-900/30 cursor-wait animate-pulse'
                                    : isTaken
                                        ? 'border-stone-800 bg-stone-900/30 opacity-60 cursor-not-allowed'
                                        : 'border-amber-900/50 bg-stone-900 hover:bg-amber-900/20 hover:border-amber-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] cursor-pointer'}
                            `}
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-inner transition-transform group-hover:scale-110
                                ${isJoining 
                                    ? 'bg-amber-900 text-amber-200 border border-amber-600' 
                                    : isTaken 
                                        ? 'bg-stone-800 text-stone-600' 
                                        : 'bg-gradient-to-br from-amber-900 to-stone-900 text-amber-200 border border-amber-800'}
                            `}>
                                {isJoining ? '⏳' : isTaken ? (seat.isVirtual ? '🤖' : '👤') : '🪑'}
                            </div>

                            <div className="flex flex-col items-center">
                                <span className={`font-cinzel font-bold ${isTaken ? 'text-stone-500' : 'text-amber-100'}`}>
                                    {isTaken ? seat.userName : `座位 ${seat.id + 1}`}
                                </span>
                                <span className="text-[10px] uppercase tracking-widest mt-1 font-bold">
                                    {isJoining
                                        ? <span className="text-amber-400">JOINING...</span>
                                        : isTaken
                                            ? (seat.isVirtual ? 'VIRTUAL' : 'TAKEN')
                                            : <span className="text-green-500 animate-pulse">OPEN</span>
                                    }
                                </span>
                            </div>

                            {!isTaken && !isJoining && (
                                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-8 flex gap-4 text-stone-500 text-xs font-mono">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-900 border border-amber-700"></div>
                    <span>空闲 (Open)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-stone-800 border border-stone-700"></div>
                    <span>已占用 (Taken)</span>
                </div>
            </div>
        </div>
    );
};
