import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const GameRules: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();
    const [expandedSection, setExpandedSection] = useState<string | null>('basic');

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-stone-900 rounded-lg border border-stone-800 overflow-hidden w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-3 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-stone-300 font-cinzel">{t('lobby.gameRules.title')}</h3>
                    {onClose && (
                        <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
                            ✕
                        </button>
                    )}
                </div>

                <div className="divide-y divide-stone-800">
                    {/* Basic Rules */}
                    <div className="bg-stone-900/50">
                        <button
                            onClick={() => toggleSection('basic')}
                            className="w-full p-3 flex justify-between items-center text-left hover:bg-stone-800/50 transition-colors"
                        >
                            <span className="text-xs font-bold text-stone-400">{t('lobby.gameRules.basicFlow')}</span>
                            <span className="text-stone-600">{expandedSection === 'basic' ? '−' : '+'}</span>
                        </button>
                        {expandedSection === 'basic' && (
                            <div className="p-3 pt-0 text-xs text-stone-500 leading-relaxed space-y-2">
                                <p>{t('lobby.gameRules.flowDescription')}</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>{t('lobby.gameRules.nightPhase')}</li>
                                    <li>{t('lobby.gameRules.dayPhase')}</li>
                                    <li>{t('lobby.gameRules.nomination')}</li>
                                    <li>{t('lobby.gameRules.execution')}</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Winning Conditions */}
                    <div className="bg-stone-900/50">
                        <button
                            onClick={() => toggleSection('winning')}
                            className="w-full p-3 flex justify-between items-center text-left hover:bg-stone-800/50 transition-colors"
                        >
                            <span className="text-xs font-bold text-stone-400">{t('lobby.gameRules.winConditions')}</span>
                            <span className="text-stone-600">{expandedSection === 'winning' ? '−' : '+'}</span>
                        </button>
                        {expandedSection === 'winning' && (
                            <div className="p-3 pt-0 text-xs text-stone-500 leading-relaxed space-y-2">
                                <p><strong className="text-blue-400">{t('lobby.gameRules.goodWinCondition')}</strong></p>
                                <ul className="list-disc pl-4 space-y-1 mb-2">
                                    <li>{t('lobby.gameRules.executeDemon')}</li>
                                    <li>{t('lobby.gameRules.noDemonAlive')}</li>
                                </ul>
                                <p><strong className="text-red-400">{t('lobby.gameRules.evilWinCondition')}</strong></p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>{t('lobby.gameRules.twoPlayersLeft')}</li>
                                    <li>{t('lobby.gameRules.specialCondition')}</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Death & Ghost Votes */}
                    <div className="bg-stone-900/50">
                        <button
                            onClick={() => toggleSection('death')}
                            className="w-full p-3 flex justify-between items-center text-left hover:bg-stone-800/50 transition-colors"
                        >
                            <span className="text-xs font-bold text-stone-400">{t('lobby.gameRules.deathGhostVote')}</span>
                            <span className="text-stone-600">{expandedSection === 'death' ? '−' : '+'}</span>
                        </button>
                        {expandedSection === 'death' && (
                            <div className="p-3 pt-0 text-xs text-stone-500 leading-relaxed space-y-2">
                                <p>{t('lobby.gameRules.deadPlayers')}</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>{t('lobby.gameRules.loseAbility')}</li>
                                    <li>{t('lobby.gameRules.canStillSpeak')}</li>
                                    <li>{t('lobby.gameRules.ghostVote')}</li>
                                    <li>{t('lobby.gameRules.ghostVoteUsed')}</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};




