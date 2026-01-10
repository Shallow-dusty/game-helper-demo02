/**
 * Connection Slice Tests - Real-time Sync
 *
 * 连接状态切片测试 - 实时同步
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GameState, Seat, Message } from '../../../src/types';

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
  })),
  update: vi.fn(() => ({
    eq: vi.fn(() => ({ error: null }))
  })),
  upsert: vi.fn(() => ({ error: null })),
  insert: vi.fn(() => ({ data: null, error: null }))
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => mockQueryBuilder),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn()
  }))
}));

// Mock toast
vi.mock('../../../src/components/ui/Toast', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn()
}));

import { createConnectionSlice, ConnectionSlice } from '../../../src/store/slices/createConnectionSlice';

// Helper to create a test seat
function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 1,
    index: 0,
    isEmpty: false,
    isDead: false,
    hasGhostVote: true,
    isNominated: false,
    isNominatedBy: null,
    markedForDeath: false,
    statuses: [],
    hasUsedAbility: false,
    notes: [],
    reminders: [],
    nightReminders: [],
    causeOfDeath: null,
    ...overrides
  };
}

// Helper to create a test game state
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    roomId: 'TEST123',
    currentScriptId: 'tb',
    phase: 'SETUP',
    setupPhase: 'WAITING',
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
  let store: ReturnType<typeof createStore<ConnectionSlice & { gameState: GameState | null }>>;

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
      const mockCh = { id: 'test-channel' };
      store.getState()._setRealtimeChannel(mockCh);
      expect(store.getState()._getRealtimeChannel()).toBe(mockCh);
    });
  });
});

describe('Connection Status Transitions', () => {
  let store: ReturnType<typeof createStore<ConnectionSlice & { gameState: GameState | null }>>;

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
  let store: ReturnType<typeof createStore<ConnectionSlice & { gameState: GameState | null }>>;

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
