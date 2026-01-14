import React from 'react';
import { useTranslation } from 'react-i18next';

interface HelpModalProps {
    onClose: () => void;
    embedded?: boolean;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose, embedded = false }) => {
    const { t } = useTranslation();

    const content = (
        <div className={embedded ? '' : 'bg-stone-900 border border-stone-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col'}>
            {!embedded && (
                <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950">
                    <h2 className="text-xl font-bold text-stone-200 font-cinzel flex items-center gap-2">
                        {t('ui.helpModal.title')}
                    </h2>
                    <button onClick={onClose} className="text-stone-500 hover:text-stone-300 transition-colors">
                        ✕
                    </button>
                </div>
            )}
            <div className={embedded ? '' : 'p-6 overflow-y-auto'}>
                <div className="space-y-6">
                    <section>
                        <h3 className="text-lg font-bold text-stone-200 mb-3 flex items-center gap-2">
                            <span className="text-amber-700">{t('ui.helpModal.gameFlow.title').split(' ')[0]}</span> {t('ui.helpModal.gameFlow.title').substring(2)}
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-stone-400">
                            <li dangerouslySetInnerHTML={{ __html: t('ui.helpModal.gameFlow.assignRoles') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('ui.helpModal.gameFlow.distributeRoles') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('ui.helpModal.gameFlow.phaseSwitch') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('ui.helpModal.gameFlow.nightActions') }} />
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-stone-200 mb-3 flex items-center gap-2">
                            <span className="text-amber-700">{t('ui.helpModal.grimoireOps.title').split(' ')[0]}</span> {t('ui.helpModal.grimoireOps.title').substring(2)}
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-stone-400">
                            <li dangerouslySetInnerHTML={{ __html: t('ui.helpModal.grimoireOps.rightClickMenu') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('ui.helpModal.grimoireOps.statusManagement') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('ui.helpModal.grimoireOps.addMarkers') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('ui.helpModal.grimoireOps.virtualPlayers') }} />
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-stone-200 mb-3 flex items-center gap-2">
                            <span className="text-amber-700">{t('ui.helpModal.atmosphere.title').split(' ')[0]}</span> {t('ui.helpModal.atmosphere.title').substring(2)}
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-stone-400">
                            <li dangerouslySetInnerHTML={{ __html: t('ui.helpModal.atmosphere.ambientSound') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('ui.helpModal.atmosphere.notebook') }} />
                            <li dangerouslySetInnerHTML={{ __html: t('ui.helpModal.atmosphere.aiAssistant') }} />
                        </ul>
                    </section>

                    <div className="mt-6 p-4 bg-stone-950 rounded border border-stone-800 text-xs text-stone-500 italic text-center">
                        {t('ui.helpModal.tip')}
                    </div>
                </div>
            </div>
        </div>
    );

    if (embedded) return content;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            {content}
        </div>
    );
};



