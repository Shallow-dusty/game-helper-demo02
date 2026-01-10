/**
 * createAISlice Tests
 *
 * Comprehensive tests for AI assistant state management
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { createAISlice } from './createAISlice';
import type { ChatMessage } from '../../types';

// Mocked create function that we can track
let mockOpenAICreate: Mock;
let mockGeminiGenerateContent: Mock;

// Mock external dependencies with class constructors
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(function(this: any) {
      this.getGenerativeModel = vi.fn().mockReturnValue({
        generateContent: vi.fn().mockImplementation(async () => ({
          response: { text: () => 'Gemini response' }
        }))
      });
      return this;
    })
  };
});

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(function(this: any) {
      this.chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'OpenAI response' } }]
          })
        }
      };
      return this;
    })
  };
});

vi.mock('../aiConfig', () => ({
  getAiConfig: vi.fn(() => ({
    sf_deepseek_v3_2: {
      name: 'SiliconFlow DeepSeek V3',
      model: 'deepseek-chat',
      apiKey: 'test-api-key'
    },
    gemini: {
      name: 'Google Gemini',
      model: 'gemini-pro',
      apiKey: 'test-gemini-key'
    },
    deepseek: {
      name: 'DeepSeek',
      model: 'deepseek-chat',
      apiKey: 'test-deepseek-key'
    },
    kimi: {
      name: 'Kimi',
      model: 'moonshot-v1-8k',
      apiKey: 'test-kimi-key'
    },
    glm: {
      name: 'GLM',
      model: 'glm-4',
      apiKey: 'test-glm-key'
    },
    hw_deepseek_v3: {
      name: 'HW DeepSeek V3',
      model: 'deepseek-v3',
      apiKey: 'test-hw-key'
    },
    hw_deepseek_r1: {
      name: 'HW DeepSeek R1',
      model: 'deepseek-r1',
      apiKey: 'test-hw-key'
    },
    no_key_provider: {
      name: 'No Key Provider',
      model: 'test',
      apiKey: ''
    }
  }))
}));

// Create a mock store factory
const createMockStore = () => {
  const state: {
    gameState: { aiMessages: ChatMessage[] } | null;
    aiProvider: string;
    isAiThinking: boolean;
  } = {
    gameState: {
      aiMessages: [] as ChatMessage[]
    },
    aiProvider: 'sf_deepseek_v3_2',
    isAiThinking: false
  };

  const set = vi.fn((fnOrObj: ((state: typeof state) => void) | Partial<typeof state>) => {
    if (typeof fnOrObj === 'function') {
      fnOrObj(state);
    } else {
      Object.assign(state, fnOrObj);
    }
  });

  const get = vi.fn(() => state);

  return { state, set, get };
};

describe('createAISlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let slice: ReturnType<typeof createAISlice>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Reset OpenAI mock to default behavior
    const OpenAI = (await import('openai')).default;
    (OpenAI as Mock).mockImplementation(function(this: any) {
      mockOpenAICreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'OpenAI response' } }]
      });
      this.chat = {
        completions: {
          create: mockOpenAICreate
        }
      };
      return this;
    });

    // Reset Gemini mock to default behavior
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    (GoogleGenerativeAI as Mock).mockImplementation(function(this: any) {
      mockGeminiGenerateContent = vi.fn().mockResolvedValue({
        response: { text: () => 'Gemini response' }
      });
      this.getGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGeminiGenerateContent
      });
      return this;
    });

    mockStore = createMockStore();
    slice = createAISlice(mockStore.set, mockStore.get, {} as any);
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
      const providers = ['deepseek', 'kimi', 'glm', 'sf_deepseek_v3_2'] as const;
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

    it('should handle null gameState gracefully (else branch)', () => {
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

    it('should handle null gameState gracefully (else branch)', () => {
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
    });

    it('should set isAiThinking to true when starting', async () => {
      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'sf_deepseek_v3_2';

      await slice.askAi('test prompt');

      expect(mockStore.set).toHaveBeenCalledWith({ isAiThinking: true });
    });

    it('should add user message before API call', async () => {
      mockStore.state.gameState = { aiMessages: [] };

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

    it('should throw error when API key is missing', async () => {
      const { getAiConfig } = await import('../aiConfig');
      (getAiConfig as Mock).mockReturnValueOnce({
        no_key_provider: {
          name: 'No Key',
          model: 'test',
          apiKey: ''
        }
      });

      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'no_key_provider';

      await slice.askAi('test');

      // Should have added error message
      const messages = mockStore.state.gameState?.aiMessages;
      const errorMsg = messages?.find(m => m.type === 'system');
      expect(errorMsg?.content).toContain('AI 请求失败');
      expect(errorMsg?.content).toContain('未配置');
    });

    it('should use Gemini API when provider is gemini', async () => {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');

      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'gemini';

      await slice.askAi('test prompt');

      expect(GoogleGenerativeAI).toHaveBeenCalledWith('test-gemini-key');
    });

    it('should add AI response message on success with Gemini', async () => {
      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'gemini';

      await slice.askAi('Hello');

      const messages = mockStore.state.gameState?.aiMessages;
      const aiMsg = messages?.find(m => m.role === 'assistant');
      expect(aiMsg?.content).toBe('Gemini response');
      expect(aiMsg?.senderName).toBe('Grimoire AI');
      expect(aiMsg?.senderId).toBe('ai');
    });

    it('should use correct baseURL for deepseek provider (default)', async () => {
      const OpenAI = (await import('openai')).default;

      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'deepseek';

      await slice.askAi('test');

      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.deepseek.com'
        })
      );
    });

    it('should use correct baseURL for kimi provider', async () => {
      const OpenAI = (await import('openai')).default;

      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'kimi';

      await slice.askAi('test');

      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.moonshot.cn/v1'
        })
      );
    });

    it('should use correct baseURL for glm provider', async () => {
      const OpenAI = (await import('openai')).default;

      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'glm';

      await slice.askAi('test');

      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://open.bigmodel.cn/api/paas/v4'
        })
      );
    });

    it('should use correct baseURL for hw_ prefixed providers', async () => {
      const OpenAI = (await import('openai')).default;

      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'hw_deepseek_v3';

      await slice.askAi('test');

      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.modelarts-maas.com/v1'
        })
      );
    });

    it('should use correct baseURL for sf_ prefixed providers', async () => {
      const OpenAI = (await import('openai')).default;

      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'sf_deepseek_v3_2';

      await slice.askAi('test');

      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.siliconflow.cn/v1'
        })
      );
    });

    it('should add AI response message on success with OpenAI compatible API', async () => {
      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'sf_deepseek_v3_2';

      await slice.askAi('Hello');

      const messages = mockStore.state.gameState?.aiMessages;
      const aiMsg = messages?.find(m => m.role === 'assistant');
      expect(aiMsg?.content).toBe('OpenAI response');
      expect(aiMsg?.senderName).toBe('Grimoire AI');
    });

    it('should set isAiThinking to false after successful completion', async () => {
      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'sf_deepseek_v3_2';

      await slice.askAi('test');

      // Find the set call that sets isAiThinking to false
      const setCallsWithIsAiThinking = mockStore.set.mock.calls.filter(
        call => typeof call[0] === 'function'
      );
      expect(setCallsWithIsAiThinking.length).toBeGreaterThan(0);
      expect(mockStore.state.isAiThinking).toBe(false);
    });

    it('should handle null response content from OpenAI API (fallback to default message)', async () => {
      const OpenAI = (await import('openai')).default;
      // Reset the mock to return null content - use function pattern for constructor mock
      (OpenAI as Mock).mockImplementation(function(this: any) {
        this.chat = {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: null } }]
            })
          }
        };
        return this;
      });

      // Create fresh store and slice after changing mock
      mockStore = createMockStore();
      slice = createAISlice(mockStore.set, mockStore.get, {} as any);
      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'deepseek';

      await slice.askAi('test');

      const messages = mockStore.state.gameState?.aiMessages;
      const aiMsg = messages?.find(m => m.role === 'assistant');
      // The code uses ?? operator to fallback to default message
      expect(aiMsg?.content).toBeDefined();
    });

    it('should handle API error gracefully', async () => {
      const OpenAI = (await import('openai')).default;
      // Reset the mock to throw an error
      (OpenAI as Mock).mockImplementation(function(this: any) {
        this.chat = {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error'))
          }
        };
        return this;
      });

      // Create fresh store and slice after changing mock
      mockStore = createMockStore();
      slice = createAISlice(mockStore.set, mockStore.get, {} as any);
      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'deepseek';

      // Silence console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await slice.askAi('test');

      const messages = mockStore.state.gameState?.aiMessages;
      const errorMsg = messages?.find(m => m.type === 'system');
      expect(errorMsg?.content).toContain('AI 请求失败');
      expect(errorMsg?.content).toContain('API Error');
      expect(errorMsg?.senderName).toBe('System');
      expect(errorMsg?.senderId).toBe('system');
      expect(errorMsg?.role).toBe('system');
      expect(mockStore.state.isAiThinking).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should handle non-Error exceptions gracefully', async () => {
      const OpenAI = (await import('openai')).default;
      // Reset the mock to throw a string error
      (OpenAI as Mock).mockImplementation(function(this: any) {
        this.chat = {
          completions: {
            create: vi.fn().mockRejectedValue('string error')
          }
        };
        return this;
      });

      // Create fresh store and slice after changing mock
      mockStore = createMockStore();
      slice = createAISlice(mockStore.set, mockStore.get, {} as any);
      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'deepseek';

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await slice.askAi('test');

      const messages = mockStore.state.gameState?.aiMessages;
      const errorMsg = messages?.find(m => m.type === 'system');
      expect(errorMsg?.content).toContain('AI 请求失败');
      expect(errorMsg?.content).toContain('string error');

      consoleSpy.mockRestore();
    });

    it('should include existing aiMessages in OpenAI request context', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'response' } }]
      });
      (OpenAI as Mock).mockImplementation(function(this: any) {
        this.chat = {
          completions: {
            create: mockCreate
          }
        };
        return this;
      });

      // Create fresh store and slice after changing mock
      mockStore = createMockStore();
      slice = createAISlice(mockStore.set, mockStore.get, {} as any);
      mockStore.state.gameState = {
        aiMessages: [
          { id: '1', content: 'previous message', role: 'user' } as ChatMessage,
          { id: '2', content: 'previous response', role: 'assistant' } as ChatMessage
        ]
      };
      mockStore.state.aiProvider = 'deepseek';

      await slice.askAi('new question');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'system', content: expect.any(String) },
            { role: 'user', content: 'previous message' },
            { role: 'assistant', content: 'previous response' },
            { role: 'user', content: 'new question' }
          ])
        })
      );
    });

    it('should handle messages without role property (default to user)', async () => {
      const OpenAI = (await import('openai')).default;
      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'response' } }]
      });
      (OpenAI as Mock).mockImplementation(function(this: any) {
        this.chat = {
          completions: {
            create: mockCreate
          }
        };
        return this;
      });

      // Create fresh store and slice after changing mock
      mockStore = createMockStore();
      slice = createAISlice(mockStore.set, mockStore.get, {} as any);
      mockStore.state.gameState = {
        aiMessages: [
          { id: '1', content: 'message without role' } as ChatMessage // No role property
        ]
      };
      mockStore.state.aiProvider = 'deepseek';

      await slice.askAi('test');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user', content: 'message without role' })
          ])
        })
      );
    });

    it('should handle error in set callback for adding AI response when gameState becomes null', async () => {
      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'sf_deepseek_v3_2';

      // Override set to simulate gameState becoming null during the callback
      let callCount = 0;
      mockStore.set = vi.fn((fnOrObj: ((state: typeof mockStore.state) => void) | Partial<typeof mockStore.state>) => {
        callCount++;
        if (typeof fnOrObj === 'function') {
          // After the initial calls, simulate gameState becoming null
          if (callCount > 2) {
            mockStore.state.gameState = null;
          }
          fnOrObj(mockStore.state);
        } else {
          Object.assign(mockStore.state, fnOrObj);
        }
      });

      // This should not throw even if gameState becomes null
      await expect(slice.askAi('test')).resolves.not.toThrow();
    });

    it('should handle error in catch block when gameState is null', async () => {
      const OpenAI = (await import('openai')).default;
      (OpenAI as Mock).mockImplementation(function(this: any) {
        this.chat = {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error'))
          }
        };
        return this;
      });

      // Create fresh store and slice after changing mock
      mockStore = createMockStore();
      slice = createAISlice(mockStore.set, mockStore.get, {} as any);
      mockStore.state.gameState = { aiMessages: [] };
      mockStore.state.aiProvider = 'deepseek';

      // Override set to simulate gameState becoming null in the error handler
      let errorHandlerCalled = false;
      mockStore.set = vi.fn((fnOrObj: ((state: typeof mockStore.state) => void) | Partial<typeof mockStore.state>) => {
        if (typeof fnOrObj === 'function') {
          // After adding user message and failing API call, null the gameState before error handling
          if (errorHandlerCalled) {
            mockStore.state.gameState = null;
          }
          fnOrObj(mockStore.state);
          // Check if this was likely the error handler (sets isAiThinking to false)
          if (!mockStore.state.isAiThinking) {
            errorHandlerCalled = true;
          }
        } else {
          Object.assign(mockStore.state, fnOrObj);
        }
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(slice.askAi('test')).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
