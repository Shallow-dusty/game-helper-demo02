import { StoreSlice, GameSlice } from '../../types';
import { addSystemMessage } from '../../utils';
import { SCRIPTS } from '../../../constants';

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
            const data = JSON.parse(jsonContent);
            let scriptId = `custom_${Date.now()}`;
            let scriptName = "Custom Script";
            let roles: string[] = [];

            // Case 1: Array of Role Objects (Official Tool)
            if (Array.isArray(data)) {
                const meta = data.find((item: any) => item.id === '_meta');
                if (meta) {
                    scriptName = meta.name || scriptName;
                }
                roles = data
                    .filter((item: any) => item.id !== '_meta')
                    .map((item: any) => typeof item === 'string' ? item : item.id);
            } 
            // Case 2: Object with roles array
            else if (data.roles && Array.isArray(data.roles)) {
                scriptName = data.name || scriptName;
                roles = data.roles;
            }
            // Case 3: Simple Array of Strings
            else if (Array.isArray(data) && data.every(i => typeof i === 'string')) {
                roles = data;
            }
            else {
                throw new Error("Unknown script format");
            }

            if (roles.length === 0) throw new Error("No roles found in script");

            const newScript = {
                id: scriptId,
                name: scriptName,
                roles: roles
            };

            set((state) => {
                if (state.gameState) {
                    if (!state.gameState.customScripts) {
                        state.gameState.customScripts = {};
                    }
                    state.gameState.customScripts[scriptId] = newScript;
                    state.gameState.currentScriptId = scriptId;
                    addSystemMessage(state.gameState, `已导入并切换剧本: ${scriptName}`);
                }
            });
            get().sync();
        } catch (e) {
            console.error("Import script failed", e);
            // We might want to expose this error to UI, but for now console is fine
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
