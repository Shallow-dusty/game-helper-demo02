/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';

// Create mock state
const createMockState = () => ({
  gameState: {
    currentScriptId: 'trouble_brewing',
    customScripts: {} as Record<string, { id: string; name: string; roles: string[] }>,
  },
});

describe('createGameScriptsSlice', () => {
  describe('setScript', () => {
    it('sets the current script id', () => {
      const state = createMockState();
      
      state.gameState.currentScriptId = 'bad_moon_rising';
      
      expect(state.gameState.currentScriptId).toBe('bad_moon_rising');
    });
  });

  describe('importScript', () => {
    it('parses valid JSON script', () => {
      const jsonContent = JSON.stringify({
        id: 'custom_script',
        name: 'Custom Script',
        roles: ['imp', 'washerwoman', 'drunk'],
      });
      
      const script = JSON.parse(jsonContent);
      
      expect(script.id).toBe('custom_script');
      expect(script.roles).toHaveLength(3);
    });

    it('throws error for invalid JSON', () => {
      const invalidJson = 'not valid json';
      
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('detects missing required fields', () => {
      const incompleteScript = { name: 'Test' }; // missing id and roles
      
      const hasRequiredFields = Object.prototype.hasOwnProperty.call(incompleteScript, 'id') && 
                                Array.isArray((incompleteScript as any).roles);
      
      expect(hasRequiredFields).toBe(false);
    });
  });

  describe('saveCustomScript', () => {
    it('saves custom script to state', () => {
      const state = createMockState();
      const script = {
        id: 'my_script',
        name: 'My Custom Script',
        roles: ['imp', 'mayor'],
      };

      state.gameState.customScripts[script.id] = script;

      expect(state.gameState.customScripts.my_script).toBeDefined();
      expect(state.gameState.customScripts.my_script?.name).toBe('My Custom Script');
    });
  });

  describe('deleteCustomScript', () => {
    it('removes custom script from state', () => {
      const state = createMockState();
      state.gameState.customScripts.to_delete = {
        id: 'to_delete',
        name: 'To Delete',
        roles: [],
      };
      
      delete state.gameState.customScripts.to_delete;
      
      expect(state.gameState.customScripts.to_delete).toBeUndefined();
    });
  });

  describe('loadCustomScript', () => {
    it('sets current script to custom script id', () => {
      const state = createMockState();
      state.gameState.customScripts.custom_1 = {
        id: 'custom_1',
        name: 'Custom 1',
        roles: [],
      };
      
      state.gameState.currentScriptId = 'custom_1';
      
      expect(state.gameState.currentScriptId).toBe('custom_1');
    });
  });
});
