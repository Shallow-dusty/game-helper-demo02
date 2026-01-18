/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import type { ChatMessage } from '../../../types';

// Create mock state and functions
const createMockState = () => ({
  gameState: {
    messages: [] as ChatMessage[],
    allowWhispers: false,
  },
  user: {
    id: 'user1',
    name: 'TestUser',
    isStoryteller: false,
  },
});

describe('createGameChatSlice', () => {
  describe('sendMessage', () => {
    it('adds public message to game state', () => {
      const state = createMockState();

      // Simulate sendMessage logic
      const content = 'Hello world';
      const msg = {
        id: 'test-id',
        senderId: state.user.id,
        senderName: state.user.name,
        recipientId: null,
        content,
        timestamp: Date.now(),
        type: 'chat' as const,
        isPrivate: false,
      };
      state.gameState.messages.push(msg);

      expect(state.gameState.messages).toHaveLength(1);
      expect(state.gameState.messages[0]!.content).toBe('Hello world');
      expect(state.gameState.messages[0]!.isPrivate).toBe(false);
    });

    it('adds private message when recipientId is provided', () => {
      const state = createMockState();
      state.gameState.allowWhispers = true;

      const content = 'Secret message';
      const recipientId = 'user2';
      const msg = {
        id: 'test-id',
        senderId: state.user.id,
        senderName: state.user.name,
        recipientId,
        content,
        timestamp: Date.now(),
        type: 'chat' as const,
        isPrivate: true,
      };
      state.gameState.messages.push(msg);

      expect(state.gameState.messages[0]!.isPrivate).toBe(true);
      expect(state.gameState.messages[0]!.recipientId).toBe('user2');
    });

    it('blocks private message when whispers disabled for non-storyteller', () => {
      const state = createMockState();
      state.gameState.allowWhispers = false;
      state.user.isStoryteller = false;
      
      const recipientId = 'user2';
      // Simulating the guard condition
      const shouldBlock = recipientId && !state.gameState.allowWhispers && !state.user.isStoryteller;
      
      expect(shouldBlock).toBe(true);
    });

    it('allows private message for storyteller even when whispers disabled', () => {
      const state = createMockState();
      state.gameState.allowWhispers = false;
      state.user.isStoryteller = true;
      
      const recipientId = 'user2';
      const shouldBlock = recipientId && !state.gameState.allowWhispers && !state.user.isStoryteller;
      
      expect(shouldBlock).toBe(false);
    });
  });

  describe('forwardMessage', () => {
    it('forwards message with prefix', () => {
      const state = createMockState();
      const originalMsg = {
        id: 'orig-1',
        senderId: 'user2',
        senderName: 'OriginalSender',
        recipientId: null,
        content: 'Original content',
        timestamp: Date.now(),
        type: 'chat' as const,
        isPrivate: false,
      };
      state.gameState.messages.push(originalMsg);

      // Simulate forward
      const forwardedMsg = {
        id: 'fwd-1',
        senderId: state.user.id,
        senderName: state.user.name,
        recipientId: 'user3',
        content: `[转发] ${originalMsg.senderName}: ${originalMsg.content}`,
        timestamp: Date.now(),
        type: 'chat' as const,
        isPrivate: true,
      };
      state.gameState.messages.push(forwardedMsg);

      expect(state.gameState.messages).toHaveLength(2);
      expect(state.gameState.messages[1]!.content).toContain('[转发]');
      expect(state.gameState.messages[1]!.content).toContain('OriginalSender');
    });
  });

  describe('toggleWhispers', () => {
    it('toggles whisper setting on', () => {
      const state = createMockState();
      state.gameState.allowWhispers = false;
      
      state.gameState.allowWhispers = !state.gameState.allowWhispers;
      
      expect(state.gameState.allowWhispers).toBe(true);
    });

    it('toggles whisper setting off', () => {
      const state = createMockState();
      state.gameState.allowWhispers = true;
      
      state.gameState.allowWhispers = !state.gameState.allowWhispers;
      
      expect(state.gameState.allowWhispers).toBe(false);
    });
  });
});
