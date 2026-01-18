import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { useShallow } from 'zustand/react/shallow';
import { SCRIPTS, ROLES } from '../../constants';
import { NightActionManager } from '../game/NightActionManager';
import { DistributionConfirmationModal } from '../modals/DistributionConfirmationModal';
import { analyzeDistribution, DistributionAnalysisResult } from '../../lib/distributionAnalysis';
import { RuleCompliancePanel } from '../game/RuleCompliancePanel';
import { SmartInfoPanel } from './SmartInfoPanel';
import { Flame, FlameKindling, Shield } from 'lucide-react';

interface ControlsSTSectionProps {
    onShowCompositionGuide: () => void;
    onShowNightAction: (roleId: string) => void;
    onShowHistory: () => void;
    onShowScriptEditor: () => void;
}

// 优化选择器 - 细粒度订阅
const useSTSectionState = () => useStore(
    useShallow(state => ({
        seats: state.gameState?.seats ?? [],
        phase: state.gameState?.phase ?? 'SETUP',
        currentScriptId: state.gameState?.currentScriptId ?? 'tb',
        customScripts: state.gameState?.customScripts ?? {},
        nightQueue: state.gameState?.nightQueue ?? [],
        nightCurrentIndex: state.gameState?.nightCurrentIndex ?? 0,
        voting: state.gameState?.voting,
        vibrationEnabled: state.gameState?.vibrationEnabled ?? false,
        candlelightEnabled: state.gameState?.candlelightEnabled ?? false,
        hasGameState: !!state.gameState,
    }))
);

const useSTSectionActions = () => useStore(
    useShallow(state => ({
        setPhase: state.setPhase,
        setScript: state.setScript,
        toggleCandlelight: state.toggleCandlelight,
        nextClockHand: state.nextClockHand,
        closeVote: state.closeVote,
    }))
);

