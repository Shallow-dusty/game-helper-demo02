/**
 * Game Scripts Slice Tests
 *
 * 剧本管理功能状态测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameScriptsSlice } from '../../../../src/store/slices/game/scripts';
import type { GameState, ChatMessage, ScriptDefinition } from '../../../../src/types';
import type { AppState } from '../../../../src/store/types';

// Mock store state - simplified version with just required fields
const createMockStore = () => {
  const gameState: Partial<GameState> = {
    currentScriptId: 'tb',
    customScripts: {} as Record<string, ScriptDefinition>,
    messages: [] as ChatMessage[],
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: false,
    vibrationEnabled: false,
    seats: [],
    gameOver: { isOver: false, winner: null, reason: '' },
    audio: { trackId: null, isPlaying: false, volume: 0.5 },
    nightQueue: [],
    nightCurrentIndex: -1,
    voting: null,
    customRoles: {},
    voteHistory: [],
    roundInfo: { dayCount: 0, nightCount: 0, nominationCount: 0, totalRounds: 0 },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    swapRequests: [],
    candlelightEnabled: false,
    dailyNominations: [],
    interactionLog: [],
    roomId: 'test-room'
  };

  // Create a minimal mock of AppState with all required fields
  const fullState = {
    gameState,
    // GameSlice fields
    isAudioBlocked: false,
    createGame: vi.fn(),
    joinSeat: vi.fn(),
    leaveSeat: vi.fn(),
    sendMessage: vi.fn(),
    forwardMessage: vi.fn(),
    setScript: vi.fn(),
    setPhase: vi.fn(),
    assignRole: vi.fn(),
    toggleDead: vi.fn(),
    toggleAbilityUsed: vi.fn(),
    toggleStatus: vi.fn(),
    toggleWhispers: vi.fn(),
    toggleVibration: vi.fn(),
    addReminder: vi.fn(),
    removeReminder: vi.fn(),
    importScript: vi.fn(),
    saveCustomScript: vi.fn(),
    deleteCustomScript: vi.fn(),
    loadCustomScript: vi.fn(),
    setAudioTrack: vi.fn(),
    toggleAudioPlay: vi.fn(),
    setAudioVolume: vi.fn(),
    setAudioBlocked: vi.fn(),
    nightNext: vi.fn(),
    nightPrev: vi.fn(),
    startVote: vi.fn(),
    nextClockHand: vi.fn(),
    toggleHand: vi.fn(),
    closeVote: vi.fn(),
    toggleReady: vi.fn(),
    addSeat: vi.fn(),
    removeSeat: vi.fn(),
    addVirtualPlayer: vi.fn(),
    removeVirtualPlayer: vi.fn(),
    assignRoles: vi.fn(),
    swapSeats: vi.fn(),
    requestSeatSwap: vi.fn(),
    respondToSwapRequest: vi.fn(),
    forceLeaveSeat: vi.fn(),
    resetRoles: vi.fn(),
    distributeRoles: vi.fn(),
    hideRoles: vi.fn(),
    startGame: vi.fn(),
    endGame: vi.fn(),
    applyStrategy: vi.fn(),
    addStorytellerNote: vi.fn(),
    addAutoNote: vi.fn(),
    updateStorytellerNote: vi.fn(),
    deleteStorytellerNote: vi.fn(),
    toggleNoteFloating: vi.fn(),
    updateNotePosition: vi.fn(),
    setNoteColor: vi.fn(),
    toggleNoteCollapse: vi.fn(),
    sendInfoCard: vi.fn(),
    performNightAction: vi.fn(),
    submitNightAction: vi.fn(),
    resolveNightAction: vi.fn(),
    getPendingNightActions: vi.fn(),
    fetchGameHistory: vi.fn(),
    saveGameHistory: vi.fn(),
    toggleCandlelight: vi.fn(),
    addInteractionLog: vi.fn(),
    // AppState-specific fields
    user: null,
    isAiThinking: false,
    isOffline: false,
    connectionStatus: 'connected',
    aiProvider: 'deepseek',
    roleReferenceMode: 'modal',
    isSidebarExpanded: false,
    isRolePanelOpen: false,
    isRoleRevealOpen: false,
    isTruthRevealOpen: false,
    isReportOpen: false,
    login: vi.fn(),
    joinGame: vi.fn(),
    spectateGame: vi.fn(),
    leaveGame: vi.fn(),
    setRoleReferenceMode: vi.fn(),
    toggleSidebar: vi.fn(),
    openRolePanel: vi.fn(),
    closeRolePanel: vi.fn(),
    openRoleReveal: vi.fn(),
    closeRoleReveal: vi.fn(),
    openTruthReveal: vi.fn(),
    closeTruthReveal: vi.fn(),
    openReport: vi.fn(),
    closeReport: vi.fn(),
    askAi: vi.fn(),
    setAiProvider: vi.fn(),
    clearAiMessages: vi.fn(),
    deleteAiMessage: vi.fn(),
    sync: vi.fn(),
    syncToCloud: vi.fn(),
    refreshFromCloud: vi.fn(),
    isModalOpen: false,
    setModalOpen: vi.fn(),
    audioSettings: { mode: 'online', categories: { ambience: true, ui: true, cues: true } },
    setAudioMode: vi.fn(),
    toggleAudioCategory: vi.fn(),
    // PhaseMachineSlice fields
    phaseActor: null,
    phaseState: 'setup',
    phaseContext: {} as any,
    phaseMachine: {
      startGame: vi.fn(),
      startNight: vi.fn(),
      nextNightAction: vi.fn(),
      prevNightAction: vi.fn(),
      endNight: vi.fn(),
      startVoting: vi.fn(),
      closeVote: vi.fn(),
      endGame: vi.fn(),
    },
    initializePhaseMachine: vi.fn(),
    stopPhaseMachine: vi.fn(),
  } as unknown as AppState;

  const set = vi.fn((fn: (state: AppState) => void) => {
    fn(fullState);
  });

  const get = vi.fn(() => fullState);

  return { gameState, state: fullState, set, get };
};

describe('createGameScriptsSlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let scriptsSlice: ReturnType<typeof createGameScriptsSlice>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    scriptsSlice = createGameScriptsSlice(mockStore.set, mockStore.get, {} as any);
  });

  describe('setScript', () => {
    it('should set the current script', () => {
      scriptsSlice.setScript('bmr');

      expect(mockStore.gameState.currentScriptId).toBe('bmr');
      expect(mockStore.get).toHaveBeenCalled();
    });

    it('should add a system message about the script change', () => {
      scriptsSlice.setScript('snv');

      const sysMsg = mockStore.gameState.messages?.find((m: ChatMessage) => m.type === 'system');
      expect(sysMsg).toBeDefined();
      expect(sysMsg?.content).toContain('剧本已切换');
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      scriptsSlice.setScript('tb');

      expect(mockStore.get).toHaveBeenCalled();
    });

    it('should set trouble brewing script', () => {
      scriptsSlice.setScript('tb');

      expect(mockStore.gameState.currentScriptId).toBe('tb');
    });
  });

  describe('importScript', () => {
    it('should import a valid script JSON', () => {
      const validScript = JSON.stringify({
        id: 'custom1',
        roles: ['imp', 'monk', 'washerwoman']
      });

      scriptsSlice.importScript(validScript);

      expect(mockStore.get).toHaveBeenCalled();
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
      } as ScriptDefinition;

      scriptsSlice.saveCustomScript(customScript);

      expect(mockStore.gameState.customScripts?.custom1).toEqual(customScript);
      expect(mockStore.get).toHaveBeenCalled();
    });

    it('should overwrite existing custom script', () => {
      mockStore.gameState.customScripts = {
        custom1: { id: 'custom1', name: 'Old Script', roles: [] } as ScriptDefinition
      };

      const newScript = {
        id: 'custom1',
        name: 'New Script',
        roles: ['imp']
      } as ScriptDefinition;

      scriptsSlice.saveCustomScript(newScript);

      expect(mockStore.gameState.customScripts?.custom1?.name).toBe('New Script');
    });
  });

  describe('deleteCustomScript', () => {
    it('should delete a custom script', () => {
      mockStore.gameState.customScripts = {
        custom1: { id: 'custom1', name: 'Script 1', roles: [] } as ScriptDefinition,
        custom2: { id: 'custom2', name: 'Script 2', roles: [] } as ScriptDefinition
      };

      scriptsSlice.deleteCustomScript('custom1');

      expect(mockStore.gameState.customScripts?.custom1).toBeUndefined();
      expect(mockStore.gameState.customScripts?.custom2).toBeDefined();
      expect(mockStore.get).toHaveBeenCalled();
    });

    it('should not crash when deleting non-existent script', () => {
      mockStore.gameState.customScripts = {};

      scriptsSlice.deleteCustomScript('nonexistent');

      expect(mockStore.get).toHaveBeenCalled();
    });
  });

  describe('loadCustomScript', () => {
    it('should load a custom script as current', () => {
      scriptsSlice.loadCustomScript('custom1');

      expect(mockStore.gameState.currentScriptId).toBe('custom1');
      expect(mockStore.get).toHaveBeenCalled();
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      scriptsSlice.loadCustomScript('custom1');

      expect(mockStore.get).toHaveBeenCalled();
    });
  });
});
