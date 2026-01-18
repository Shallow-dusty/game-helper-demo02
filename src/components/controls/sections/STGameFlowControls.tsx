import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { Flame, FlameKindling } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import type { GamePhase } from '@/types';

interface STGameFlowControlsProps {
    isCollapsed: boolean;
    onToggle: () => void;
    phase: GamePhase;
    vibrationEnabled: boolean;
    candlelightEnabled: boolean;
    onSetPhase: (phase: GamePhase) => void;
    onToggleCandlelight: () => void;
    onShowHistory: () => void;
}

export const STGameFlowControls: React.FC<STGameFlowControlsProps> = ({
    isCollapsed,
    onToggle,
    phase,
    vibrationEnabled,
    candlelightEnabled,
    onSetPhase,
    onToggleCandlelight,
    onShowHistory,
}) => {
    const { t } = useTranslation();

    return (
        <CollapsibleSection
            title={`🎮 ${t('controls.st.gameFlow')}`}
            isCollapsed={isCollapsed}
            onToggle={onToggle}
        >
            <div className="space-y-2 px-3 pb-3">
                {/* Phase Switch Button */}
                {phase === 'SETUP' || phase === 'DAY' ? (
                    <button
                        onClick={() => useStore.getState().startGame()}
                        className="w-full bg-indigo-900 hover:bg-indigo-800 text-indigo-100 py-3 px-3 rounded text-sm border border-indigo-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg"
                    >
                        <span>🌙</span> {phase === 'SETUP' ? t('controls.st.startGame') : t('controls.st.enterNight')}
                    </button>
                ) : (
                    <button
                        onClick={() => onSetPhase('DAY')}
                        className="w-full bg-amber-700 hover:bg-amber-600 text-white py-3 px-3 rounded text-sm border border-amber-600 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg"
                    >
                        <span>☀</span> {t('controls.st.enterDay')}
                    </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={onShowHistory}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-1"
                    >
                        <span>📜</span> {t('controls.st.history')}
                    </button>
                    <button
                        onClick={() => useStore.getState().toggleVibration()}
                        className={`py-2 px-3 rounded text-xs border transition-colors flex items-center justify-center gap-1 ${
                            vibrationEnabled
                                ? 'bg-green-900/50 border-green-700 text-green-300 hover:bg-green-800/50'
                                : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                        }`}
                    >
                        <span>{vibrationEnabled ? '📳' : '🔇'}</span>
                        {vibrationEnabled ? t('controls.st.vibrationOn') : t('controls.st.vibrationOff')}
                    </button>
                </div>

                {/* 烛光守夜模式开关 (v2.0) */}
                <button
                    onClick={onToggleCandlelight}
                    className={`w-full py-2 px-3 rounded text-xs border transition-all flex items-center justify-center gap-2 ${
                        candlelightEnabled
                            ? 'bg-amber-900/60 border-amber-600/50 text-amber-300 hover:bg-amber-800/60 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                            : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                    }`}
                    title={candlelightEnabled ? t('controls.st.candlelightDisableTooltip') : t('controls.st.candlelightEnableTooltip')}
                >
                    {candlelightEnabled ? (
                        <Flame className="w-4 h-4" />
                    ) : (
                        <FlameKindling className="w-4 h-4" />
                    )}
                    <span>{candlelightEnabled ? t('controls.st.candlelightOn') : t('controls.st.candlelightOff')}</span>
                </button>
            </div>
        </CollapsibleSection>
    );
};
