import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';

vi.mock('@supabase/supabase-js', () => {
  const mockQueryBuilder = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({ data: { data: { roomId: 'test' } }, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ error: null })),
    })),
    upsert: vi.fn(() => ({ error: null })),
  };

  return {
    createClient: vi.fn(() => {
      return {
        from: vi.fn(() => mockQueryBuilder),
        channel: vi.fn(() => ({
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn((cb) => { cb?.('SUBSCRIBED'); return {}; }),
          unsubscribe: vi.fn(),
        })),
        removeChannel: vi.fn(),
      };
    }),
    REALTIME_SUBSCRIBE_STATES: {
      SUBSCRIBED: 'SUBSCRIBED',
      CLOSED: 'CLOSED',
      CHANNEL_ERROR: 'CHANNEL_ERROR',
      TIMED_OUT: 'TIMED_OUT'
    }
  };
});

import { createConnectionSlice } from './createConnectionSlice';

describe('createConnectionSlice', () => {
  let store: any;

  beforeEach(() => {
    vi.useFakeTimers();
    store = createStore(
      immer((set, get) => createConnectionSlice(set as any, get as any, {} as any))
    );
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });



  it('should login user', () => {
    store.getState().login('Test User', true);
    const state = store.getState();
    expect(state.user.name).toBe('Test User');
    expect(state.user.isStoryteller).toBe(true);
  });

  it('should join game', async () => {
    store.getState().login('Player', false);
    await store.getState().joinGame('ABCD');
    
    const state = store.getState();
    expect(state.connectionStatus).toBe('connected');
    expect(state.user.roomId).toBe('ABCD');
  });

  it('should leave game', async () => {
    store.getState().login('Player', false);
    store.setState({ gameState: { roomId: 'ABCD', seats: [], messages: [] } }); // Manually set state
    
    await store.getState().leaveGame();
    
    const state = store.getState();
    expect(state.gameState).toBeNull();
    expect(state.connectionStatus).toBe('disconnected');
  });
});
