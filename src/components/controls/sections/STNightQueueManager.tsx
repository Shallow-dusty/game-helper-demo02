import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { ROLES } from '@/constants';
import type { GamePhase } from '@/types';

interface STNightQueueManagerProps {
    nightQueue: string[];
    nightCurrentIndex: number;
    onSetPhase: (phase: GamePhase) => void;
    onShowNightAction: (roleId: string) => void;
}

export const STNightQueueManager = React.memo<STNightQueueManagerProps>(({
    nightQueue,
    nightCurrentIndex,
    onSetPhase,
    onShowNightAction,
}) => {
    const { t } = useTranslation();
    const currentRoleId = nightCurrentIndex >= 0 ? nightQueue[nightCurrentIndex] : undefined;
    const currentRole = currentRoleId ? ROLES[currentRoleId] : undefined;

    // 使用selector获取稳定引用，避免每次渲染创建新函数
    const nightNext = useStore(state => state.nightNext);
    const nightPrev = useStore(state => state.nightPrev);

    return (
        <div className="bg-black/30 p-3 rounded border border-indigo-900/50 shadow-lg">
            <div className="text-xs text-indigo-400/70 mb-2 flex justify-between uppercase tracking-wider">
                <span>{t('controls.st.nightOrder')}</span>
                <span>{nightCurrentIndex + 1} / {nightQueue.length}</span>
            </div>
            <div className="flex items-center justify-between mb-3 bg-indigo-950/30 p-2 rounded border border-indigo-900/30">
                <button
                    onClick={nightPrev}
                    className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 text-stone-400"
                >
                    &lt;
                </button>
                <span className={`font-serif text-lg font-bold ${currentRoleId ? 'text-indigo-200' : 'text-stone-600'}`}>
                    {currentRole?.name || (nightCurrentIndex >= 0 ? t('controls.st.dawn') : t('controls.st.dusk'))}
                </span>
                <button
                    onClick={nightNext}
                    className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 text-stone-400"
                >
                    &gt;
                </button>
            </div>
            <div className="text-[10px] text-stone-500 flex flex-wrap gap-1.5">
                {nightQueue.map((rid, idx) => (
                    <span
                        key={idx}
                        className={`px-1.5 py-0.5 rounded transition-all border ${
                            idx === nightCurrentIndex
                                ? 'bg-indigo-900 text-indigo-100 border-indigo-500 shadow-[0_0_10px_#4f46e5]'
                                : idx < nightCurrentIndex
                                    ? 'text-stone-700 border-transparent decoration-stone-700 line-through'
                                    : 'bg-stone-800 text-stone-500 border-stone-700'
                        }`}
                    >
                        {ROLES[rid]?.name}
                    </span>
                ))}
            </div>

            {/* Night Action Button */}
            {currentRoleId && currentRole?.nightAction && (
                <button
                    onClick={() => onShowNightAction(currentRoleId)}
                    className="mt-3 w-full py-2 bg-purple-900/50 hover:bg-purple-800/50 border border-purple-700 text-purple-200 rounded font-bold text-sm transition-all shadow-lg"
                >
                    🌙 {t('controls.st.executeNightAction')}
                </button>
            )}

            {/* Manual Day Switch (Backup) */}
            <button
                onClick={() => {
                    if (window.confirm(t('controls.st.forceDawnConfirm'))) {
                        onSetPhase('DAY');
                    }
                }}
                className="mt-3 w-full py-2 bg-amber-900/30 hover:bg-amber-800/50 text-amber-500 rounded text-xs border border-amber-900/50 transition-colors flex items-center justify-center gap-2"
            >
                <span>☀</span> {t('controls.st.forceDawn')}
            </button>
        </div>
    );
});
