import React, { useState } from 'react';
import { useStore } from '../store';
import { ROLES, Z_INDEX } from '../constants';

interface NightActionPanelProps {
    roleId: string;
    onComplete: () => void;
}

export const NightActionPanel: React.FC<NightActionPanelProps> = ({ roleId, onComplete }) => {
    const gameState = useStore(state => state.gameState);
    const performNightAction = useStore(state => state.performNightAction);

    const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
    const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

    const role = ROLES[roleId];
    const nightAction = role?.nightAction;

    if (!gameState || !role || !nightAction) return null;

    const availableSeats = gameState.seats.filter(s => s.userId !== null || s.isVirtual);

    const handleSubmit = () => {
        let payload: any = {};

        if (nightAction.type === 'choose_player' && selectedPlayer !== null) {
            payload = { seatId: selectedPlayer };
        } else if (nightAction.type === 'choose_two_players' && selectedPlayers.length === 2) {
            payload = { seatIds: selectedPlayers };
        } else if (nightAction.type === 'confirm') {
            payload = { confirmed: true };
        }

        performNightAction({ roleId, payload });
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

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300"
            style={{ zIndex: Z_INDEX.floatingPanel }}
        >
            <div className="glass-panel max-w-md w-full p-6 relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

                {/* Header */}
                <div className="flex items-center gap-4 mb-6 border-b border-stone-800 pb-4 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.2)]">
                        <span className="text-3xl filter drop-shadow-lg">{role.icon || '🌙'}</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-purple-200 font-cinzel tracking-wide">{role.name}</h3>
                        <p className="text-xs text-purple-400/80 font-bold uppercase tracking-widest">Night Action</p>
                    </div>
                </div>

                {/* Prompt */}
                <div className="bg-stone-900/50 p-4 rounded-lg border border-stone-800 mb-6 relative z-10">
                    <p className="text-stone-200 text-sm leading-relaxed font-serif italic">"{nightAction.prompt}"</p>
                </div>

                {/* Player Selection */}
                {(nightAction.type === 'choose_player' || nightAction.type === 'choose_two_players') && (
                    <div className="grid grid-cols-1 gap-2 mb-6 max-h-[40vh] overflow-y-auto scrollbar-thin p-1 relative z-10">
                        {availableSeats.map(seat => {
                            const isSelected = nightAction.type === 'choose_player'
                                ? selectedPlayer === seat.id
                                : selectedPlayers.includes(seat.id);

                            return (
                                <button
                                    key={seat.id}
                                    onClick={() => togglePlayerSelection(seat.id)}
                                    className={`w-full px-4 py-3 rounded-lg border transition-all text-left relative overflow-hidden group ${isSelected
                                        ? 'bg-purple-900/40 border-purple-500 text-purple-100 shadow-[0_0_15px_rgba(147,51,234,0.2)]'
                                        : 'bg-stone-800/40 border-stone-700/50 text-stone-400 hover:bg-stone-700/60 hover:border-stone-500 hover:text-stone-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border transition-colors ${isSelected ? 'bg-purple-600 border-purple-400 text-white' : 'bg-stone-900 border-stone-700 text-stone-500 group-hover:border-stone-500'}`}>
                                                {seat.id + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base">{seat.userName}</span>
                                                {seat.isVirtual && (
                                                    <span className="text-[10px] text-stone-500 uppercase tracking-widest">虚拟玩家</span>
                                                )}
                                            </div>
                                        </div>
                                        {seat.isDead && <span className="text-[10px] font-bold text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/30">💀 已死亡</span>}
                                    </div>
                                    {isSelected && <div className="absolute inset-0 bg-purple-500/5 animate-pulse-glow pointer-events-none"></div>}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Binary Choice */}
                {nightAction.type === 'binary' && nightAction.options && (
                    <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                        {nightAction.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    performNightAction({ roleId, payload: { choice: idx } });
                                    onComplete();
                                }}
                                className="px-4 py-4 bg-stone-800/50 hover:bg-purple-900/40 border border-stone-700 hover:border-purple-500/50 rounded-lg text-stone-300 hover:text-purple-100 transition-all font-bold text-lg shadow-lg hover:shadow-purple-900/20"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 relative z-10">
                    {nightAction.type !== 'binary' && (
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 disabled:from-stone-800 disabled:to-stone-800 disabled:text-stone-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg disabled:shadow-none border border-purple-500/30 disabled:border-stone-700"
                        >
                            确认行动
                        </button>
                    )}
                    <button
                        onClick={onComplete}
                        className="px-6 py-3 bg-stone-800/50 hover:bg-stone-700/50 border border-stone-700 text-stone-400 hover:text-stone-200 rounded-lg transition-all"
                    >
                        跳过
                    </button>
                </div>
            </div>
        </div>
    );
};
