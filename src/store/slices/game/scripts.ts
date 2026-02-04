import { StoreSlice, GameSlice } from '../../types';
import { addSystemMessage } from '../../utils';
import { SCRIPTS } from '@/constants';
import type { ScriptDefinition } from '@/types';

const parseScriptDefinition = (value: unknown): ScriptDefinition | null => {
    if (!value || typeof value !== 'object') return null;
    const script = value as Partial<ScriptDefinition>;
    if (typeof script.id !== 'string' || typeof script.name !== 'string') return null;
    if (!Array.isArray(script.roles) || !script.roles.every(role => typeof role === 'string')) return null;
    return script as ScriptDefinition;
};

export const createGameScriptsSlice: StoreSlice<Pick<GameSlice, 'setScript' | 'importScript' | 'saveCustomScript' | 'deleteCustomScript' | 'loadCustomScript'>> = (set, get) => ({
    setScript: (scriptId) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.currentScriptId = scriptId;
                addSystemMessage(state.gameState, `剧本已切换为: ${SCRIPTS[scriptId]?.name || scriptId}`);
            }
        });
        get().sync();
    },

    importScript: (jsonContent) => {
        if (!get().user?.isStoryteller) return;
        try {
            const parsed: unknown = JSON.parse(jsonContent);
            const script = parseScriptDefinition(parsed);
            if (!script) {
                throw new Error("Invalid script format");
            }
            
            set((state) => {
                if (state.gameState) {
                    // Placeholder
                }
            });
            get().sync();
        } catch (error) {
            console.error("Import script failed", error);
        }
    },

    saveCustomScript: (script) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.customScripts[script.id] = script;
            }
        });
        get().sync();
    },

    deleteCustomScript: (scriptId) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const { [scriptId]: _removed, ...rest } = state.gameState.customScripts;
                state.gameState.customScripts = rest;
            }
        });
        get().sync();
    },

    loadCustomScript: (scriptId) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.currentScriptId = scriptId;
            }
        });
        get().sync();
    }
});
