import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { useShallow } from 'zustand/react/shallow';
import { NightActionManager } from '../game/NightActionManager';
import { DistributionConfirmationModal } from '../modals/DistributionConfirmationModal';
import { analyzeDistribution, DistributionAnalysisResult } from '../../lib/distributionAnalysis';
import { RuleCompliancePanel } from '../game/RuleCompliancePanel';
import { SmartInfoPanel } from './SmartInfoPanel';
import { STScriptSelector } from './sections/STScriptSelector';
import { STSeatManagement } from './sections/STSeatManagement';
import { STRoleManagement } from './sections/STRoleManagement';
import { STGameFlowControls } from './sections/STGameFlowControls';
import { STNightQueueManager } from './sections/STNightQueueManager';
import { STVotingControls } from './sections/STVotingControls';

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
            <STScriptSelector
                currentScriptId={currentScriptId}
                customScripts={customScripts}
                onSetScript={setScript}
                onShowScriptEditor={onShowScriptEditor}
            />

            {/* Seat Management */}
            <STSeatManagement
                isCollapsed={collapsedSections.seats ?? false}
                onToggle={() => toggleSection('seats')}
            />

            {/* Role Management */}
            <STRoleManagement
                isCollapsed={collapsedSections.roles ?? false}
                onToggle={() => toggleSection('roles')}
                onShowCompositionGuide={onShowCompositionGuide}
                onDistributeClick={handleDistributeClick}
                onShowRuleCompliance={() => setShowRuleCompliance(true)}
            />

            {/* Game Flow */}
            <STGameFlowControls
                isCollapsed={collapsedSections.game ?? false}
                onToggle={() => toggleSection('game')}
                phase={phase}
                vibrationEnabled={vibrationEnabled}
                candlelightEnabled={candlelightEnabled}
                onSetPhase={setPhase}
                onToggleCandlelight={toggleCandlelight}
                onShowHistory={onShowHistory}
            />

            {/* Smart Info Panel - 智能信息生成 */}
            {phase === 'NIGHT' && (
                <SmartInfoPanel
                    isExpanded={!collapsedSections.smartInfo}
                    onToggle={() => toggleSection('smartInfo')}
                />
            )}

            {/* Night Queue Manager */}
            {phase === 'NIGHT' && (
                <STNightQueueManager
                    nightQueue={nightQueue}
                    nightCurrentIndex={nightCurrentIndex}
                    onSetPhase={setPhase}
                    onShowNightAction={onShowNightAction}
                />
            )}

            {/* Voting Controls */}
            <STVotingControls
                voting={voting ?? undefined}
                seats={seats}
                onNextClockHand={nextClockHand}
                onCloseVote={closeVote}
            />

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
