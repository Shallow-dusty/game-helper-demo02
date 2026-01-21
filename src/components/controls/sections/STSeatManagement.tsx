import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { CollapsibleSection } from './CollapsibleSection';
import { Armchair, Bot, Plus, Minus } from 'lucide-react';

export const STSeatManagement = React.memo<{
    isCollapsed: boolean;
    onToggle: () => void;
}>(({ isCollapsed, onToggle }) => {
    const { t } = useTranslation();

    return (
        <CollapsibleSection
            title={
                <span className="flex items-center gap-2">
                    <Armchair className="w-4 h-4" />
                    {t('controls.st.seatManagement')}
                </span>
            }
            isCollapsed={isCollapsed}
            onToggle={onToggle}
        >
            <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                <button
                    onClick={() => useStore.getState().addVirtualPlayer()}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-2 rounded text-xs border border-stone-600 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                    <Bot className="w-5 h-5" />
                    <span>{t('controls.st.addVirtual')}</span>
                </button>
                <button
                    onClick={() => useStore.getState().addSeat()}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-2 rounded text-xs border border-stone-600 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                    <Plus className="w-5 h-5" />
                    <span>{t('controls.st.addSeat')}</span>
                </button>
                <button
                    onClick={() => useStore.getState().removeSeat()}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-2 rounded text-xs border border-stone-600 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                    <Minus className="w-5 h-5" />
                    <span>{t('controls.st.removeSeat')}</span>
                </button>
            </div>
        </CollapsibleSection>
    );
});
