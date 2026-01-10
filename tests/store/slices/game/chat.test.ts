/**
 * Game Chat Slice Tests
 *
 * 聊天功能状态测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameChatSlice } from '../../../../src/store/slices/game/chat';
import type { GameState, Message } from '../../../../src/types';

// Mock store state
const createMockStore = () => {
  const state: {
    gameState: Partial<GameState> | null;
    user: { id: string; name: string; isStoryteller: boolean } | null;
    sync: () => void;
  } = {
    gameState: {
      messages: [] as Message[],
      allowWhispers: false
    } as Partial<GameState>,
    user: { id: 'user1', name: 'Player1', isStoryteller: false },
    sync: vi.fn()
  };

  const set = vi.fn((fn: (state: typeof state) => void) => {
    fn(state);
  });

  const get = vi.fn(() => state);

  return { state, set, get };
};

describe('createGameChatSlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let chatSlice: ReturnType<typeof createGameChatSlice>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    chatSlice = createGameChatSlice(mockStore.set, mockStore.get, {});
  });

  describe('sendMessage', () => {
    it('should send a public message', () => {
      chatSlice.sendMessage('Hello everyone!');

      expect(mockStore.get().sync).toHaveBeenCalled();
      expect(mockStore.state.gameState?.messages?.length).toBe(1);

      const msg = mockStore.state.gameState?.messages?.[0];
      expect(msg?.content).toBe('Hello everyone!');
      expect(msg?.senderId).toBe('user1');
      expect(msg?.senderName).toBe('Player1');
      expect(msg?.isPrivate).toBe(false);
      expect(msg?.type).toBe('chat');
    });

    it('should block private messages when whispers are disabled', () => {
      mockStore.state.gameState!.allowWhispers = false;
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

      chatSlice.sendMessage('Test');

      expect(mockStore.state.gameState?.messages?.length).toBe(0);
    });

    it('should not send message if no gameState', () => {
      mockStore.state.gameState = null;

      chatSlice.sendMessage('Test');

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
        content: 'Original message',
        timestamp: Date.now(),
        type: 'chat',
        isPrivate: false
      }];

      chatSlice.forwardMessage('msg1', 'user3');

      expect(mockStore.state.gameState?.messages?.length).toBe(2);
      const forwardedMsg = mockStore.state.gameState?.messages?.[1];
      expect(forwardedMsg?.content).toContain('[转发]');
      expect(forwardedMsg?.content).toContain('Player2');
      expect(forwardedMsg?.content).toContain('Original message');
      expect(forwardedMsg?.recipientId).toBe('user3');
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
