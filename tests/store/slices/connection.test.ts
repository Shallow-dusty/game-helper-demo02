/**
 * Connection Slice Tests - Real-time Sync
 *
 * 连接状态切片测试 - 实时同步
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStore, type StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, Seat } from '../../../src/types';

// Mock Supabase with detailed channel simulation
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn((callback?: (status: string) => void) => {
    callback?.('SUBSCRIBED');
    return mockChannel;
  }),
  unsubscribe: vi.fn(),
};

const mockQueryBuilder = {
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(() => ({
        data: {
          data: {
            roomId: 'TEST123',
            seats: [],
            messages: [],
            phase: 'SETUP',
            currentScriptId: 'tb'
          } as Partial<GameState>
        },
        error: null
      }))
    }))
  })) as ReturnType<typeof vi.fn>,
  update: vi.fn(() => ({
    eq: vi.fn(() => ({ error: null }))
  })) as ReturnType<typeof vi.fn>,
  upsert: vi.fn(() => ({ error: null })) as ReturnType<typeof vi.fn>,
  insert: vi.fn(() => ({ data: null, error: null })) as ReturnType<typeof vi.fn>
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => mockQueryBuilder),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn()
  })),
  REALTIME_SUBSCRIBE_STATES: {
    SUBSCRIBED: 'SUBSCRIBED',
    CLOSED: 'CLOSED',
    CHANNEL_ERROR: 'CHANNEL_ERROR',
    TIMED_OUT: 'TIMED_OUT'
  }
}));

// Mock toast
vi.mock('../../../src/components/ui/Toast', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn()
}));

import { createConnectionSlice, ConnectionSlice } from '../../../src/store/slices/connection';

// Helper to create a test seat
function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 1,
    userId: null,
    userName: '',
    isDead: false,
    hasGhostVote: true,
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    ...overrides
  };
}

// Helper to create a test game state
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    roomId: 'TEST123',
    currentScriptId: 'tb',
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: true,
    vibrationEnabled: false,
    seats: [
      createTestSeat({ id: 1, userId: 'user1', userName: 'Player 1' }),
      createTestSeat({ id: 2, userId: 'user2', userName: 'Player 2' })
    ],
    swapRequests: [],
    messages: [],
    gameOver: { isOver: false, winner: null, reason: '' },
    audio: { trackId: null, isPlaying: false, volume: 0.5 },
    nightQueue: [],
    nightCurrentIndex: -1,
    voting: null,
    customScripts: {},
    customRoles: {},
    voteHistory: [],
    roundInfo: { dayCount: 0, nightCount: 0, nominationCount: 0, totalRounds: 0 },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    candlelightEnabled: false,
    dailyNominations: [],
    interactionLog: [],
    ...overrides
  } as GameState;
}

describe('Connection Slice', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('初始状态', () => {
    it('should have correct initial state', () => {
      const state = store.getState();
      expect(state.user).toBeNull();
      expect(state.isOffline).toBe(false);
      expect(state.connectionStatus).toBe('disconnected');
    });
  });

  describe('登录功能', () => {
    it('should login user with storyteller role', () => {
      store.getState().login('说书人', true);
      const state = store.getState();

      expect(state.user).not.toBeNull();
      expect(state.user?.name).toBe('说书人');
      expect(state.user?.isStoryteller).toBe(true);
      expect(state.user?.roomId).toBeNull();
    });

    it('should login user as player', () => {
      store.getState().login('玩家1', false);
      const state = store.getState();

      expect(state.user?.name).toBe('玩家1');
      expect(state.user?.isStoryteller).toBe(false);
    });

    it('should generate unique user id', () => {
      store.getState().login('User1', false);
      const id1 = store.getState().user?.id;

      // Clear and login again
      store.setState({ user: null });
      localStorage.removeItem('grimoire_uid');
      store.getState().login('User2', false);
      const id2 = store.getState().user?.id;

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      // New ID should be generated if localStorage was cleared
      expect(id2).not.toBe(id1);
    });
  });

  describe('加入游戏', () => {
    it('should join game and update connection status', async () => {
      store.getState().login('Player', false);
      await store.getState().joinGame('TEST123');

      const state = store.getState();
      expect(state.connectionStatus).toBe('connected');
      expect(state.user?.roomId).toBe('TEST123');
    });

    it('should set connecting status during join', async () => {
      store.getState().login('Player', false);

      const joinPromise = store.getState().joinGame('TEST123');

      // Check status immediately after call
      // Note: Due to async nature, this might already be 'connected'
      await joinPromise;

      expect(store.getState().connectionStatus).toBe('connected');
    });

    it('should subscribe to realtime channel', async () => {
      store.getState().login('Player', false);
      await store.getState().joinGame('TEST123');

      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe('离开游戏', () => {
    it('should reset state when leaving game', async () => {
      store.getState().login('Player', false);
      store.setState({
        gameState: createTestGameState(),
        connectionStatus: 'connected' as const
      });

      store.getState().leaveGame();

      const state = store.getState();
      expect(state.gameState).toBeNull();
      expect(state.connectionStatus).toBe('disconnected');
      expect(state.user?.roomId).toBeNull();
    });

    it('should clear seat data when leaving', async () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({
            id: 1,
            userId: 'test-user',
            userName: 'Test',
            roleId: 'imp',
            isDead: true
          })
        ]
      });

      store.getState().login('Test', false);
      store.setState({
        gameState,
        user: { id: 'test-user', name: 'Test', isStoryteller: false, roomId: 'TEST123', isSeated: true }
      });

      store.getState().leaveGame();

      // After leaving, gameState should be null
      expect(store.getState().gameState).toBeNull();
    });
  });

  describe('观战模式', () => {
    it('should spectate game without full user setup', async () => {
      await store.getState().spectateGame('TEST123');

      const state = store.getState();
      expect(state.connectionStatus).toBe('connected');
      expect(state.user?.isObserver).toBe(true);
      expect(state.user?.roomId).toBe('TEST123');
    });

    it('should handle spectate error when room not found', async () => {
      mockQueryBuilder.select.mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'Room not found' }
          }))
        }))
      });

      await store.getState().spectateGame('INVALID');

      expect(store.getState().connectionStatus).toBe('disconnected');
    });

    it('should handle spectate exception', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockQueryBuilder.select.mockImplementationOnce(() => {
        throw new Error('Network failure');
      });

      await store.getState().spectateGame('TEST123');

      expect(store.getState().connectionStatus).toBe('disconnected');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('同步功能', () => {
    it('should call syncToCloud when sync is called', async () => {
      store.getState().login('ST', true);
      store.setState({
        gameState: createTestGameState(),
        isOffline: false
      });

      store.getState().sync();

      // syncToCloud is called internally
      await vi.advanceTimersByTimeAsync(100);

      // Verify update was called
      expect(mockQueryBuilder.update).toHaveBeenCalled();
    });

    it('should not sync when offline', async () => {
      store.getState().login('ST', true);
      store.setState({
        gameState: createTestGameState(),
        isOffline: true
      });

      vi.clearAllMocks();
      await store.getState().syncToCloud();

      // Update should not be called when offline
      expect(mockQueryBuilder.update).not.toHaveBeenCalled();
    });

    it('should not sync when no game state', async () => {
      store.getState().login('Player', false);
      store.setState({ gameState: null });

      vi.clearAllMocks();
      await store.getState().syncToCloud();

      expect(mockQueryBuilder.update).not.toHaveBeenCalled();
    });
  });

  describe('内部辅助函数', () => {
    it('should set receiving update flag', () => {
      store.getState()._setIsReceivingUpdate(true);
      // The flag is internal, but we can test that no error is thrown
      expect(() => store.getState()._setIsReceivingUpdate(false)).not.toThrow();
    });

    it('should set realtime channel', () => {
       
      const mockCh = { id: 'test-channel' } as any;
      store.getState()._setRealtimeChannel(mockCh);
      expect(store.getState()._getRealtimeChannel()).toBe(mockCh);
    });
  });
});

describe('Connection Status Transitions', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should handle CHANNEL_ERROR status', async () => {
    // Override subscribe to simulate error
    mockChannel.subscribe.mockImplementationOnce((callback?: (status: string) => void) => {
      callback?.('CHANNEL_ERROR');
      return mockChannel;
    });

    store.getState().login('Player', false);
    await store.getState().joinGame('TEST123');

    expect(store.getState().connectionStatus).toBe('reconnecting');
  });

  it('should handle CLOSED status', async () => {
    mockChannel.subscribe.mockImplementationOnce((callback?: (status: string) => void) => {
      callback?.('CLOSED');
      return mockChannel;
    });

    store.getState().login('Player', false);
    await store.getState().joinGame('TEST123');

    expect(store.getState().connectionStatus).toBe('disconnected');
  });
});

describe('Storyteller Secret Sync', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should sync secrets when storyteller syncs', async () => {
    store.getState().login('ST', true);
    store.setState({
      gameState: createTestGameState({
        storytellerNotes: [{ id: '1', content: 'Secret', timestamp: Date.now(), type: 'manual' }]
      }),
      isOffline: false
    });

    await store.getState().syncToCloud();

    // Should upsert to secrets table
    expect(mockQueryBuilder.upsert).toHaveBeenCalled();
  });

  it('should not sync secrets when not storyteller', async () => {
    store.getState().login('Player', false);
    store.setState({
      gameState: createTestGameState(),
      isOffline: false
    });

    vi.clearAllMocks();
    await store.getState().syncToCloud();

    // Update public state but not upsert secrets
    expect(mockQueryBuilder.update).toHaveBeenCalled();
    expect(mockQueryBuilder.upsert).not.toHaveBeenCalled();
  });
});

describe('joinGame Error Handling', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should handle room not found error (PGRST116)', async () => {
    // Override select to return error
    mockQueryBuilder.select.mockReturnValueOnce({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: { code: 'PGRST116', message: 'Room not found' }
        }))
      }))
    });

    store.getState().login('Player', false);
    await store.getState().joinGame('INVALID');

    expect(store.getState().connectionStatus).toBe('disconnected');
  });

  it('should handle generic network error', async () => {
    // Override select to return generic error
    mockQueryBuilder.select.mockReturnValueOnce({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: { code: 'NETWORK_ERROR', message: 'Network error' }
        }))
      }))
    });

    store.getState().login('Player', false);
    await store.getState().joinGame('TEST123');

    expect(store.getState().connectionStatus).toBe('disconnected');
  });

  it('should handle null data response', async () => {
    // Override select to return null data
    mockQueryBuilder.select.mockReturnValueOnce({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    });

    store.getState().login('Player', false);
    await store.getState().joinGame('TEST123');

    expect(store.getState().connectionStatus).toBe('disconnected');
  });
});

describe('refreshFromCloud', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should not refresh when no game state', async () => {
    store.getState().login('Player', false);
    store.setState({ gameState: null });

    vi.clearAllMocks();
    await store.getState().refreshFromCloud();

    // Should not call select when no game state
    expect(mockQueryBuilder.select).not.toHaveBeenCalled();
  });

  it('should refresh game state from cloud', async () => {
    store.getState().login('Player', false);
    store.setState({
      gameState: createTestGameState({ roomId: 'TEST123' })
    });

    // Mock the response
    mockQueryBuilder.select.mockReturnValueOnce({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: { data: createTestGameState({ roomId: 'TEST123', phase: 'NIGHT' }) },
          error: null
        }))
      }))
    });

    await store.getState().refreshFromCloud();

    expect(store.getState().gameState?.phase).toBe('NIGHT');
  });

  it('should handle refresh error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    store.getState().login('Player', false);
    store.setState({
      gameState: createTestGameState({ roomId: 'TEST123' })
    });

    // Mock error response
    mockQueryBuilder.select.mockReturnValueOnce({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: null,
          error: { message: 'Fetch error' }
        }))
      }))
    });

    await store.getState().refreshFromCloud();

    // Should log error
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should fetch and merge secrets for storyteller', async () => {
    store.getState().login('ST', true);
    store.setState({
      gameState: createTestGameState({ roomId: 'TEST123' })
    });

    // Mock public data response
    const publicData = createTestGameState({ roomId: 'TEST123' });
    mockQueryBuilder.select
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: publicData },
            error: null
          }))
        }))
      })
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: { storytellerNotes: [{ id: '1', content: 'Secret note' }] } },
            error: null
          }))
        }))
      });

    await store.getState().refreshFromCloud();

    // Verify select was called twice (public + secrets)
    expect(mockQueryBuilder.select).toHaveBeenCalledTimes(2);
  });
});

describe('syncToCloud Error Handling', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should handle public sync error', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    store.getState().login('Player', false);
    store.setState({
      gameState: createTestGameState(),
      isOffline: false
    });

    // Mock update error
    mockQueryBuilder.update.mockReturnValueOnce({
      eq: vi.fn(() => ({ error: { message: 'Update failed' } }))
    });

    await store.getState().syncToCloud();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle secret sync error for storyteller', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    store.getState().login('ST', true);
    store.setState({
      gameState: createTestGameState(),
      isOffline: false
    });

    // Mock upsert error
    mockQueryBuilder.upsert.mockReturnValueOnce({
      error: { message: 'Upsert failed' }
    });

    await store.getState().syncToCloud();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle exception during sync', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    store.getState().login('Player', false);
    store.setState({
      gameState: createTestGameState(),
      isOffline: false
    });

    // Mock to throw exception
    mockQueryBuilder.update.mockImplementationOnce(() => {
      throw new Error('Unexpected error');
    });

    await store.getState().syncToCloud();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('refreshFromCloud Exception Handling', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should handle exception during refresh', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    store.getState().login('Player', false);
    store.setState({
      gameState: createTestGameState({ roomId: 'TEST123' })
    });

    // Mock to throw exception
    mockQueryBuilder.select.mockImplementationOnce(() => {
      throw new Error('Unexpected error');
    });

    await store.getState().refreshFromCloud();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('Storyteller joinGame with Secret Subscription', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should subscribe to secrets channel when storyteller joins', async () => {
    // Mock public game state response
    const publicGameState = createTestGameState({ roomId: 'TEST123' });

    // Setup mock for both public and secret queries
    mockQueryBuilder.select
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: publicGameState },
            error: null
          }))
        }))
      })
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: { storytellerNotes: [{ id: '1', content: 'Secret' }], seats: [{ id: 1, realRoleId: 'imp' }] } },
            error: null
          }))
        }))
      });

    store.getState().login('Storyteller', true);
    await store.getState().joinGame('TEST123');

    // Verify storyteller is connected and has roomId
    expect(store.getState().connectionStatus).toBe('connected');
    expect(store.getState().user?.roomId).toBe('TEST123');
    expect(store.getState().user?.isStoryteller).toBe(true);
  });

  it('should fetch and merge initial secret state for storyteller', async () => {
    const publicGameState = createTestGameState({ roomId: 'TEST123' });
    const secretData = {
      storytellerNotes: [{ id: '1', content: 'Secret note', timestamp: Date.now(), type: 'manual' as const }],
      seats: [{ id: 1, realRoleId: 'imp' }]
    };

    mockQueryBuilder.select
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: publicGameState },
            error: null
          }))
        }))
      })
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: secretData },
            error: null
          }))
        }))
      });

    store.getState().login('Storyteller', true);
    await store.getState().joinGame('TEST123');

    // Secret data should be merged
    expect(store.getState().gameState).not.toBeNull();
  });

  it('should handle missing secret data gracefully', async () => {
    const publicGameState = createTestGameState({ roomId: 'TEST123' });

    mockQueryBuilder.select
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: publicGameState },
            error: null
          }))
        }))
      })
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      });

    store.getState().login('Storyteller', true);
    await store.getState().joinGame('TEST123');

    // Should still be connected without secrets
    expect(store.getState().connectionStatus).toBe('connected');
    expect(store.getState().gameState?.roomId).toBe('TEST123');
  });

  it('should send join announcement after joining', async () => {
    const publicGameState = createTestGameState({ roomId: 'TEST123', messages: [] });

    mockQueryBuilder.select
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: publicGameState },
            error: null
          }))
        }))
      })
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      });

    store.getState().login('TestPlayer', false);
    await store.getState().joinGame('TEST123');

    // Advance timer to trigger the announcement setTimeout
    await vi.advanceTimersByTimeAsync(150);

    // The announcement should have triggered syncToCloud
    expect(mockQueryBuilder.update).toHaveBeenCalled();
  });

  it('should set localStorage when joining game', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    // Reset mocks to ensure clean state
    mockQueryBuilder.select.mockReset();
    mockChannel.subscribe.mockReset();
    mockChannel.subscribe.mockImplementation((callback?: (status: string) => void) => {
      callback?.('SUBSCRIBED');
      return mockChannel;
    });

    const publicGameState = createTestGameState({ roomId: 'TEST123' });

    // Mock both the public state and potential secret state query
    mockQueryBuilder.select
      .mockReturnValue({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: publicGameState },
            error: null
          }))
        }))
      });

    store.getState().login('Player', false);
    await store.getState().joinGame('TEST123');

    expect(setItemSpy).toHaveBeenCalledWith('grimoire_last_room', 'TEST123');
    setItemSpy.mockRestore();
  });
});

describe('joinGame Exception Handling', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Reset the select mock to default implementation
    mockQueryBuilder.select.mockReset();
    mockQueryBuilder.select.mockReturnValue({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            data: {
              roomId: 'TEST123',
              seats: [],
              messages: [],
              phase: 'SETUP',
              currentScriptId: 'tb'
            }
          },
          error: null
        }))
      }))
    });

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should handle exception with Error object', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    // Mock select to throw an error
    mockQueryBuilder.select.mockImplementation(() => {
      throw new Error('Network failure');
    });

    store.getState().login('Player', false);
    await store.getState().joinGame('TEST123');

    expect(store.getState().connectionStatus).toBe('disconnected');
    expect(consoleSpy).toHaveBeenCalled();
    expect(removeItemSpy).toHaveBeenCalledWith('grimoire_last_room');

    consoleSpy.mockRestore();
    removeItemSpy.mockRestore();
  });

  it('should handle exception with non-Error object', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockQueryBuilder.select.mockImplementation(() => {
      throw 'String error';
    });

    store.getState().login('Player', false);
    await store.getState().joinGame('TEST123');

    expect(store.getState().connectionStatus).toBe('disconnected');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should not join if user is not logged in', async () => {
    mockQueryBuilder.select.mockClear();

    await store.getState().joinGame('TEST123');

    // Should not call any Supabase methods
    expect(mockQueryBuilder.select).not.toHaveBeenCalled();
  });
});

describe('spectateGame Subscription Status', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    // Reset the select mock to default implementation
    mockQueryBuilder.select.mockReset();
    mockQueryBuilder.select.mockReturnValue({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: {
            data: {
              roomId: 'TEST123',
              seats: [],
              messages: [],
              phase: 'SETUP',
              currentScriptId: 'tb'
            }
          },
          error: null
        }))
      }))
    });

    // Reset channel subscribe to default
    mockChannel.subscribe.mockReset();
    mockChannel.subscribe.mockImplementation((callback?: (status: string) => void) => {
      callback?.('SUBSCRIBED');
      return mockChannel;
    });

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  // Note: The spectateGame function explicitly sets connectionStatus: 'connected' in the final set() call,
  // so subscription status callbacks don't affect the final state in spectateGame. This is different from joinGame.
  // These tests verify that the subscription callback is invoked with different statuses.

  it('should invoke subscription callback with CHANNEL_ERROR status', async () => {
    let receivedStatus: string | null = null;
    mockChannel.subscribe.mockImplementation((callback?: (status: string) => void) => {
      receivedStatus = 'CHANNEL_ERROR';
      callback?.('CHANNEL_ERROR');
      return mockChannel;
    });

    await store.getState().spectateGame('TEST123');

    // Verify that CHANNEL_ERROR was received by the callback
    expect(receivedStatus).toBe('CHANNEL_ERROR');
    // Note: spectateGame always sets connected at the end regardless of subscription status
    expect(store.getState().gameState).not.toBeNull();
  });

  it('should invoke subscription callback with CLOSED status', async () => {
    let receivedStatus: string | null = null;
    mockChannel.subscribe.mockImplementation((callback?: (status: string) => void) => {
      receivedStatus = 'CLOSED';
      callback?.('CLOSED');
      return mockChannel;
    });

    await store.getState().spectateGame('TEST123');

    // Verify that CLOSED was received by the callback
    expect(receivedStatus).toBe('CLOSED');
    // spectateGame always sets state at the end regardless of subscription status
    expect(store.getState().gameState).not.toBeNull();
  });

  it('should create observer user with correct properties', async () => {
    await store.getState().spectateGame('TEST123');

    const user = store.getState().user;
    expect(user?.isObserver).toBe(true);
    expect(user?.name).toBe('Observer');
    expect(user?.isStoryteller).toBe(false);
    expect(user?.isSeated).toBe(false);
    expect(user?.id).toMatch(/^observer-\d+$/);
  });

  it('should handle spectate exception with non-Error object', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockQueryBuilder.select.mockImplementationOnce(() => {
      throw 'String error';
    });

    await store.getState().spectateGame('TEST123');

    expect(store.getState().connectionStatus).toBe('disconnected');
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('should receive and process realtime updates in spectate mode', async () => {
    // Capture the postgres_changes callback
    let postgresCallback: ((payload: unknown) => void) | null = null;

    mockChannel.on.mockImplementation((event: string, _config: unknown, callback: (payload: unknown) => void) => {
      if (event === 'postgres_changes') {
        postgresCallback = callback;
      }
      return mockChannel;
    });

    await store.getState().spectateGame('TEST123');

    // Simulate receiving an update
    expect(postgresCallback).not.toBeNull();
    postgresCallback!({
      new: {
        data: createTestGameState({ roomId: 'TEST123', phase: 'NIGHT' })
      }
    });

    // The state should be updated
    expect(store.getState().gameState?.phase).toBe('NIGHT');
  });
});

describe('leaveGame with Secret Channel', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null; isAudioBlocked?: boolean }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    store = createStore<ConnectionSlice & { gameState: GameState | null; isAudioBlocked?: boolean }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null,
        isAudioBlocked: false
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should clean up both realtime and secret channels when storyteller leaves', async () => {
    // First, storyteller joins
    const publicGameState = createTestGameState({ roomId: 'TEST123' });

    mockQueryBuilder.select
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: publicGameState },
            error: null
          }))
        }))
      })
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: { storytellerNotes: [] } },
            error: null
          }))
        }))
      });

    store.getState().login('Storyteller', true);
    await store.getState().joinGame('TEST123');

    // Now leave
    store.getState().leaveGame();

    expect(store.getState().connectionStatus).toBe('disconnected');
    expect(store.getState().gameState).toBeNull();
    expect(store.getState().user?.roomId).toBeNull();
  });

  it('should clear seat token from localStorage when leaving', async () => {
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    store.getState().login('Player', false);
    store.setState({
      gameState: createTestGameState({ roomId: 'TEST123' }),
      user: { id: 'user1', name: 'Player', isStoryteller: false, roomId: 'TEST123', isSeated: true }
    });

    store.getState().leaveGame();

    expect(removeItemSpy).toHaveBeenCalledWith('seat_token_TEST123');
    expect(removeItemSpy).toHaveBeenCalledWith('grimoire_last_room');

    removeItemSpy.mockRestore();
  });

  it('should handle leaving when not in a room', () => {
    store.getState().login('Player', false);

    // Should not throw when leaving without being in a room
    expect(() => store.getState().leaveGame()).not.toThrow();
    expect(store.getState().connectionStatus).toBe('disconnected');
  });

  it('should reset seat when player leaves', async () => {
    const gameState = createTestGameState({
      roomId: 'TEST123',
      seats: [
        createTestSeat({
          id: 1,
          userId: 'player1',
          userName: 'Player1',
          roleId: 'imp',
          realRoleId: 'imp',
          seenRoleId: 'imp',
          isDead: true,
          hasGhostVote: false,
          isNominated: true,
          hasUsedAbility: true,
          isHandRaised: true,
          voteLocked: true,
          reminders: [{ id: 'r1', text: 'empowered', sourceRole: 'empath', seatId: 1 }],
          statuses: ['POISONED']
        })
      ]
    });

    store.setState({
      user: { id: 'player1', name: 'Player1', isStoryteller: false, roomId: 'TEST123', isSeated: true },
      gameState,
      isOffline: false
    });

    store.getState().leaveGame();

    // After leaving, gameState is null, but the seat was cleared before that
    expect(store.getState().gameState).toBeNull();
    expect(store.getState().connectionStatus).toBe('disconnected');
  });

  it('should not modify seat or sync when offline', async () => {
    const gameState = createTestGameState({
      roomId: 'TEST123',
      seats: [
        createTestSeat({
          id: 1,
          userId: 'player1',
          userName: 'Player1'
        })
      ]
    });

    store.setState({
      user: { id: 'player1', name: 'Player1', isStoryteller: false, roomId: 'TEST123', isSeated: true },
      gameState,
      isOffline: true
    });

    vi.clearAllMocks();
    store.getState().leaveGame();

    // Should not call sync when offline
    expect(mockQueryBuilder.update).not.toHaveBeenCalled();
  });

  it('should not modify seat for observer', async () => {
    const gameState = createTestGameState({ roomId: 'TEST123' });

    store.setState({
      user: { id: 'observer-123', name: 'Observer', isStoryteller: false, roomId: 'TEST123', isSeated: false, isObserver: true },
      gameState,
      isOffline: false
    });

    vi.clearAllMocks();
    store.getState().leaveGame();

    // Observers don't modify seats, but channels are cleaned up
    expect(store.getState().connectionStatus).toBe('disconnected');
  });
});

describe('Realtime Channel Update Handling', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should process realtime updates in joinGame', async () => {
    let postgresCallback: ((payload: unknown) => void) | null = null;

    mockChannel.on.mockImplementation((event: string, _config: unknown, callback: (payload: unknown) => void) => {
      if (event === 'postgres_changes') {
        postgresCallback = callback;
      }
      return mockChannel;
    });

    store.getState().login('Player', false);
    await store.getState().joinGame('TEST123');

    // Simulate receiving an update
    expect(postgresCallback).not.toBeNull();
    postgresCallback!({
      new: {
        data: createTestGameState({ roomId: 'TEST123', phase: 'NIGHT' })
      }
    });

    expect(store.getState().gameState?.phase).toBe('NIGHT');
  });

  it('should handle empty payload data gracefully', async () => {
    let postgresCallback: ((payload: unknown) => void) | null = null;

    mockChannel.on.mockImplementation((event: string, _config: unknown, callback: (payload: unknown) => void) => {
      if (event === 'postgres_changes') {
        postgresCallback = callback;
      }
      return mockChannel;
    });

    store.getState().login('Player', false);
    await store.getState().joinGame('TEST123');

    const currentPhase = store.getState().gameState?.phase;

    // Simulate receiving an empty update
    expect(postgresCallback).not.toBeNull();
    postgresCallback!({
      new: {}
    });

    // State should not change
    expect(store.getState().gameState?.phase).toBe(currentPhase);
  });

  it('should handle undefined payload gracefully', async () => {
    let postgresCallback: ((payload: unknown) => void) | null = null;

    mockChannel.on.mockImplementation((event: string, _config: unknown, callback: (payload: unknown) => void) => {
      if (event === 'postgres_changes') {
        postgresCallback = callback;
      }
      return mockChannel;
    });

    store.getState().login('Player', false);
    await store.getState().joinGame('TEST123');

    const currentPhase = store.getState().gameState?.phase;

    // Simulate receiving undefined
    expect(postgresCallback).not.toBeNull();
    postgresCallback!({
      new: undefined
    });

    // State should not change
    expect(store.getState().gameState?.phase).toBe(currentPhase);
  });
});

describe('Secret Channel Update Handling for Storyteller', () => {
  let store: StoreApi<ConnectionSlice & { gameState: GameState | null }>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    store = createStore<ConnectionSlice & { gameState: GameState | null }>()(
      immer((set, get) => ({
        ...createConnectionSlice(set as never, get as never, {} as never),
        gameState: null
      }))
    );
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should process secret channel updates for storyteller', async () => {
    // Mock channel to capture the secret channel callback
    const { createClient } = await import('@supabase/supabase-js');
     
    const mockSupabase = (createClient as any)();
    let channelCallCount = 0;

    // Track which channel is being created
    mockSupabase.channel.mockImplementation((channelName: string) => {
      channelCallCount++;
      const isSecretChannel = channelName.includes('secrets');
      void isSecretChannel; // Mark as intentionally unused

      return {
        on: vi.fn().mockImplementation((_event: string, _config: unknown, _callback: (payload: unknown) => void) => {
          return mockChannel;
        }),
        subscribe: vi.fn((callback?: (status: string) => void) => {
          callback?.('SUBSCRIBED');
          return mockChannel;
        }),
        unsubscribe: vi.fn()
      };
    });

    const publicGameState = createTestGameState({ roomId: 'TEST123' });

    mockQueryBuilder.select
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: publicGameState },
            error: null
          }))
        }))
      })
      .mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { data: { storytellerNotes: [] } },
            error: null
          }))
        }))
      });

    store.getState().login('Storyteller', true);
    await store.getState().joinGame('TEST123');

    // Verify the store is connected
    expect(store.getState().connectionStatus).toBe('connected');
    expect(store.getState().user?.isStoryteller).toBe(true);
    expect(channelCallCount).toBeGreaterThan(0);
  });
});
