import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store';
import { SCRIPTS } from '@/constants';
import type { ScriptDefinition } from '@/types';

interface STScriptSelectorProps {
    currentScriptId: string;
    customScripts: Record<string, ScriptDefinition>;
    onSetScript: (scriptId: string) => void;
    onShowScriptEditor: () => void;
}

export const STScriptSelector = React.memo<STScriptSelectorProps>(({
    currentScriptId,
    customScripts,
    onSetScript,
    onShowScriptEditor,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-stone-900 p-3 rounded border border-stone-700">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-stone-500 uppercase block">
                    📖 {t('controls.st.script')}
                </label>
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
                onChange={(e) => onSetScript(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded text-sm text-stone-300 p-2"
            >
                <optgroup label={t('controls.st.officialScripts')}>
                    {Object.values(SCRIPTS).map(script => (
                        <option key={script.id} value={script.id}>{script.name}</option>
                    ))}
                </optgroup>
                {Object.keys(customScripts || {}).length > 0 && (
                    <optgroup label={t('controls.st.customScripts')}>
                        {Object.values(customScripts).map((script: ScriptDefinition) => (
                            <option key={script.id} value={script.id}>{script.name}</option>
                        ))}
                    </optgroup>
                )}
            </select>
        </div>
    );
});
