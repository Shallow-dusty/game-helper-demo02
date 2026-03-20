/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGameScriptsSlice } from './scripts';

vi.mock('../../utils', () => ({
    addSystemMessage: vi.fn()
}));

vi.mock('@/constants', () => ({
    SCRIPTS: {
        tb: { id: 'tb', name: '暗流涌动 (Trouble Brewing)', roles: [] },
    }
}));

describe('createGameScriptsSlice', () => {
    let mockState: {
        gameState: {
            currentScriptId: string;
            customScripts: Record<string, { id: string; name: string; roles: string[]; author?: string; description?: string; meta?: Record<string, unknown>; isCustom?: boolean }>;
            messages: unknown[];
        } | null;
        user: { id: string; roomId: number; isStoryteller: boolean } | null;
    };

    let slice: ReturnType<typeof createGameScriptsSlice>;
    let mockSync: ReturnType<typeof vi.fn>;

    const createMockSet = () => {
        return (updater: ((state: typeof mockState) => void) | Partial<typeof mockState>) => {
            if (typeof updater === 'function') {
                updater(mockState);
            } else {
                Object.assign(mockState, updater);
            }
        };
    };

    const createMockGet = () => {
        return () => ({
            ...mockState,
            sync: mockSync,
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockSync = vi.fn();

        mockState = {
            gameState: {
                currentScriptId: 'tb',
                customScripts: {},
                messages: [],
            },
            user: { id: 'user1', roomId: 123, isStoryteller: true },
        };

        slice = createGameScriptsSlice(
            createMockSet() as unknown as Parameters<typeof createGameScriptsSlice>[0],
            createMockGet() as unknown as Parameters<typeof createGameScriptsSlice>[1],
            {} as Parameters<typeof createGameScriptsSlice>[2]
        );
    });

    describe('setScript', () => {
        it('should set currentScriptId and call sync', () => {
            slice.setScript('bmr');
            expect(mockState.gameState!.currentScriptId).toBe('bmr');
            expect(mockSync).toHaveBeenCalled();
        });

        it('should do nothing if user is not storyteller', () => {
            mockState.user = { id: 'user1', roomId: 123, isStoryteller: false };
            slice.setScript('bmr');
            expect(mockState.gameState!.currentScriptId).toBe('tb');
            expect(mockSync).not.toHaveBeenCalled();
        });

        it('should do nothing if user is null', () => {
            mockState.user = null;
            slice.setScript('bmr');
            expect(mockState.gameState!.currentScriptId).toBe('tb');
            expect(mockSync).not.toHaveBeenCalled();
        });

        it('should still call sync even if gameState is null (guard is inside set callback)', () => {
            mockState.gameState = null;
            slice.setScript('bmr');
            expect(mockSync).toHaveBeenCalled();
        });
    });

    describe('importScript', () => {
        it('should import a valid object-format script', () => {
            const jsonContent = JSON.stringify({
                id: 'custom_1',
                name: 'My Script',
                author: 'Tester',
                description: 'A test script',
                roles: ['imp', 'washerwoman', 'drunk'],
            });
            slice.importScript(jsonContent);
            expect(mockState.gameState!.customScripts.custom_1).toBeDefined();
            expect(mockState.gameState!.customScripts.custom_1.name).toBe('My Script');
            expect(mockState.gameState!.customScripts.custom_1.author).toBe('Tester');
            expect(mockState.gameState!.customScripts.custom_1.isCustom).toBe(true);
            expect(mockSync).toHaveBeenCalled();
        });

        it('should import a valid array-format script with string roles', () => {
            const jsonContent = JSON.stringify(['imp', 'washerwoman', 'drunk']);
            slice.importScript(jsonContent);
            const keys = Object.keys(mockState.gameState!.customScripts);
            expect(keys).toHaveLength(1);
            const script = mockState.gameState!.customScripts[keys[0]];
            expect(script.roles).toEqual(['imp', 'washerwoman', 'drunk']);
            expect(script.name).toBe('Custom Script');
            expect(mockSync).toHaveBeenCalled();
        });

        it('should import array-format script with object roles', () => {
            const jsonContent = JSON.stringify([
                { id: 'imp' },
                { id: 'washerwoman' },
                { id: '_meta', name: 'Test Script', author: 'Author', description: 'Desc' },
            ]);
            slice.importScript(jsonContent);
            const keys = Object.keys(mockState.gameState!.customScripts);
            expect(keys).toHaveLength(1);
            const script = mockState.gameState!.customScripts[keys[0]];
            expect(script.roles).toEqual(['imp', 'washerwoman']);
            expect(script.name).toBe('Test Script');
            expect(script.author).toBe('Author');
            expect(script.description).toBe('Desc');
        });

        it('should use meta entry with name but no id as metadata', () => {
            const jsonContent = JSON.stringify([
                { id: 'imp' },
                { name: 'Named Script', author: 'Someone' },
            ]);
            slice.importScript(jsonContent);
            const keys = Object.keys(mockState.gameState!.customScripts);
            expect(keys).toHaveLength(1);
            const script = mockState.gameState!.customScripts[keys[0]];
            expect(script.roles).toEqual(['imp']);
            expect(script.name).toBe('Named Script');
        });

        it('should handle array with non-object/non-string items', () => {
            const jsonContent = JSON.stringify([123, null, 'imp', true]);
            slice.importScript(jsonContent);
            const keys = Object.keys(mockState.gameState!.customScripts);
            expect(keys).toHaveLength(1);
            expect(mockState.gameState!.customScripts[keys[0]].roles).toEqual(['imp']);
        });

        it('should not import if array has no valid roles', () => {
            const jsonContent = JSON.stringify([null, 123, true]);
            slice.importScript(jsonContent);
            expect(Object.keys(mockState.gameState!.customScripts)).toHaveLength(0);
            expect(mockSync).not.toHaveBeenCalled();
        });

        it('should not import object script without id', () => {
            const jsonContent = JSON.stringify({ name: 'No ID', roles: ['imp'] });
            slice.importScript(jsonContent);
            expect(Object.keys(mockState.gameState!.customScripts)).toHaveLength(0);
            expect(mockSync).not.toHaveBeenCalled();
        });

        it('should not import object script without roles array', () => {
            const jsonContent = JSON.stringify({ id: 'test', roles: 'not_array' });
            slice.importScript(jsonContent);
            expect(Object.keys(mockState.gameState!.customScripts)).toHaveLength(0);
        });

        it('should not import object script with non-string roles', () => {
            const jsonContent = JSON.stringify({ id: 'test', roles: [1, 2] });
            slice.importScript(jsonContent);
            expect(Object.keys(mockState.gameState!.customScripts)).toHaveLength(0);
        });

        it('should handle invalid JSON gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            slice.importScript('not valid json');
            expect(Object.keys(mockState.gameState!.customScripts)).toHaveLength(0);
            expect(mockSync).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should not import if null parsed', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            slice.importScript('null');
            expect(Object.keys(mockState.gameState!.customScripts)).toHaveLength(0);
            consoleSpy.mockRestore();
        });

        it('should do nothing if user is not storyteller', () => {
            mockState.user = { id: 'user1', roomId: 123, isStoryteller: false };
            slice.importScript(JSON.stringify({ id: 'x', roles: ['imp'] }));
            expect(Object.keys(mockState.gameState!.customScripts)).toHaveLength(0);
            expect(mockSync).not.toHaveBeenCalled();
        });

        it('should use script.id as name fallback in object format', () => {
            const jsonContent = JSON.stringify({ id: 'fallback_test', roles: ['imp'] });
            slice.importScript(jsonContent);
            expect(mockState.gameState!.customScripts.fallback_test.name).toBe('fallback_test');
        });

        it('should trim whitespace-only name to fallback to id', () => {
            const jsonContent = JSON.stringify({ id: 'trimmed', name: '   ', roles: ['imp'] });
            slice.importScript(jsonContent);
            expect(mockState.gameState!.customScripts.trimmed.name).toBe('trimmed');
        });

        it('should handle metaEntry with id that is not _meta in array format', () => {
            const jsonContent = JSON.stringify([
                { id: 'real_id', name: 'Script With ID' },
            ]);
            slice.importScript(jsonContent);
            const keys = Object.keys(mockState.gameState!.customScripts);
            expect(keys).toHaveLength(1);
            // real_id is used as a role, meta entry matched via name + no-id check fails since id exists
            expect(mockState.gameState!.customScripts[keys[0]].roles).toEqual(['real_id']);
        });
    });

    describe('saveCustomScript', () => {
        it('should save custom script and call sync', () => {
            const script = {
                id: 'my_script',
                name: 'My Custom Script',
                roles: ['imp', 'mayor'],
            };
            slice.saveCustomScript(script);
            expect(mockState.gameState!.customScripts.my_script).toBeDefined();
            expect(mockState.gameState!.customScripts.my_script.name).toBe('My Custom Script');
            expect(mockSync).toHaveBeenCalled();
        });

        it('should do nothing if user is not storyteller', () => {
            mockState.user = { id: 'user1', roomId: 123, isStoryteller: false };
            slice.saveCustomScript({ id: 'x', name: 'X', roles: [] });
            expect(Object.keys(mockState.gameState!.customScripts)).toHaveLength(0);
            expect(mockSync).not.toHaveBeenCalled();
        });

        it('should still call sync even if gameState is null', () => {
            mockState.gameState = null;
            slice.saveCustomScript({ id: 'x', name: 'X', roles: [] });
            expect(mockSync).toHaveBeenCalled();
        });
    });

    describe('deleteCustomScript', () => {
        it('should remove a custom script and call sync', () => {
            mockState.gameState!.customScripts.to_delete = {
                id: 'to_delete', name: 'To Delete', roles: [],
            };
            slice.deleteCustomScript('to_delete');
            expect(mockState.gameState!.customScripts.to_delete).toBeUndefined();
            expect(mockSync).toHaveBeenCalled();
        });

        it('should do nothing if user is not storyteller', () => {
            mockState.gameState!.customScripts.keep = {
                id: 'keep', name: 'Keep', roles: [],
            };
            mockState.user = { id: 'user1', roomId: 123, isStoryteller: false };
            slice.deleteCustomScript('keep');
            expect(mockState.gameState!.customScripts.keep).toBeDefined();
            expect(mockSync).not.toHaveBeenCalled();
        });

        it('should still call sync even if gameState is null', () => {
            mockState.gameState = null;
            slice.deleteCustomScript('any');
            expect(mockSync).toHaveBeenCalled();
        });
    });

    describe('loadCustomScript', () => {
        it('should set currentScriptId and call sync', () => {
            slice.loadCustomScript('custom_1');
            expect(mockState.gameState!.currentScriptId).toBe('custom_1');
            expect(mockSync).toHaveBeenCalled();
        });

        it('should do nothing if user is not storyteller', () => {
            mockState.user = { id: 'user1', roomId: 123, isStoryteller: false };
            slice.loadCustomScript('custom_1');
            expect(mockState.gameState!.currentScriptId).toBe('tb');
            expect(mockSync).not.toHaveBeenCalled();
        });

        it('should still call sync even if gameState is null', () => {
            mockState.gameState = null;
            slice.loadCustomScript('custom_1');
            expect(mockSync).toHaveBeenCalled();
        });
    });
});