export const ControlsSTSection: React.FC<ControlsSTSectionProps> = ({
    onShowCompositionGuide,
    onShowNightAction,
    onShowHistory,
    onShowScriptEditor
}) => {
    const { t } = useTranslation();
    const {
        seats,
        phase,
        currentScriptId,
        customScripts,
        nightQueue,
        nightCurrentIndex,
        voting,
        vibrationEnabled,
        candlelightEnabled,
        hasGameState,
    } = useSTSectionState();
    const { setPhase, setScript, toggleCandlelight, nextClockHand, closeVote } = useSTSectionActions();

    // Confirmation Modal State
    const [showDistributeConfirm, setShowDistributeConfirm] = useState(false);
    const [distributionAnalysis, setDistributionAnalysis] = useState<DistributionAnalysisResult | null>(null);
    const [showRuleCompliance, setShowRuleCompliance] = useState(false);

    // 可折叠区块状态
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
        seats: false,
        roles: false,
        game: false,
        smartInfo: true, // 智能信息面板默认折叠
        audio: true, // 默认折叠音频
        voting: false
    });

    const toggleSection = (section: string) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleDistributeClick = () => {
        if (!hasGameState) return;

        const hasEmptyRoles = seats.some(s => !s.realRoleId);
        if (hasEmptyRoles) {
            alert(t('controls.st.distributeEmptyRoleError'));
            return;
        }

        // Run analysis
        const result = analyzeDistribution(seats, seats.length);
        setDistributionAnalysis(result);
        setShowDistributeConfirm(true);
    };

    if (!hasGameState) return null;

    return (
        <div className="space-y-6">
            {/* Night Action Manager - 处理玩家夜间行动请求 */}
            <NightActionManager />

            {/* Script Selector */}
            <div className="bg-stone-900 p-3 rounded border border-stone-700">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-stone-500 uppercase block">📖 {t('controls.st.script')}</label>
                    <div className="flex gap-2">
                        <button
                            onClick={onShowScriptEditor}
                            className="text-[10px] text-amber-400 hover:text-amber-300 border border-amber-900/50 px-2 py-0.5 rounded bg-amber-950/20 transition-colors"
                        >
                            ✏️ {t('controls.st.createScript')}
                        </button>
                        <label className="cursor-pointer text-[10px] text-blue-400 hover:text-blue-300 border border-blue-900/50 px-2 py-0.5 rounded bg-blue-950/20 transition-colors">
                            📥 {t('controls.st.importScript')}
                            <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            const content = ev.target?.result as string;
                                            if (content) useStore.getState().importScript(content);
                                        };
                                        reader.readAsText(file);
                                    }
                                    e.target.value = ''; // Reset
                                }}
                            />
                        </label>
                    </div>
                </div>
                <select
                    value={currentScriptId}
                    onChange={(e) => setScript(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded text-sm text-stone-300 p-2"
                >
                    <optgroup label={t('controls.st.officialScripts')}>
                        {Object.values(SCRIPTS).map(script => (
                            <option key={script.id} value={script.id}>{script.name}</option>
                        ))}
                    </optgroup>
                    {Object.keys(customScripts || {}).length > 0 && (
                        <optgroup label={t('controls.st.customScripts')}>
                            {Object.values(customScripts).map(script => (
                                <option key={script.id} value={script.id}>{script.name}</option>
                            ))}
                        </optgroup>
                    )}
                </select>
            </div>

            {/* Seat Management */}
            <div className="bg-stone-900 rounded border border-stone-700">
                <button
                    className="w-full p-3 flex justify-between items-center text-xs font-bold text-stone-500 uppercase"
                    onClick={() => toggleSection('seats')}
                >
                    <span>🪑 {t('controls.st.seatManagement')}</span>
                    <span className="text-stone-600">{collapsedSections.seats ? '▼' : '▲'}</span>
                </button>
                <div className={`grid grid-cols-3 gap-2 px-3 pb-3 ${collapsedSections.seats ? 'hidden' : ''}`}>
                    <button
                        onClick={() => useStore.getState().addVirtualPlayer()}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-2 rounded text-xs border border-stone-600 transition-colors flex flex-col items-center justify-center gap-1"
                    >
                        <span className="text-lg">🤖</span>
                        <span>{t('controls.st.addVirtual')}</span>
                    </button>
                    <button
                        onClick={() => useStore.getState().addSeat()}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-2 rounded text-xs border border-stone-600 transition-colors flex flex-col items-center justify-center gap-1"
                    >
                        <span className="text-lg">➕</span>
                        <span>{t('controls.st.addSeat')}</span>
                    </button>
                    <button
                        onClick={() => useStore.getState().removeSeat()}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-2 rounded text-xs border border-stone-600 transition-colors flex flex-col items-center justify-center gap-1"
                    >
                        <span className="text-lg">➖</span>
                        <span>{t('controls.st.removeSeat')}</span>
                    </button>
                </div>
            </div>

            {/* Role Management */}
            <div className="bg-stone-900 rounded border border-stone-700">
                <button
                    className="w-full p-3 flex justify-between items-center text-xs font-bold text-stone-500 uppercase"
                    onClick={() => toggleSection('roles')}
                >
                    <span>🎭 {t('controls.st.roleManagement')}</span>
                    <span className="text-stone-600">{collapsedSections.roles ? '▼' : '▲'}</span>
                </button>
                <div className={`grid grid-cols-2 gap-2 px-3 pb-3 ${collapsedSections.roles ? 'hidden' : ''}`}>
                    <button
                        onClick={() => useStore.getState().assignRoles()}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>🎲</span> {t('controls.st.autoAssign')}
                    </button>
                    <button
                        onClick={handleDistributeClick}
                        className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>👀</span> {t('controls.st.distributeRoles')}
                    </button>
                    <button
                        onClick={onShowCompositionGuide}
                        className="bg-stone-800 hover:bg-amber-900 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>📊</span> {t('controls.st.viewComposition')}
                    </button>
                    <button
                        onClick={() => setShowRuleCompliance(true)}
                        className="bg-stone-800 hover:bg-emerald-900 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Shield className="w-3 h-3" /> {t('controls.st.ruleCheck')}
                    </button>
                </div>
            </div>

            {/* Game Flow */}
            <div className="bg-stone-900 rounded border border-stone-700">
                <button
                    className="w-full p-3 flex justify-between items-center text-xs font-bold text-stone-500 uppercase"
                    onClick={() => toggleSection('game')}
                >
                    <span>🎮 {t('controls.st.gameFlow')}</span>
                    <span className="text-stone-600">{collapsedSections.game ? '▼' : '▲'}</span>
                </button>
                <div className={`space-y-2 px-3 pb-3 ${collapsedSections.game ? 'hidden' : ''}`}>
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
                            onClick={() => setPhase('DAY')}
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
                            className={`py-2 px-3 rounded text-xs border transition-colors flex items-center justify-center gap-1 ${vibrationEnabled
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
                        onClick={() => toggleCandlelight?.()}
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
            </div>

            {/* Smart Info Panel - 智能信息生成 */}
            {phase === 'NIGHT' && (
                <SmartInfoPanel
                    isExpanded={!collapsedSections.smartInfo}
                    onToggle={() => toggleSection('smartInfo')}
                />
            )}

            {/* Night Queue Manager */}
            {phase === 'NIGHT' && (() => {
                const currentRoleId = nightCurrentIndex >= 0 ? nightQueue[nightCurrentIndex] : undefined;
                const currentRole = currentRoleId ? ROLES[currentRoleId] : undefined;
                const nightNext = useStore.getState().nightNext;
                const nightPrev = useStore.getState().nightPrev;

                return (
                    <div className="bg-black/30 p-3 rounded border border-indigo-900/50 shadow-lg">
                        <div className="text-xs text-indigo-400/70 mb-2 flex justify-between uppercase tracking-wider">
                            <span>{t('controls.st.nightOrder')}</span>
                            <span>{nightCurrentIndex + 1} / {nightQueue.length}</span>
                        </div>
                        <div className="flex items-center justify-between mb-3 bg-indigo-950/30 p-2 rounded border border-indigo-900/30">
                            <button onClick={nightPrev} className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 text-stone-400">&lt;</button>
                            <span className={`font-serif text-lg font-bold ${currentRoleId ? 'text-indigo-200' : 'text-stone-600'}`}>
                                {currentRole?.name || (nightCurrentIndex >= 0 ? t('controls.st.dawn') : t('controls.st.dusk'))}
                            </span>
                            <button onClick={nightNext} className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 text-stone-400">&gt;</button>
                        </div>
                        <div className="text-[10px] text-stone-500 flex flex-wrap gap-1.5">
                            {nightQueue.map((rid, idx) => (
                                <span
                                    key={idx}
                                    className={`px-1.5 py-0.5 rounded transition-all border ${idx === nightCurrentIndex ? 'bg-indigo-900 text-indigo-100 border-indigo-500 shadow-[0_0_10px_#4f46e5]' : idx < nightCurrentIndex ? 'text-stone-700 border-transparent decoration-stone-700 line-through' : 'bg-stone-800 text-stone-500 border-stone-700'}`}
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
                                    setPhase('DAY');
                                }
                            }}
                            className="mt-3 w-full py-2 bg-amber-900/30 hover:bg-amber-800/50 text-amber-500 rounded text-xs border border-amber-900/50 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>☀</span> {t('controls.st.forceDawn')}
                        </button>
                    </div>
                );
            })()}

            {/* Voting Controls */}
            {voting?.isOpen && (
                <div className="bg-amber-950/20 border border-amber-800/50 p-4 rounded shadow-[0_0_20px_rgba(180,83,9,0.1)] animate-fade-in">
                    <div className="text-xs text-amber-600 mb-3 font-bold uppercase tracking-widest text-center">{t('controls.st.votingInProgress')}</div>
                    <div className="text-sm mb-4 flex justify-between items-center border-b border-amber-900/30 pb-2">
                        <span className="text-stone-400">{t('controls.st.nominee')}</span>
                        <span className="font-bold text-amber-100 text-lg font-cinzel">{seats.find(s => s.id === voting?.nomineeSeatId)?.userName}</span>
                    </div>
                    <button
                        onClick={nextClockHand}
                        className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-black font-bold rounded-sm mb-2 shadow border border-amber-500 font-cinzel"
                    >
                        {t('controls.st.moveClockHand')} ➜
                    </button>
                    <button onClick={closeVote} className="w-full py-1 bg-transparent hover:bg-red-900/20 text-xs rounded text-red-400 border border-transparent hover:border-red-900/50 transition-colors">
                        {t('controls.st.cancelVote')}
                    </button>
                </div>
            )}

            {/* Distribution Confirmation Modal */}
            {distributionAnalysis && (
                <DistributionConfirmationModal
                    isOpen={showDistributeConfirm}
                    onClose={() => setShowDistributeConfirm(false)}
                    onConfirm={() => {
                        useStore.getState().distributeRoles();
                        setShowDistributeConfirm(false);
                    }}
                    analysis={distributionAnalysis}
                />
            )}

            {/* Rule Compliance Panel */}
            <RuleCompliancePanel
                seats={seats}
                scriptId={currentScriptId}
                playerCount={seats.filter(s => s.userId || s.isVirtual).length}
                isOpen={showRuleCompliance}
                onClose={() => setShowRuleCompliance(false)}
            />
        </div>
    );
};
