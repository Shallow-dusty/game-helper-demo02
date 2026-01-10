/**
 * Game Scripts Slice Tests
 *
 * 剧本管理功能状态测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameScriptsSlice } from '../../../../src/store/slices/game/scripts';
import type { GameState, Message, CustomScript } from '../../../../src/types';

// Mock store state
const createMockStore = () => {
  const state: {
    gameState: Partial<GameState> | null;
    sync: () => void;
  } = {
    gameState: {
      currentScriptId: 'tb',
      customScripts: {} as Record<string, CustomScript>,
      messages: [] as Message[]
    } as Partial<GameState>,
    sync: vi.fn()
  };

  const set = vi.fn((fn: (state: typeof state) => void) => {
    fn(state);
  });

  const get = vi.fn(() => state);

  return { state, set, get };
};

describe('createGameScriptsSlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let scriptsSlice: ReturnType<typeof createGameScriptsSlice>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    scriptsSlice = createGameScriptsSlice(mockStore.set, mockStore.get, {});
  });

  describe('setScript', () => {
    it('should set the current script', () => {
      scriptsSlice.setScript('bmr');

      expect(mockStore.state.gameState?.currentScriptId).toBe('bmr');
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should add a system message about the script change', () => {
      scriptsSlice.setScript('snv');

      const sysMsg = mockStore.state.gameState?.messages?.find(m => m.type === 'system');
      expect(sysMsg).toBeDefined();
      expect(sysMsg?.content).toContain('剧本已切换');
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      scriptsSlice.setScript('tb');

      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should set trouble brewing script', () => {
      scriptsSlice.setScript('tb');

      expect(mockStore.state.gameState?.currentScriptId).toBe('tb');
    });
  });

  describe('importScript', () => {
    it('should import a valid script JSON', () => {
      const validScript = JSON.stringify({
        id: 'custom1',
        roles: ['imp', 'monk', 'washerwoman']
      });

      scriptsSlice.importScript(validScript);

      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should log error for invalid JSON', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      scriptsSlice.importScript('invalid json');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error for missing id', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      scriptsSlice.importScript(JSON.stringify({ roles: [] }));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error for missing roles array', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      scriptsSlice.importScript(JSON.stringify({ id: 'test' }));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log error if roles is not an array', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      scriptsSlice.importScript(JSON.stringify({ id: 'test', roles: 'not an array' }));

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('saveCustomScript', () => {
    it('should save a custom script', () => {
      const customScript = {
        id: 'custom1',
        name: 'My Custom Script',
        roles: ['imp', 'monk']
      } as CustomScript;

      scriptsSlice.saveCustomScript(customScript);

      expect(mockStore.state.gameState?.customScripts?.['custom1']).toEqual(customScript);
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should overwrite existing custom script', () => {
      mockStore.state.gameState!.customScripts = {
        custom1: { id: 'custom1', name: 'Old Script', roles: [] } as CustomScript
      };

      const newScript = {
        id: 'custom1',
        name: 'New Script',
        roles: ['imp']
      } as CustomScript;

      scriptsSlice.saveCustomScript(newScript);

      expect(mockStore.state.gameState?.customScripts?.['custom1']?.name).toBe('New Script');
    });
  });

  describe('deleteCustomScript', () => {
    it('should delete a custom script', () => {
      mockStore.state.gameState!.customScripts = {
        custom1: { id: 'custom1', name: 'Script 1', roles: [] } as CustomScript,
        custom2: { id: 'custom2', name: 'Script 2', roles: [] } as CustomScript
      };

      scriptsSlice.deleteCustomScript('custom1');

      expect(mockStore.state.gameState?.customScripts?.['custom1']).toBeUndefined();
      expect(mockStore.state.gameState?.customScripts?.['custom2']).toBeDefined();
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not crash when deleting non-existent script', () => {
      mockStore.state.gameState!.customScripts = {};

      scriptsSlice.deleteCustomScript('nonexistent');

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('loadCustomScript', () => {
    it('should load a custom script as current', () => {
      scriptsSlice.loadCustomScript('custom1');

      expect(mockStore.state.gameState?.currentScriptId).toBe('custom1');
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      scriptsSlice.loadCustomScript('custom1');

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });
});
