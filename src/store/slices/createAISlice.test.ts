/**
 * createAISlice Tests
 *
 * Comprehensive tests for AI assistant state management
 * Tests the Supabase Edge Function integration for AI chat
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAISlice, type AISlice } from './createAISlice';
import type { ChatMessage } from '../../types';
import type { AiProvider } from '../types';

// Mock supabase
const mockInvoke = vi.fn();
vi.mock('./connection', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args)
    }
  }
}));

vi.mock('../aiConfig', () => ({
  AI_CONFIG: {
    sf_deepseek_v3_2: {
      name: 'SiliconFlow DeepSeek V3',
      model: 'deepseek-chat'
    },
    gemini: {
      name: 'Google Gemini',
      model: 'gemini-pro'
    },
    deepseek: {
      name: 'DeepSeek',
      model: 'deepseek-chat'
    },
    kimi: {
      name: 'Kimi',
      model: 'moonshot-v1-8k'
    },
    glm: {
      name: 'GLM',
      model: 'glm-4'
    },
    hw_deepseek_v3: {
      name: 'HW DeepSeek V3',
      model: 'deepseek-v3'
    },
    hw_deepseek_r1: {
      name: 'HW DeepSeek R1',
      model: 'deepseek-r1'
    }
  } as Record<AiProvider, { name: string; model: string }>
}));

// Create a mock store factory
interface MockState {
  gameState: {
    aiMessages: ChatMessage[];
    phase: string;
    roundInfo: { dayCount: number };
    currentScriptId: string;
    seats: { isDead: boolean }[];
  } | null;
  aiProvider: AiProvider;
  isAiThinking: boolean;
}

const createMockStore = () => {
  const state: MockState = {
    gameState: {
      aiMessages: [] as ChatMessage[],
      phase: 'DAY',
      roundInfo: { dayCount: 1 },
      currentScriptId: 'tb',
      seats: [{ isDead: false }, { isDead: false }, { isDead: true }]
    },
    aiProvider: 'sf_deepseek_v3_2',
    isAiThinking: false
  };

  type SetFn = (fnOrObj: ((state: MockState) => void) | Partial<MockState>) => void;
  type GetFn = () => MockState;

  const set: SetFn = vi.fn((fnOrObj) => {
    if (typeof fnOrObj === 'function') {
      fnOrObj(state);
    } else {
      Object.assign(state, fnOrObj);
    }
  });

  const get: GetFn = vi.fn(() => state);

  return { state, set: set as unknown as Parameters<typeof createAISlice>[0], get: get as unknown as Parameters<typeof createAISlice>[1] };
};

describe('createAISlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let slice: AISlice;

  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({ data: { reply: 'AI response' }, error: null });
    mockStore = createMockStore();
    slice = createAISlice(mockStore.set, mockStore.get, {} as never);
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(slice.isAiThinking).toBe(false);
      expect(slice.aiProvider).toBe('sf_deepseek_v3_2');
    });
  });

  describe('setAiProvider', () => {
    it('should set AI provider', () => {
      slice.setAiProvider('gemini');
      expect(mockStore.set).toHaveBeenCalledWith({ aiProvider: 'gemini' });
    });

    it('should set different providers', () => {
      const providers: AiProvider[] = ['deepseek', 'kimi', 'glm', 'sf_deepseek_v3_2'];
      providers.forEach(provider => {
        slice.setAiProvider(provider);
        expect(mockStore.set).toHaveBeenCalledWith({ aiProvider: provider });
      });
    });

    it('should accept hw_deepseek_v3 provider', () => {
      slice.setAiProvider('hw_deepseek_v3');
      expect(mockStore.set).toHaveBeenCalledWith({ aiProvider: 'hw_deepseek_v3' });
    });
  });

  describe('clearAiMessages', () => {
    it('should clear AI messages when gameState exists', () => {
      mockStore.state.gameState!.aiMessages = [
        { id: '1', content: 'msg1' } as ChatMessage,
        { id: '2', content: 'msg2' } as ChatMessage
      ];

      slice.clearAiMessages();

      expect(mockStore.state.gameState?.aiMessages).toEqual([]);
    });

    it('should handle null gameState gracefully', () => {
      mockStore.state.gameState = null;

      expect(() => slice.clearAiMessages()).not.toThrow();
    });
  });

  describe('deleteAiMessage', () => {
    it('should delete specific message by id', () => {
      mockStore.state.gameState!.aiMessages = [
        { id: '1', content: 'msg1' } as ChatMessage,
        { id: '2', content: 'msg2' } as ChatMessage,
        { id: '3', content: 'msg3' } as ChatMessage
      ];

      slice.deleteAiMessage('2');

      expect(mockStore.state.gameState?.aiMessages).toHaveLength(2);
      expect(mockStore.state.gameState?.aiMessages?.map(m => m.id)).toEqual(['1', '3']);
    });

    it('should not crash if message not found', () => {
      mockStore.state.gameState!.aiMessages = [{ id: '1', content: 'msg1' } as ChatMessage];

      expect(() => slice.deleteAiMessage('nonexistent')).not.toThrow();
      expect(mockStore.state.gameState?.aiMessages).toHaveLength(1);
    });

    it('should handle null gameState gracefully', () => {
      mockStore.state.gameState = null;

      expect(() => slice.deleteAiMessage('1')).not.toThrow();
    });
  });

  describe('askAi', () => {
    it('should return early if no gameState', async () => {
      mockStore.state.gameState = null;

      await slice.askAi('test prompt');

      // Should not have set isAiThinking
      expect(mockStore.set).not.toHaveBeenCalledWith({ isAiThinking: true });
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should set isAiThinking to true when starting', async () => {
      await slice.askAi('test prompt');

      expect(mockStore.set).toHaveBeenCalledWith({ isAiThinking: true });
    });

    it('should add user message before API call', async () => {
      await slice.askAi('Hello AI');

      // Check that a user message was added
      const messages = mockStore.state.gameState?.aiMessages;
      expect(messages?.length).toBeGreaterThanOrEqual(1);
      const userMsg = messages?.find(m => m.role === 'user');
      expect(userMsg?.content).toBe('Hello AI');
      expect(userMsg?.senderName).toBe('Storyteller');
      expect(userMsg?.senderId).toBe('user');
      expect(userMsg?.type).toBe('chat');
    });

    it('should call Supabase Edge Function with correct parameters', async () => {
      mockStore.state.aiProvider = 'deepseek';

      await slice.askAi('test prompt');

      expect(mockInvoke).toHaveBeenCalledWith('ask-ai', {
        body: {
          prompt: 'test prompt',
          gameContext: expect.objectContaining({
            phase: 'DAY',
            dayCount: 1,
            scriptId: 'tb',
            seatCount: 3,
            alivePlayers: 2
          }),
          aiProvider: 'deepseek'
        }
      });
    });

    it('should include previous messages in game context', async () => {
      mockStore.state.gameState!.aiMessages = [
        { id: '1', content: 'previous question', role: 'user' } as ChatMessage,
        { id: '2', content: 'previous answer', role: 'assistant' } as ChatMessage
      ];

      await slice.askAi('new question');

      expect(mockInvoke).toHaveBeenCalledWith('ask-ai', {
        body: expect.objectContaining({
          gameContext: expect.objectContaining({
            previousMessages: expect.arrayContaining([
              { role: 'user', content: 'previous question' },
              { role: 'assistant', content: 'previous answer' }
            ])
          })
        })
      });
    });

    it('should add AI response message on success', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { reply: 'AI response text' }, error: null });

      await slice.askAi('Hello');

      const messages = mockStore.state.gameState?.aiMessages;
      const aiMsg = messages?.find(m => m.role === 'assistant');
      expect(aiMsg?.content).toBe('AI response text');
      expect(aiMsg?.senderName).toContain('Grimoire AI');
      expect(aiMsg?.senderId).toBe('ai');
    });

    it('should use default message when reply is null', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { reply: null }, error: null });

      await slice.askAi('test');

      const messages = mockStore.state.gameState?.aiMessages;
      const aiMsg = messages?.find(m => m.role === 'assistant');
      expect(aiMsg?.content).toBe('（无回复）');
    });

    it('should set isAiThinking to false after successful completion', async () => {
      await slice.askAi('test');

      expect(mockStore.state.isAiThinking).toBe(false);
    });

    it('should handle Edge Function error gracefully', async () => {
      mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'Edge Function Error' } });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await slice.askAi('test');

      const messages = mockStore.state.gameState?.aiMessages;
      const errorMsg = messages?.find(m => m.type === 'system');
      expect(errorMsg?.content).toContain('AI 请求失败');
      expect(errorMsg?.content).toContain('Edge Function Error');
      expect(errorMsg?.senderName).toBe('System');
      expect(errorMsg?.senderId).toBe('system');
      expect(errorMsg?.role).toBe('system');
      expect(mockStore.state.isAiThinking).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should handle data.error response', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { error: 'API limit reached' }, error: null });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await slice.askAi('test');

      const messages = mockStore.state.gameState?.aiMessages;
      const errorMsg = messages?.find(m => m.type === 'system');
      expect(errorMsg?.content).toContain('API limit reached');

      consoleSpy.mockRestore();
    });

    it('should handle network/unexpected errors', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Network Error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await slice.askAi('test');

      const messages = mockStore.state.gameState?.aiMessages;
      const errorMsg = messages?.find(m => m.type === 'system');
      expect(errorMsg?.content).toContain('AI 请求失败');
      expect(errorMsg?.content).toContain('Network Error');
      expect(mockStore.state.isAiThinking).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should handle non-Error exceptions gracefully', async () => {
      mockInvoke.mockRejectedValueOnce('string error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await slice.askAi('test');

      const messages = mockStore.state.gameState?.aiMessages;
      const errorMsg = messages?.find(m => m.type === 'system');
      expect(errorMsg?.content).toContain('AI 请求失败');
      expect(errorMsg?.content).toContain('string error');

      consoleSpy.mockRestore();
    });

    it('should handle messages without role property (default to user)', async () => {
      mockStore.state.gameState!.aiMessages = [
        { id: '1', content: 'message without role' } as ChatMessage // No role property
      ];

      await slice.askAi('test');

      expect(mockInvoke).toHaveBeenCalledWith('ask-ai', {
        body: expect.objectContaining({
          gameContext: expect.objectContaining({
            previousMessages: expect.arrayContaining([
              { role: 'user', content: 'message without role' }
            ])
          })
        })
      });
    });

    it('should handle gameState becoming null during error handling', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('API Error'));

      // Override set to simulate gameState becoming null in the error handler
      let callCount = 0;
      const originalSet = mockStore.set;
      mockStore.set = vi.fn((fnOrObj) => {
        callCount++;
        if (typeof fnOrObj === 'function') {
          // After a few calls, simulate gameState becoming null
          if (callCount > 3) {
            mockStore.state.gameState = null;
          }
          fnOrObj(mockStore.state);
        } else {
          Object.assign(mockStore.state, fnOrObj);
        }
      }) as typeof originalSet;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(slice.askAi('test')).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should include provider name in AI response senderName', async () => {
      mockStore.state.aiProvider = 'gemini';
      mockInvoke.mockResolvedValueOnce({ data: { reply: 'response' }, error: null });

      await slice.askAi('test');

      const messages = mockStore.state.gameState?.aiMessages;
      const aiMsg = messages?.find(m => m.role === 'assistant');
      expect(aiMsg?.senderName).toContain('Google Gemini');
    });

    it('should limit previous messages to last 10', async () => {
      // Add more than 10 messages
      mockStore.state.gameState!.aiMessages = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        content: `message ${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant'
      } as ChatMessage));

      await slice.askAi('test');

      expect(mockInvoke).toHaveBeenCalledWith('ask-ai', {
        body: expect.objectContaining({
          gameContext: expect.objectContaining({
            previousMessages: expect.any(Array)
          })
        })
      });

      // Verify only last 10 messages are included
      const call = mockInvoke.mock.calls[0]!;
      const previousMessages = call[1].body.gameContext.previousMessages;
      expect(previousMessages.length).toBeLessThanOrEqual(10);
    });
  });
});
