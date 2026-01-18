import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { Shield } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface STRoleManagementProps {
    isCollapsed: boolean;
    onToggle: () => void;
    onShowCompositionGuide: () => void;
    onDistributeClick: () => void;
    onShowRuleCompliance: () => void;
}

export const STRoleManagement: React.FC<STRoleManagementProps> = ({
    isCollapsed,
    onToggle,
    onShowCompositionGuide,
    onDistributeClick,
    onShowRuleCompliance,
}) => {
    const { t } = useTranslation();

    return (
        <CollapsibleSection
            title={`🎭 ${t('controls.st.roleManagement')}`}
            isCollapsed={isCollapsed}
            onToggle={onToggle}
        >
            <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                <button
                    onClick={() => useStore.getState().assignRoles()}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-2"
                >
                    <span>🎲</span> {t('controls.st.autoAssign')}
                </button>
                <button
                    onClick={onDistributeClick}
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
                    onClick={onShowRuleCompliance}
                    className="bg-stone-800 hover:bg-emerald-900 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-2"
                >
                    <Shield className="w-3 h-3" /> {t('controls.st.ruleCheck')}
                </button>
            </div>
        </CollapsibleSection>
    );
};
