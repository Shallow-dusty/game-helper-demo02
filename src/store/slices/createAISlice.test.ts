import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAISlice } from './createAISlice';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { AppState } from '../types';

describe('createAISlice', () => {
  let store: any;

  beforeEach(() => {
    store = createStore<AppState>()(
      immer((set, get) => ({
        ...createAISlice(set, get, {} as any),
        gameState: { aiMessages: [] }, // Mock gameState
        sync: vi.fn(),
      } as unknown as AppState))
    );
  });

  it('should initialize with default state', () => {
    const state = store.getState();
    expect(state.isAiThinking).toBe(false);
    expect(state.aiProvider).toBe('deepseek');
  });

  it('should clear messages', () => {
    // Setup initial messages
    store.setState((state: any) => {
        state.gameState.aiMessages = [{ role: 'user', content: 'hi' }];
    });
    
    store.getState().clearAiMessages();
    
    expect(store.getState().gameState.aiMessages).toEqual([]);
  });

  it('should delete specific message', () => {
      store.setState((state: any) => {
          state.gameState.aiMessages = [
              { id: '1', content: 'msg1' },
              { id: '2', content: 'msg2' }
          ];
      });

      store.getState().deleteAiMessage('1');

      const messages = store.getState().gameState.aiMessages;
      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe('2');
  });
});
