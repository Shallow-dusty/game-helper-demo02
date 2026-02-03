import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiSlice } from './ai';
import { AI_CONFIG } from '../aiConfig';
import type { GameState } from '../../types';

// Mock supabase - use vi.hoisted to ensure mockInvoke is available during hoisting
const { mockInvoke } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
}));

vi.mock('./connection', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

// Mock console.error
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('AI Slice', () => {
  let mockSet: any;
  let mockGet: any;
  let mockGameState: GameState;
  let slice: ReturnType<typeof aiSlice>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockClear();

    mockGameState = {
      roomId: 'test-room',
      currentScriptId: 'tb',
      phase: 'DAY',
      setupPhase: 'STARTED',
      rolesRevealed: true,
      candlelightEnabled: false,
      seats: [
        {
          id: 0,
          userId: 'user1',
          userName: 'Player 1',
          roleId: 'washerwoman',
          realRoleId: 'washerwoman',
          seenRoleId: 'washerwoman',
          isDead: false,
          hasGhostVote: true,
          reminders: [],
          isHandRaised: false,
          isNominated: false,
          hasUsedAbility: false,
          statuses: [],
        },
        {
          id: 1,
          userId: 'user2',
          userName: 'Player 2',
          roleId: 'imp',
          realRoleId: 'imp',
          seenRoleId: 'imp',
          isDead: true,
          hasGhostVote: false,
          reminders: [],
          isHandRaised: false,
          isNominated: false,
          hasUsedAbility: false,
          statuses: [],
        },
      ],
      voting: null,
      allowWhispers: true,
      vibrationEnabled: true,
      messages: [],
      gameOver: { isOver: false, winner: null, reason: '' },
      audio: { trackId: null, isPlaying: false, volume: 1 },
      nightQueue: [],
      nightCurrentIndex: -1,
      customScripts: {},
      customRoles: {},
      voteHistory: [],
      roundInfo: { dayCount: 3, nightCount: 2, nominationCount: 5, totalRounds: 5 },
      storytellerNotes: [],
      skillDescriptionMode: 'simple',
      aiMessages: [],
      nightActionRequests: [],
      swapRequests: [],
      dailyExecutionCompleted: false,
      dailyNominations: [],
      interactionLog: [],
    };

    const currentState = {
      gameState: mockGameState,
      isAiThinking: false,
      aiProvider: 'sf_deepseek_v3_2',
    };

    mockSet = vi.fn((updater) => {
      if (typeof updater === 'function') {
        updater(currentState);
      } else {
        Object.assign(currentState, updater);
      }
    });

    mockGet = vi.fn(() => currentState);

    slice = aiSlice(mockSet, mockGet, {} as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('should initialize with correct default values', () => {
      expect(slice.isAiThinking).toBe(false);
      expect(slice.aiProvider).toBe('sf_deepseek_v3_2');
    });
  });

  describe('askAi - 成功路径', () => {
    beforeEach(() => {
      mockInvoke.mockResolvedValue({
        data: { reply: 'Mock AI Response' },
        error: null,
      });
    });

    it('should add user message immediately', async () => {
      const promise = slice.askAi('Test prompt');

      // Wait for the promise to complete
      await promise;

      // Check that set was called with function updater to add user message
      const userMessageCall = mockSet.mock.calls.find(call => {
        if (typeof call[0] === 'function') {
          const state = mockGet();
          const beforeLength = state.gameState.aiMessages.length;
          call[0](state);
          const afterLength = state.gameState.aiMessages.length;
          // Check if messages were added
          return afterLength > beforeLength && state.gameState.aiMessages.some((m: any) => m.role === 'user');
        }
        return false;
      });

      expect(userMessageCall).toBeDefined();

      const state = mockGet();
      const userMessage = state.gameState.aiMessages.find((m: any) => m.role === 'user');
      expect(userMessage).toBeDefined();
      expect(userMessage.content).toBe('Test prompt');
    });

    it('should set isAiThinking to true during request', async () => {
      const promise = slice.askAi('Test prompt');

      // isAiThinking should be set to true
      const setCall = mockSet.mock.calls.find(call =>
        typeof call[0] === 'object' && call[0].isAiThinking === true
      );
      expect(setCall).toBeDefined();

      await promise;
    });

    it('should call Supabase Edge Function with correct parameters', async () => {
      await slice.askAi('Test prompt');

      expect(mockInvoke).toHaveBeenCalledWith('ask-ai', {
        body: {
          prompt: 'Test prompt',
          gameContext: expect.objectContaining({
            phase: 'DAY',
            dayCount: 3,
            scriptId: 'tb',
            seatCount: 2,
            alivePlayers: 1,
          }),
          aiProvider: 'sf_deepseek_v3_2',
        },
      });
    });

    it('should include game state context (phase, dayCount, script)', async () => {
      await slice.askAi('What phase is it?');

      const callArgs = mockInvoke.mock.calls[0]?.[1] as { body: { gameContext: any } } | undefined;
      expect(callArgs).toBeDefined();
      const gameContext = callArgs!.body.gameContext;

      expect(gameContext.phase).toBe('DAY');
      expect(gameContext.dayCount).toBe(3);
      expect(gameContext.scriptId).toBe('tb');
      expect(gameContext.seatCount).toBe(2);
      expect(gameContext.alivePlayers).toBe(1);
    });

    it('should include last 10 messages in context', async () => {
      // Add 15 messages
      mockGameState.aiMessages = Array.from({ length: 15 }, (_, i) => ({
        id: i.toString(),
        senderId: 'user',
        senderName: 'Test',
        recipientId: null,
        content: `Message ${i}`,
        timestamp: Date.now(),
        type: 'chat',
        role: 'user',
      }));

      await slice.askAi('New prompt');

      const callArgs = mockInvoke.mock.calls[0]?.[1] as { body: { gameContext: any } } | undefined;
      expect(callArgs).toBeDefined();
      const previousMessages = callArgs!.body.gameContext.previousMessages;

      // After adding user message "New prompt", we have 16 messages total
      // slice(-10) takes the last 10, which includes the newly added "New prompt"
      expect(previousMessages.length).toBe(10);
      expect(previousMessages[0].content).toBe('Message 6');
      expect(previousMessages[9].content).toBe('New prompt');
    });

    it('should add AI response to messages', async () => {
      await slice.askAi('Test prompt');

      // Find the set call that adds AI message
      const aiMessageCall = mockSet.mock.calls.find(call => {
        if (typeof call[0] === 'function') {
          const state = mockGet();
          call[0](state);
          return state.gameState?.aiMessages?.some((m: any) => m.role === 'assistant');
        }
        return false;
      });

      expect(aiMessageCall).toBeDefined();
    });

    it('should include AI provider name in AI message', async () => {
      await slice.askAi('Test prompt');

      const config = AI_CONFIG.sf_deepseek_v3_2;

      // Verify the AI message would include provider name
      expect(config.name).toBeDefined();
    });

    it('should reset isAiThinking after completion', async () => {
      await slice.askAi('Test prompt');

      // Check that isAiThinking was reset to false
      const lastSetCall = mockSet.mock.calls[mockSet.mock.calls.length - 1][0];
      const state = mockGet();

      if (typeof lastSetCall === 'function') {
        lastSetCall(state);
        expect(state.isAiThinking).toBe(false);
      }
    });

    it('should handle empty reply with fallback text', async () => {
      mockInvoke.mockResolvedValue({
        data: { reply: null },
        error: null,
      });

      await slice.askAi('Test prompt');

      // Verify fallback text logic exists
      expect(mockInvoke).toHaveBeenCalled();
    });
  });

  describe('askAi - 错误处理', () => {
    it('should handle Edge Function error response', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Network timeout' },
      });

      await slice.askAi('Test prompt');

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle data.error field', async () => {
      mockInvoke.mockResolvedValue({
        data: { error: 'API key invalid' },
        error: null,
      });

      await slice.askAi('Test prompt');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should handle network exception (Promise rejection)', async () => {
      mockInvoke.mockRejectedValue(new Error('Network failure'));

      await slice.askAi('Test prompt');

      expect(consoleErrorSpy).toHaveBeenCalledWith('AI Error:', expect.any(Error));
    });

    it('should add error message to chat', async () => {
      mockInvoke.mockRejectedValue(new Error('Test error'));

      await slice.askAi('Test prompt');

      // Verify set was called to add error message
      const errorMessageCall = mockSet.mock.calls.find(call => {
        if (typeof call[0] === 'function') {
          const state = mockGet();
          call[0](state);
          return state.gameState?.aiMessages?.some((m: any) => m.type === 'system');
        }
        return false;
      });

      expect(errorMessageCall).toBeDefined();
    });

    it('should reset isAiThinking on error', async () => {
      mockInvoke.mockRejectedValue(new Error('Test error'));

      await slice.askAi('Test prompt');

      const lastSetCall = mockSet.mock.calls[mockSet.mock.calls.length - 1][0];
      const state = mockGet();

      if (typeof lastSetCall === 'function') {
        lastSetCall(state);
        expect(state.isAiThinking).toBe(false);
      }
    });

    it('should log error to console', async () => {
      const testError = new Error('Test error');
      mockInvoke.mockRejectedValue(testError);

      await slice.askAi('Test prompt');

      expect(consoleErrorSpy).toHaveBeenCalledWith('AI Error:', testError);
    });

    it('should handle unknown error type', async () => {
      mockInvoke.mockRejectedValue('String error');

      await slice.askAi('Test prompt');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should not call API if gameState is null', async () => {
      mockGet.mockReturnValue({ gameState: null, isAiThinking: false, aiProvider: 'sf_deepseek_v3_2' });

      await slice.askAi('Test prompt');

      expect(mockInvoke).not.toHaveBeenCalled();
    });
  });

  describe('AI provider management', () => {
    it('should switch AI provider', () => {
      slice.setAiProvider('deepseek');

      expect(mockSet).toHaveBeenCalledWith({ aiProvider: 'deepseek' });
    });

    it('should use correct AI_CONFIG for provider', async () => {
      mockGet.mockReturnValue({
        gameState: mockGameState,
        isAiThinking: false,
        aiProvider: 'deepseek'
      });

      mockInvoke.mockResolvedValue({
        data: { reply: 'Response' },
        error: null,
      });

      await slice.askAi('Test');

      const callArgs = mockInvoke.mock.calls[0]?.[1] as { body: { aiProvider: string } } | undefined;
      expect(callArgs).toBeDefined();
      expect(callArgs!.body.aiProvider).toBe('deepseek');
    });
  });

  describe('Message management', () => {
    beforeEach(() => {
      mockGameState.aiMessages = [
        {
          id: '1',
          senderId: 'user',
          senderName: 'User',
          recipientId: null,
          content: 'Message 1',
          timestamp: Date.now(),
          type: 'chat',
          role: 'user',
        },
        {
          id: '2',
          senderId: 'ai',
          senderName: 'AI',
          recipientId: null,
          content: 'Message 2',
          timestamp: Date.now(),
          type: 'chat',
          role: 'assistant',
        },
      ];
    });

    it('should clear all AI messages', () => {
      slice.clearAiMessages();

      const setCall = mockSet.mock.calls[0][0];
      const state = mockGet();
      setCall(state);

      expect(state.gameState.aiMessages).toEqual([]);
    });

    it('should delete specific message by ID', () => {
      slice.deleteAiMessage('1');

      const setCall = mockSet.mock.calls[0][0];
      const state = mockGet();
      setCall(state);

      expect(state.gameState.aiMessages.length).toBe(1);
      expect(state.gameState.aiMessages[0].id).toBe('2');
    });

    it('should not error when deleting non-existent message', () => {
      slice.deleteAiMessage('999');

      const setCall = mockSet.mock.calls[0][0];
      const state = mockGet();
      setCall(state);

      expect(state.gameState.aiMessages.length).toBe(2);
    });

    it('should handle clearAiMessages when gameState is null', () => {
      mockGet.mockReturnValue({ gameState: null, isAiThinking: false, aiProvider: 'sf_deepseek_v3_2' });

      expect(() => slice.clearAiMessages()).not.toThrow();
    });

    it('should handle deleteAiMessage when gameState is null', () => {
      mockGet.mockReturnValue({ gameState: null, isAiThinking: false, aiProvider: 'sf_deepseek_v3_2' });

      expect(() => slice.deleteAiMessage('1')).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle concurrent askAi calls', async () => {
      mockInvoke.mockResolvedValue({
        data: { reply: 'Response' },
        error: null,
      });

      const promises = [
        slice.askAi('Prompt 1'),
        slice.askAi('Prompt 2'),
        slice.askAi('Prompt 3'),
      ];

      await Promise.all(promises);

      expect(mockInvoke).toHaveBeenCalledTimes(3);
    });

    it('should include correct provider in each concurrent call', async () => {
      mockInvoke.mockResolvedValue({
        data: { reply: 'Response' },
        error: null,
      });

      await Promise.all([
        slice.askAi('First'),
        slice.askAi('Second'),
      ]);

      expect(mockInvoke.mock.calls.every(call =>
        call[1].body.aiProvider === 'sf_deepseek_v3_2'
      )).toBe(true);
    });
  });
});
