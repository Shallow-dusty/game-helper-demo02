import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { Shield, Drama, Dices, Eye, BarChart3 } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface STRoleManagementProps {
    isCollapsed: boolean;
    onToggle: () => void;
    onShowCompositionGuide: () => void;
    onDistributeClick: () => void;
    onShowRuleCompliance: () => void;
}

export const STRoleManagement = React.memo<STRoleManagementProps>(({
    isCollapsed,
    onToggle,
    onShowCompositionGuide,
    onDistributeClick,
    onShowRuleCompliance,
}) => {
    const { t } = useTranslation();

    return (
        <CollapsibleSection
            title={
                <span className="flex items-center gap-2">
                    <Drama className="w-4 h-4" />
                    {t('controls.st.roleManagement')}
                </span>
            }
            isCollapsed={isCollapsed}
            onToggle={onToggle}
        >
            <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                <button
                    onClick={() => useStore.getState().assignRoles()}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                    <Dices className="w-4 h-4" />
                    {t('controls.st.autoAssign')}
                </button>
                <button
                    onClick={onDistributeClick}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                    <Eye className="w-4 h-4" />
                    {t('controls.st.distributeRoles')}
                </button>
                <button
                    onClick={onShowCompositionGuide}
                    className="bg-stone-800 hover:bg-amber-900 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                    <BarChart3 className="w-4 h-4" />
                    {t('controls.st.viewComposition')}
                </button>
                <button
                    onClick={onShowRuleCompliance}
                    className="bg-stone-800 hover:bg-emerald-900 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                    <Shield className="w-4 h-4" />
                    {t('controls.st.ruleCheck')}
                </button>
            </div>
        </CollapsibleSection>
    );
});
