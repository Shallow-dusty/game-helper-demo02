import { StoreSlice, GameSlice } from '../../types';
import { addSystemMessage } from '../../utils';
import { SCRIPTS } from '@/constants';

export const createGameScriptsSlice: StoreSlice<Pick<GameSlice, 'setScript' | 'importScript' | 'saveCustomScript' | 'deleteCustomScript' | 'loadCustomScript'>> = (set, get) => ({
    setScript: (scriptId) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.currentScriptId = scriptId;
                addSystemMessage(state.gameState, `剧本已切换为: ${SCRIPTS[scriptId]?.name || scriptId}`);
            }
        });
        get().sync();
    },

    importScript: (jsonContent) => {
        try {
            const script = JSON.parse(jsonContent);
            if (!script.id || !Array.isArray(script.roles)) {
                throw new Error("Invalid script format");
            }
            
            set((state) => {
                if (state.gameState) {
                    // Placeholder
                }
            });
            get().sync();
        } catch (e) {
            console.error("Import script failed", e);
        }
    },

    saveCustomScript: (script) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.customScripts[script.id] = script;
            }
        });
        get().sync();
    },

    deleteCustomScript: (scriptId) => {
        set((state) => {
            if (state.gameState) {
                delete state.gameState.customScripts[scriptId];
            }
        });
        get().sync();
    },

    loadCustomScript: (scriptId) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.currentScriptId = scriptId;
            }
        });
        get().sync();
    }
});
