import React, { useState } from 'react';
import { useStore } from '../store';
import { ROLES, Z_INDEX } from '../constants';

interface PlayerNightActionProps {
    roleId: string;
    onComplete: () => void;
}

export const PlayerNightAction: React.FC<PlayerNightActionProps> = ({ roleId, onComplete }) => {
    const gameState = useStore(state => state.gameState);
    const submitNightAction = useStore(state => state.submitNightAction);

    const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
    const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

    const role = ROLES[roleId];
    const nightAction = role?.nightAction;

    if (!gameState || !nightAction) return null;

    const availableSeats = gameState.seats.filter(s => s.userId !== null || s.isVirtual);

    const handleSubmit = () => {
        let payload: any = {};

        if (nightAction.type === 'choose_player' && selectedPlayer !== null) {
            payload = { seatId: selectedPlayer };
        } else if (nightAction.type === 'choose_two_players' && selectedPlayers.length === 2) {
            payload = { seatIds: selectedPlayers };
        } else if (nightAction.type === 'confirm') {
            payload = { confirmed: true };
        } else if (nightAction.type === 'binary') {
            // Handled in option click
        }

        submitNightAction({ roleId, payload });
        onComplete();
    };

    const canSubmit =
        (nightAction.type === 'choose_player' && selectedPlayer !== null) ||
        (nightAction.type === 'choose_two_players' && selectedPlayers.length === 2) ||
        nightAction.type === 'confirm';

    const togglePlayerSelection = (seatId: number) => {
        if (nightAction.type === 'choose_two_players') {
            if (selectedPlayers.includes(seatId)) {
                setSelectedPlayers(prev => prev.filter(id => id !== seatId));
            } else if (selectedPlayers.length < 2) {
                setSelectedPlayers(prev => [...prev, seatId]);
            }
        } else {
            setSelectedPlayer(seatId);
        }
    };

    // FR-02: 改为底部浮层，不阻挡魔典
    return (
        <div 
            className="fixed bottom-0 left-0 right-0 animate-in slide-in-from-bottom duration-300"
            style={{ zIndex: Z_INDEX.floatingPanel }}
        >
            {/* 半透明背景遮罩 - 点击可关闭 */}
            <div 
                className="absolute inset-0 -top-screen bg-black/40 backdrop-blur-sm"
                onClick={onComplete}
                style={{ top: '-100vh' }}
            />
            
            <div className="relative bg-stone-900 border-t-2 border-indigo-500 rounded-t-xl p-4 md:p-6 max-w-lg mx-auto shadow-[0_-10px_50px_rgba(79,70,229,0.3)]">
                {/* 拖拽指示条 */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-stone-700 rounded-full" />
                
                {/* Header */}
                <div className="flex items-center gap-3 mb-4 border-b border-indigo-900/50 pb-3 mt-2">
                    <span className="text-3xl md:text-4xl animate-pulse">{role.icon || '🌙'}</span>
                    <div className="flex-1">
                        <h3 className="text-xl md:text-2xl font-bold text-indigo-300 font-cinzel">{role.name}</h3>
                        <p className="text-[10px] md:text-xs text-indigo-400 uppercase tracking-widest">你的回合 (Your Turn)</p>
                    </div>
                    <button
                        onClick={onComplete}
                        className="p-2 text-stone-500 hover:text-stone-300 transition-colors"
                        aria-label="关闭"
                    >
                        ✕
                    </button>
                </div>

                {/* Prompt */}
                <p className="text-stone-200 mb-6 text-base leading-relaxed font-serif italic border-l-2 border-indigo-500 pl-3">
                    {nightAction.prompt}
                </p>

                {/* Player Selection */}
                {(nightAction.type === 'choose_player' || nightAction.type === 'choose_two_players') && (
                    <div className="space-y-2 mb-6 max-h-60 overflow-y-auto scrollbar-thin pr-1">
                        {availableSeats.map(seat => {
                            const isSelected = nightAction.type === 'choose_player'
                                ? selectedPlayer === seat.id
                                : selectedPlayers.includes(seat.id);

                            return (
                                <button
                                    key={seat.id}
                                    onClick={() => togglePlayerSelection(seat.id)}
                                    className={`w-full px-4 py-3 rounded border transition-all text-left flex items-center justify-between group ${isSelected
                                        ? 'bg-indigo-900/60 border-indigo-400 text-indigo-100 shadow-lg scale-[1.02]'
                                        : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-750 hover:border-stone-500'
                                        }`}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold group-hover:text-stone-200 transition-colors">{seat.userName}</span>
                                        <span className="text-[10px] opacity-60">座位 {seat.id + 1}</span>
                                    </div>
                                    {isSelected && <span className="text-indigo-400 text-xl">✓</span>}
                                    {seat.isDead && <span className="text-xs text-red-900 bg-red-950/30 px-1 rounded border border-red-900/50">已死亡</span>}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Binary Choice */}
                {nightAction.type === 'binary' && nightAction.options && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {nightAction.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    submitNightAction({ roleId, payload: { choice: idx } });
                                    onComplete();
                                }}
                                className="px-4 py-4 bg-stone-800 hover:bg-indigo-900/40 border border-stone-600 hover:border-indigo-500 rounded text-stone-200 hover:text-indigo-200 transition-all font-bold text-lg shadow-md hover:shadow-indigo-900/20"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pb-safe">
                    {(nightAction.type !== 'binary') && (
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-stone-800 disabled:text-stone-600 text-white font-bold py-3 rounded transition-all shadow-lg disabled:shadow-none text-base md:text-lg"
                        >
                            确认提交
                        </button>
                    )}
                    <button
                        onClick={onComplete}
                        className="px-4 py-3 bg-transparent hover:bg-stone-800 text-stone-500 hover:text-stone-300 rounded transition-all text-sm"
                    >
                        跳过
                    </button>
                </div>
            </div>
        </div>
    );
};
