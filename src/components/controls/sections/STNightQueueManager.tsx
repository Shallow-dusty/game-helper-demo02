import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { ROLES } from '@/constants';
import type { GamePhase } from '@/types';
import { Moon, Sun, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { ConfirmModal } from '../../ui/ConfirmModal';

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
    const [showDawnConfirm, setShowDawnConfirm] = React.useState(false);
    const [expandedRole, setExpandedRole] = React.useState<string | null>(null);
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
                    className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 text-stone-400 cursor-pointer transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className={`font-serif text-lg font-bold ${currentRoleId ? 'text-indigo-200' : 'text-stone-600'}`}>
                    {currentRole?.name || (nightCurrentIndex >= 0 ? t('controls.st.dawn') : t('controls.st.dusk'))}
                </span>
                <button
                    onClick={nightNext}
                    className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 text-stone-400 cursor-pointer transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            <div className="text-[10px] text-stone-500 space-y-1">
                <div className="flex flex-wrap gap-1.5">
                    {nightQueue.map((rid, idx) => {
                        const role = ROLES[rid];
                        const teamColors: Record<string, string> = {
                            TOWNSFOLK: 'border-l-blue-500',
                            OUTSIDER: 'border-l-green-500',
                            MINION: 'border-l-orange-500',
                            DEMON: 'border-l-red-500',
                        };
                        const teamBorder = role ? (teamColors[role.team] ?? '') : '';
                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setExpandedRole(expandedRole === rid ? null : rid)}
                                className={`px-1.5 py-0.5 rounded transition-all border border-l-2 cursor-pointer ${teamBorder} ${
                                    idx === nightCurrentIndex
                                        ? 'bg-indigo-900 text-indigo-100 border-indigo-500 shadow-[0_0_10px_#4f46e5]'
                                        : idx < nightCurrentIndex
                                            ? 'text-stone-700 border-transparent decoration-stone-700 line-through'
                                            : 'bg-stone-800 text-stone-500 border-stone-700'
                                }`}
                            >
                                {role?.name}
                                {expandedRole === rid && <ChevronDown className="w-2.5 h-2.5 inline ml-0.5" />}
                            </button>
                        );
                    })}
                </div>
                {/* Expandable role details */}
                {expandedRole && ROLES[expandedRole] && (
                    <div className="bg-stone-900/80 border border-stone-700 rounded p-2 text-[11px] leading-relaxed animate-fade-in">
                        <div className="font-bold text-stone-300 mb-1">{ROLES[expandedRole].name}</div>
                        <div className="text-stone-400">{ROLES[expandedRole].ability}</div>
                    </div>
                )}
            </div>

            {/* Night Action Button */}
            {currentRoleId && currentRole?.nightAction && (
                <button
                    onClick={() => onShowNightAction(currentRoleId)}
                    className="mt-3 w-full py-2 bg-purple-900/50 hover:bg-purple-800/50 border border-purple-700 text-purple-200 rounded font-bold text-sm transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                    <Moon className="w-4 h-4" />
                    {t('controls.st.executeNightAction')}
                </button>
            )}

            {/* Manual Day Switch (Backup) */}
            <button
                onClick={() => setShowDawnConfirm(true)}
                className="mt-3 w-full py-2 bg-amber-900/30 hover:bg-amber-800/50 text-amber-500 rounded text-xs border border-amber-900/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
                <Sun className="w-4 h-4" />
                {t('controls.st.forceDawn')}
            </button>
            <ConfirmModal
                isOpen={showDawnConfirm}
                title={t('controls.st.forceDawn')}
                message={t('controls.st.forceDawnConfirm')}
                onConfirm={() => { onSetPhase('DAY'); setShowDawnConfirm(false); }}
                onCancel={() => setShowDawnConfirm(false)}
            />
        </div>
    );
});
