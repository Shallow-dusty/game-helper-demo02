import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';

vi.mock('@supabase/supabase-js', () => {
  const createQueryBuilder = (table: string) => {
    const builder: Record<string, any> = {};

    builder.select = vi.fn(() => builder);
    builder.insert = vi.fn(() => ({ error: null, data: null }));
    builder.upsert = vi.fn(() => ({ error: null, data: null }));
    builder.update = vi.fn(() => builder);
    builder.delete = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.order = vi.fn(() => builder);
    builder.limit = vi.fn(() => ({ data: [], error: null }));
    builder.single = vi.fn(() => {
      if (table === 'game_rooms') {
        return {
          data: {
            id: 1,
            data: {
              roomId: 'test',
              seats: [],
              messages: [],
              dailyNominations: [],
              dailyExecutionCompleted: false,
              voteHistory: [],
              voting: null,
              phase: 'DAY',
              roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 1 },
              gameOver: null
            }
          },
          error: null
        };
      }
      if (table === 'room_members') {
        return { data: { seen_role_id: null }, error: null };
      }
      if (table === 'game_secrets') {
        return { data: { data: null }, error: null };
      }
      return { data: null, error: null };
    });

    return builder;
  };

  return {
    createClient: vi.fn(() => {
      return {
        auth: {
          getSession: vi.fn(async () => ({ data: { session: { user: { id: 'auth-user' } } } })),
          signInAnonymously: vi.fn(async () => ({ data: { user: { id: 'auth-user' } }, error: null }))
        },
        from: vi.fn((table: string) => createQueryBuilder(table)),
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



  it('should login user', async () => {
    await store.getState().login('Test User', true);
    const state = store.getState();
    expect(state.user.name).toBe('Test User');
    expect(state.user.isStoryteller).toBe(true);
  });

  it('should join game', async () => {
    await store.getState().login('Player', false);
    await store.getState().joinGame('ABCD');
    
    const state = store.getState();
    expect(state.connectionStatus).toBe('connected');
    expect(state.user.roomId).toBe('ABCD');
  });

  it('should leave game', async () => {
    await store.getState().login('Player', false);
    store.setState({ gameState: { roomId: 'ABCD', seats: [], messages: [] } }); // Manually set state
    
    await store.getState().leaveGame();
    
    const state = store.getState();
    expect(state.gameState).toBeNull();
    expect(state.connectionStatus).toBe('disconnected');
  });
});
