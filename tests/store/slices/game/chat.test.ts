/**
 * Game Chat Slice Tests
 *
 * 聊天功能状态测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameChatSlice } from '../../../../src/store/slices/game/chat';
import type { GameState } from '../../../../src/types';
import type { AppState } from '../../../../src/store/types';

// Mock store state
const createMockStore = () => {
  const mockState: AppState = {
    // GameState
    gameState: {
      roomId: 'test-room',
      currentScriptId: 'tb',
      phase: 'SETUP' as const,
      setupPhase: 'ASSIGNING' as const,
      rolesRevealed: false,
      allowWhispers: false,
      vibrationEnabled: false,
      seats: [],
      messages: [],
      gameOver: { isOver: false, winner: null },
      audio: { trackId: null, isPlaying: false, volume: 1 },
      nightQueue: [],
      nightCurrentIndex: -1,
      voting: null,
      customScripts: {},
      customRoles: {},
      voteHistory: [],
      roundInfo: { dayCount: 0, nightCount: 0, nominationCount: 0, totalRounds: 0 },
      storytellerNotes: [],
      skillDescriptionMode: 'simple' as const,
      aiMessages: [],
      nightActionRequests: [],
      swapRequests: [],
      candlelightEnabled: false,
      dailyNominations: [],
      interactionLog: []
    },
    isAudioBlocked: false,

    // User state
    user: { id: 'user1', name: 'Player1', isStoryteller: false, roomId: null, isSeated: false },
    isAiThinking: false,
    isOffline: false,
    connectionStatus: 'connected' as const,
    aiProvider: 'deepseek' as const,
    roleReferenceMode: 'modal' as const,
    isSidebarExpanded: false,
    isRolePanelOpen: false,
    isRoleRevealOpen: false,
    isTruthRevealOpen: false,
    isReportOpen: false,
    isModalOpen: false,
    audioSettings: {
      mode: 'offline' as const,
      categories: { ambience: true, ui: true, cues: true }
    },

    // Stub methods
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
    setModalOpen: vi.fn(),
    setAudioMode: vi.fn(),
    toggleAudioCategory: vi.fn(),
    phaseActor: null,
    phaseState: 'setup' as const,
    phaseContext: {},
    phaseMachine: {
      startGame: vi.fn(),
      startNight: vi.fn(),
      nextNightAction: vi.fn(),
      prevNightAction: vi.fn(),
      endNight: vi.fn(),
      startVoting: vi.fn(),
      closeVote: vi.fn(),
      endGame: vi.fn()
    },
    initializePhaseMachine: vi.fn(),
    stopPhaseMachine: vi.fn()
  } as any;

  const set = vi.fn((fn: (state: AppState) => void) => {
    fn(mockState);
  });

  const get = vi.fn(() => mockState);

  return { state: mockState, set, get };
};

describe('createGameChatSlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let chatSlice: ReturnType<typeof createGameChatSlice>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    chatSlice = createGameChatSlice(mockStore.set as any, mockStore.get as any, {} as any);
  });

  describe('sendMessage', () => {
    it('should send a public message', () => {
      chatSlice.sendMessage('Hello everyone!', null);

      expect(mockStore.get().sync).toHaveBeenCalled();
      expect(mockStore.state.gameState?.messages?.length).toBe(1);

      const msg = mockStore.state.gameState?.messages?.[0]!;
      expect(msg.content).toBe('Hello everyone!');
      expect(msg.senderId).toBe('user1');
      expect(msg.senderName).toBe('Player1');
      expect(msg.isPrivate).toBe(false);
      expect(msg.type).toBe('chat');
    });

    it('should block private messages when whispers are disabled', () => {
      const gameState = mockStore.state.gameState as Partial<GameState>;
      gameState.allowWhispers = false;
      mockStore.state.user!.isStoryteller = false;

      chatSlice.sendMessage('Secret message', 'user2');

      // Message should not be added
      expect(mockStore.state.gameState?.messages?.length).toBe(0);
    });

    it('should allow private messages when whispers are enabled', () => {
      mockStore.state.gameState!.allowWhispers = true;

      chatSlice.sendMessage('Secret message', 'user2');

      expect(mockStore.state.gameState?.messages?.length).toBe(1);
      const msg = mockStore.state.gameState?.messages?.[0];
      expect(msg?.isPrivate).toBe(true);
      expect(msg?.recipientId).toBe('user2');
    });

    it('should allow storyteller to send private messages regardless of whispers setting', () => {
      mockStore.state.gameState!.allowWhispers = false;
      mockStore.state.user!.isStoryteller = true;

      chatSlice.sendMessage('ST secret', 'user2');

      expect(mockStore.state.gameState?.messages?.length).toBe(1);
    });

    it('should not send message if no user', () => {
      mockStore.state.user = null;

      chatSlice.sendMessage('Test', null);

      expect(mockStore.state.gameState?.messages?.length).toBe(0);
    });

    it('should not send message if no gameState', () => {
      mockStore.state.gameState = null;

      chatSlice.sendMessage('Test', null);

      // Should not crash, sync should still be called
      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('forwardMessage', () => {
    it('should forward an existing message', () => {
      // Add original message
      mockStore.state.gameState!.messages = [{
        id: 'msg1',
        senderId: 'user2',
        senderName: 'Player2',
        recipientId: null,
        content: 'Original message',
        timestamp: Date.now(),
        type: 'chat',
        isPrivate: false
      }];

      chatSlice.forwardMessage('msg1', 'user3');

      expect(mockStore.state.gameState?.messages?.length).toBe(2);
      const forwardedMsg = mockStore.state.gameState?.messages?.[1]!;
      expect(forwardedMsg.content).toContain('[转发]');
      expect(forwardedMsg.content).toContain('Player2');
      expect(forwardedMsg.content).toContain('Original message');
      expect(forwardedMsg.recipientId).toBe('user3');
    });

    it('should not forward non-existent message', () => {
      mockStore.state.gameState!.messages = [];

      chatSlice.forwardMessage('nonexistent', 'user2');

      expect(mockStore.state.gameState?.messages?.length).toBe(0);
    });

    it('should not forward if no user', () => {
      mockStore.state.user = null;
      mockStore.state.gameState!.messages = [{
        id: 'msg1',
        senderId: 'user2',
        senderName: 'Player2',
        recipientId: null,
        content: 'Test',
        timestamp: Date.now(),
        type: 'chat',
        isPrivate: false
      }];

      chatSlice.forwardMessage('msg1', 'user3');

      expect(mockStore.state.gameState?.messages?.length).toBe(1);
    });
  });

  describe('toggleWhispers', () => {
    it('should enable whispers when disabled', () => {
      mockStore.state.gameState!.allowWhispers = false;

      chatSlice.toggleWhispers();

      expect(mockStore.state.gameState?.allowWhispers).toBe(true);
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should disable whispers when enabled', () => {
      mockStore.state.gameState!.allowWhispers = true;

      chatSlice.toggleWhispers();

      expect(mockStore.state.gameState?.allowWhispers).toBe(false);
    });

    it('should add system message on toggle', () => {
      mockStore.state.gameState!.allowWhispers = false;
      mockStore.state.gameState!.messages = [];

      chatSlice.toggleWhispers();

      const sysMsg = mockStore.state.gameState?.messages?.find(m => m.type === 'system');
      expect(sysMsg).toBeDefined();
      expect(sysMsg?.content).toContain('私聊');
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      chatSlice.toggleWhispers();

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });
});
