import React, { useState } from 'react';
import { useStore } from '../store';
import { ROLES } from '../constants';

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

    if (!gameState || !nightAction) return null;

    const availableSeats = gameState.seats.filter(s => s.userId !== null);

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
        nightAction.type === 'confirm' ||
        nightAction.type === 'binary';

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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-stone-900 border-2 border-purple-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl shadow-purple-900/50">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4 border-b border-purple-900/30 pb-3">
                    <span className="text-3xl">{role.icon || '🌙'}</span>
                    <div>
                        <h3 className="text-xl font-bold text-purple-300 font-cinzel">{role.name}</h3>
                        <p className="text-xs text-stone-500">Night Action</p>
                    </div>
                </div>

                {/* Prompt */}
                <p className="text-stone-300 mb-4 text-sm">{nightAction.prompt}</p>

                {/* Player Selection */}
                {(nightAction.type === 'choose_player' || nightAction.type === 'choose_two_players') && (
                    <div className="space-y-2 mb-4 max-h-64 overflow-y-auto scrollbar-thin">
                        {availableSeats.map(seat => {
                            const isSelected = nightAction.type === 'choose_player'
                                ? selectedPlayer === seat.id
                                : selectedPlayers.includes(seat.id);

                            return (
                                <button
                                    key={seat.id}
                                    onClick={() => togglePlayerSelection(seat.id)}
                                    className={`w-full px-4 py-3 rounded border transition-all text-left ${isSelected
                                            ? 'bg-purple-900/50 border-purple-600 text-purple-200 shadow-lg'
                                            : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-750 hover:border-stone-600'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold">{seat.userName}</span>
                                        <span className="text-xs opacity-70">座位 {seat.id + 1}</span>
                                    </div>
                                    {seat.isDead && <span className="text-xs text-red-400">💀 已死亡</span>}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Binary Choice */}
                {nightAction.type === 'binary' && nightAction.options && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {nightAction.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    performNightAction({ roleId, payload: { choice: idx } });
                                    onComplete();
                                }}
                                className="px-4 py-3 bg-stone-800 hover:bg-purple-900/30 border border-stone-700 hover:border-purple-600 rounded text-stone-300 hover:text-purple-200 transition-all font-bold"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="flex-1 bg-purple-700 hover:bg-purple-600 disabled:bg-stone-800 disabled:text-stone-600 text-white font-bold py-3 rounded transition-all shadow-lg disabled:shadow-none"
                    >
                        确认
                    </button>
                    <button
                        onClick={onComplete}
                        className="px-4 py-3 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-400 rounded transition-all"
                    >
                        跳过
                    </button>
                </div>
            </div>
        </div>
    );
};
