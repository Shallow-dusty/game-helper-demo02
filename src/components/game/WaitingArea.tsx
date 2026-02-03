import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { useShallow } from 'zustand/react/shallow';
import { Check, Clock, ChevronDown, User, Armchair, Bot } from 'lucide-react';

// 优化选择器 - 细粒度订阅
const useWaitingAreaState = () => useStore(
    useShallow(state => ({
        seats: state.gameState?.seats ?? [],
        roomId: state.gameState?.roomId ?? '',
        setupPhase: state.gameState?.setupPhase,
        rolesRevealed: state.gameState?.rolesRevealed ?? false,
        hasGameState: !!state.gameState,
    }))
);

export const WaitingArea: React.FC = () => {
    const { t } = useTranslation();
    const { seats, roomId, setupPhase, rolesRevealed, hasGameState } = useWaitingAreaState();
    const user = useStore(state => state.user);
    const joinSeat = useStore(state => state.joinSeat);
    const leaveSeat = useStore(state => state.leaveSeat);
    const toggleReady = useStore(state => state.toggleReady);
    const [joiningId, setJoiningId] = useState<number | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    if (!hasGameState || !user) return null;

    // 检查 seats 数组是否有效
    if (seats.length === 0) {
        console.warn('WaitingArea: seats 数组无效', seats);
        return null;
    }

    // Storyteller doesn't need to sit
    if (user.isStoryteller) return null;

    // Check if user is already seated
    const currentSeat = seats.find(s => s.userId === user.id);
    const isSeated = !!currentSeat;

    const handleJoinSeat = (seatId: number) => {
        if (joiningId !== null) return; // 防止重复点击

        setJoiningId(seatId);
        void joinSeat(seatId).finally(() => {
            setJoiningId(null);
        });
    };

    // If seated, show Ready interface
    if (isSeated) {
        // Hide if game has started or roles are revealed
        if (setupPhase === 'STARTED' || rolesRevealed) {
            return null;
        }

        if (isMinimized) {
            return (
                <div className="absolute bottom-24 right-6 z-40 pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <button
                        onClick={() => setIsMinimized(false)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border backdrop-blur-md transition-all hover:scale-105
                            ${currentSeat.isReady
                                ? 'bg-green-900/80 text-green-100 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                                : 'bg-stone-800/90 text-stone-300 border-stone-600'}
                        `}
                    >
                        <span className="text-lg">{currentSeat.isReady ? '✓' : '⏳'}</span>
                        <span className="font-cinzel font-bold text-sm">
                            {currentSeat.isReady ? t('game.waitingArea.ready') : t('game.waitingArea.clickToReady')}
                        </span>
                        <span className="ml-1 text-xs opacity-60">↗</span>
                    </button>
                </div>
            );
        }

        return (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-8 pointer-events-none">
                <div className="bg-stone-950/90 backdrop-blur-md p-8 rounded-2xl border border-stone-700 shadow-2xl pointer-events-auto max-w-lg w-full text-center animate-in zoom-in-95 duration-300 relative">
                    {/* Minimize Button */}
                    <button
                        onClick={() => setIsMinimized(true)}
                        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-colors cursor-pointer"
                        title={t('game.waitingArea.minimize')}
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>

                    <h1 className="text-3xl font-cinzel text-amber-500 mb-2 tracking-widest drop-shadow-lg">
                        {roomId}
                    </h1>
                    <div className="text-xl text-stone-300 font-cinzel mb-6">
                        {currentSeat.userName}
                    </div>

                    <button
                        onClick={() => {
                            toggleReady();
                            // 如果当前是未准备状态，点击后变为准备，则自动最小化
                            if (!currentSeat.isReady) {
                                setIsMinimized(true);
                            }
                        }}
                        className={`
                            w-full py-4 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                            flex items-center justify-center gap-3 shadow-lg mb-4
                            ${currentSeat.isReady
                                ? 'bg-green-900/80 text-green-100 border border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                                : 'bg-stone-800 text-stone-400 border border-stone-600 hover:bg-stone-700 hover:text-stone-200'}
                        `}
                    >
                        {currentSeat.isReady ? (
                            <>
                                <Check className="w-6 h-6" />
                                <span>{t('game.waitingArea.readyStatus')}</span>
                            </>
                        ) : (
                            <>
                                <Clock className="w-6 h-6" />
                                <span>{t('game.waitingArea.notReadyStatus')}</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => void leaveSeat()}
                        className="w-full py-2 rounded-lg text-sm font-bold text-stone-500 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 transition-all cursor-pointer"
                    >
                        {t('game.waitingArea.leaveSeat')}
                    </button>

                    <p className="mt-6 text-stone-500 font-serif italic text-sm animate-pulse">
                        {currentSeat.isReady
                            ? t('game.waitingArea.waitingForStart')
                            : t('game.waitingArea.pleaseConfirm')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 z-40 bg-stone-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-cinzel text-amber-500 mb-2 tracking-widest drop-shadow-lg">
                    {roomId}
                </h1>
                <p className="text-stone-400 font-serif italic">{t('game.waitingArea.chooseSeat')}</p>
                {setupPhase === 'STARTED' && (
                    <div className="mt-2 px-4 py-1 bg-amber-900/30 border border-amber-700/50 rounded-full inline-block">
                        <p className="text-amber-400 text-xs font-bold animate-pulse">{t('game.waitingArea.gameInProgress')}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl w-full overflow-y-auto p-4 max-h-[70vh] scrollbar-thin">
                {seats.map(seat => {
                    const isTaken = Boolean(seat.userId) || Boolean(seat.isVirtual);
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
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner transition-transform group-hover:scale-110
                                ${isJoining
                                    ? 'bg-amber-900 text-amber-200 border border-amber-600'
                                    : isTaken
                                        ? 'bg-stone-800 text-stone-600'
                                        : 'bg-gradient-to-br from-amber-900 to-stone-900 text-amber-200 border border-amber-800'}
                            `}>
                                {isJoining ? (
                                    <Clock className="w-8 h-8 animate-pulse" />
                                ) : isTaken ? (
                                    seat.isVirtual ? <Bot className="w-8 h-8" /> : <User className="w-8 h-8" />
                                ) : (
                                    <Armchair className="w-8 h-8" />
                                )}
                            </div>

                            <div className="flex flex-col items-center">
                                <span className={`font-cinzel font-bold ${isTaken ? 'text-stone-500' : 'text-amber-100'}`}>
                                    {isTaken ? seat.userName : t('game.waitingArea.seatNumber', { number: seat.id + 1 })}
                                </span>
                                <span className="text-[10px] uppercase tracking-widest mt-1 font-bold">
                                    {isJoining
                                        ? <span className="text-amber-400">{t('game.waitingArea.joining')}</span>
                                        : isTaken
                                            ? (seat.isVirtual ? t('game.waitingArea.virtual') : t('game.waitingArea.taken'))
                                            : <span className="text-green-500 animate-pulse">{t('game.waitingArea.open')}</span>
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
                    <span>{t('game.waitingArea.open')}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-stone-800 border border-stone-700"></div>
                    <span>{t('game.waitingArea.taken')}</span>
                </div>
            </div>
        </div>
    );
};



