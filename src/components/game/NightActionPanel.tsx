import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { ROLES, Z_INDEX } from '../../constants';
import type { NightActionPayload } from '../../types';
import { Moon, Skull } from 'lucide-react';

interface NightActionPanelProps {
    roleId: string;
    onComplete: () => void;
}

export const NightActionPanel: React.FC<NightActionPanelProps> = ({ roleId, onComplete }) => {
    const { t } = useTranslation();
    const seats = useStore(state => state.gameState?.seats ?? []);
    const performNightAction = useStore(state => state.performNightAction);

    const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
    const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

    const role = ROLES[roleId];
    const nightAction = role?.nightAction;

    if (!role || !nightAction) return null;

    const availableSeats = seats.filter(s => s.userId !== null || s.isVirtual);

    const handleSubmit = () => {
        let payload: NightActionPayload = {};

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
            className="fixed inset-0 pointer-events-none flex items-end justify-center pb-8 md:items-center md:pb-0 animate-in fade-in duration-300"
            style={{ zIndex: Z_INDEX.floatingPanel }}
        >
            <div className="glass-panel max-w-md w-full p-6 relative overflow-hidden pointer-events-auto bg-[#1c1917] border border-stone-800 shadow-2xl mx-4 rounded-sm">
                {/* Background Texture */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] z-0"></div>
                
                {/* Decorative glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl pointer-events-none z-0" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-900/20 rounded-full blur-3xl pointer-events-none z-0" />

                {/* Header */}
                <div className="flex items-center gap-5 mb-6 border-b border-stone-800 pb-5 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-[#2a0a2a] border-2 border-purple-900/50 flex items-center justify-center shadow-[0_0_20px_rgba(88,28,135,0.3)]">
                        {role.icon ? (
                            <span className="text-4xl filter drop-shadow-lg transform scale-110">{role.icon}</span>
                        ) : (
                            <Moon className="w-8 h-8 text-purple-300" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-purple-100 font-cinzel tracking-wide drop-shadow-md">{role.name}</h3>
                        <p className="text-xs text-purple-400 font-bold uppercase tracking-[0.2em] mt-1 border-l-2 border-purple-800 pl-2">{t('nightAction.panel.nightAction')}</p>
                    </div>
                </div>

                {/* Prompt */}
                <div className="bg-[#0c0a09]/80 p-5 rounded-sm border-l-4 border-purple-900 mb-6 relative z-10 shadow-inner">
                    <p className="text-stone-300 text-sm leading-relaxed font-serif italic tracking-wide">"{nightAction.prompt}"</p>
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
                                    className={`w-full px-4 py-3 rounded-sm border transition-all duration-300 text-left relative overflow-hidden group cursor-pointer ${isSelected
                                        ? 'bg-purple-950/40 border-purple-500/50 text-purple-100 shadow-[inset_0_0_20px_rgba(147,51,234,0.1)]'
                                        : 'bg-[#2a2725] border-stone-800 text-stone-400 hover:bg-stone-800 hover:border-stone-600 hover:text-stone-200'
                                        }`}
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border font-cinzel transition-colors ${isSelected ? 'bg-purple-900 border-purple-400 text-purple-100' : 'bg-[#1c1917] border-stone-700 text-stone-600 group-hover:border-stone-500'}`}>
                                                {seat.id + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base font-cinzel tracking-wide">{seat.userName}</span>
                                                {seat.isVirtual && (
                                                    <span className="text-[10px] text-stone-600 uppercase tracking-widest font-serif">{t('nightAction.panel.virtualPlayer')}</span>
                                                )}
                                            </div>
                                        </div>
                                        {seat.isDead && (
                                            <span className="text-[10px] font-bold text-red-500 bg-red-950/20 px-2 py-0.5 rounded-sm border border-red-900/30 font-cinzel flex items-center gap-1">
                                                <Skull className="w-3 h-3" />
                                                {t('nightAction.panel.dead')}
                                            </span>
                                        )}
                                    </div>
                                    {isSelected && <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 to-transparent pointer-events-none"></div>}
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
                                className="px-4 py-4 bg-[#2a2725] hover:bg-purple-900/20 border border-stone-700 hover:border-purple-500/50 rounded-sm text-stone-300 hover:text-purple-100 transition-all font-bold text-lg shadow-lg hover:shadow-[0_0_15px_rgba(147,51,234,0.15)] font-cinzel tracking-wider cursor-pointer"
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
                            className="flex-1 bg-purple-900 hover:bg-purple-800 disabled:bg-stone-800 disabled:text-stone-600 text-purple-100 font-bold py-3 rounded-sm transition-all shadow-lg disabled:shadow-none border border-purple-700 disabled:border-stone-700 font-cinzel tracking-widest uppercase cursor-pointer disabled:cursor-not-allowed"
                        >
                            {t('nightAction.panel.confirmSubmit')}
                        </button>
                    )}
                    <button
                        onClick={onComplete}
                        className="px-6 py-3 bg-transparent hover:bg-stone-800 border border-stone-700 text-stone-500 hover:text-stone-300 rounded-sm transition-all font-cinzel tracking-widest uppercase cursor-pointer"
                    >
                        {t('nightAction.skip')}
                    </button>
                </div>
            </div>
        </div>
    );
};




