import { StoreSlice, GameSlice } from '../../types';
import { addSystemMessage } from '../../utils';
import { SCRIPTS } from '@/constants';
import type { ScriptDefinition } from '@/types';

const buildScriptDefinition = (value: {
    id: string;
    name?: string;
    author?: string;
    description?: string;
    roles: string[];
    meta?: Record<string, unknown>;
}): ScriptDefinition => ({
    id: value.id,
    name: value.name?.trim() || value.id,
    author: value.author,
    description: value.description,
    roles: value.roles,
    meta: value.meta,
    isCustom: true,
});

const parseScriptDefinition = (value: unknown): ScriptDefinition | null => {
    if (!value || typeof value !== 'object') return null;
    const script = value as Partial<ScriptDefinition>;
    if (typeof script.id !== 'string') return null;
    if (!Array.isArray(script.roles) || !script.roles.every(role => typeof role === 'string')) return null;
    return buildScriptDefinition({
        id: script.id,
        name: typeof script.name === 'string' ? script.name : script.id,
        author: typeof script.author === 'string' ? script.author : undefined,
        description: typeof script.description === 'string' ? script.description : undefined,
        roles: script.roles,
        meta: script.meta,
    });
};

const parseScriptArray = (value: unknown[]): ScriptDefinition | null => {
    const roles = value.flatMap((item) => {
        if (typeof item === 'string') return [item];
        if (!item || typeof item !== 'object') return [];
        const record = item as Record<string, unknown>;
        const roleId = record.id;
        if (typeof roleId !== 'string' || roleId === '_meta') return [];
        return [roleId];
    });
    if (roles.length === 0) return null;

    const metaEntry = value.find((item) => {
        if (!item || typeof item !== 'object') return false;
        const record = item as Record<string, unknown>;
        if (record.id === '_meta') return true;
        return typeof record.name === 'string' && !('id' in record);
    }) as Record<string, unknown> | undefined;

    const name = typeof metaEntry?.name === 'string' ? metaEntry.name : 'Custom Script';
    const author = typeof metaEntry?.author === 'string' ? metaEntry.author : undefined;
    const description = typeof metaEntry?.description === 'string' ? metaEntry.description : undefined;
    const metaId = typeof metaEntry?.id === 'string' && metaEntry.id !== '_meta' ? metaEntry.id : undefined;

    return buildScriptDefinition({
        id: metaId ?? `custom_${Date.now()}`,
        name,
        author,
        description,
        roles,
        meta: metaEntry,
    });
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
            const script = Array.isArray(parsed)
                ? parseScriptArray(parsed)
                : parseScriptDefinition(parsed);
            if (!script) {
                throw new Error("Invalid script format");
            }

            set((state) => {
                if (state.gameState) {
                    state.gameState.customScripts[script.id] = script;
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
