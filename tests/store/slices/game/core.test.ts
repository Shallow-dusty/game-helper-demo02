/**
 * Game Core Slice Tests
 *
 * 游戏核心功能状态测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameCoreSlice } from '../../../../src/store/slices/game/core';
import type { GameState, Seat } from '../../../../src/types';
import type { AppState } from '../../../../src/store/types';
import { setIsReceivingUpdate, setRealtimeChannel } from '../../../../src/store/slices/connection';

// Mock @supabase/supabase-js to provide REALTIME_SUBSCRIBE_STATES
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(),
    channel: vi.fn(),
    rpc: vi.fn(),
    removeChannel: vi.fn()
  })),
  REALTIME_SUBSCRIBE_STATES: {
    SUBSCRIBED: 'SUBSCRIBED',
    CLOSED: 'CLOSED',
    CHANNEL_ERROR: 'CHANNEL_ERROR',
    TIMED_OUT: 'TIMED_OUT'
  }
}));

// Mock supabase and connection functions
vi.mock('../../../../src/store/slices/connection', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockResolvedValue({ error: null })
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn((cb) => {
        cb('SUBSCRIBED');
        return { unsubscribe: vi.fn() };
      })
    })),
    rpc: vi.fn().mockResolvedValue({ data: { success: true }, error: null })
  },
  setIsReceivingUpdate: vi.fn(),
  setRealtimeChannel: vi.fn()
}));

// 创建测试座位
function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 0,
    isDead: false,
    hasGhostVote: true,
    isNominated: false,
    statuses: [],
    hasUsedAbility: false,
    reminders: [],
    userId: null,
    userName: '座位 1',
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    isVirtual: false,
    isReady: false,
    isHandRaised: false,
    ...overrides
  };
}

// Mock store state
const createMockStore = () => {
  interface MockState {
    gameState: Partial<GameState> | null;
    user: { id: string; name: string; roomId: string; isSeated?: boolean } | null;
    connectionStatus: string;
    isOffline: boolean;
    sync: () => void;
    _setIsReceivingUpdate?: (value: boolean) => void;
    _setRealtimeChannel?: (channel: unknown) => void;
  }

  const state: MockState = {
    gameState: {
      seats: [
        createTestSeat({ id: 0, userId: null, userName: '座位 1' }),
        createTestSeat({ id: 1, userId: null, userName: '座位 2' }),
        createTestSeat({ id: 2, userId: null, userName: '座位 3' }),
        createTestSeat({ id: 3, userId: null, userName: '座位 4' }),
        createTestSeat({ id: 4, userId: null, userName: '座位 5' })
      ],
      messages: []
    } as Partial<GameState>,
    user: { id: 'user1', name: 'Player1', roomId: 'room123' },
    connectionStatus: 'disconnected',
    isOffline: false,
    sync: vi.fn(),
    _setIsReceivingUpdate: vi.fn(),
    _setRealtimeChannel: vi.fn()
  };

  const set = vi.fn((fn: ((state: MockState) => void) | Partial<MockState>) => {
    if (typeof fn === 'function') {
      fn(state);
    } else {
      Object.assign(state, fn);
    }
  }) as any;

  const get = vi.fn(() => state);

  return { state, set, get };
};

describe('createGameCoreSlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let coreSlice: ReturnType<typeof createGameCoreSlice>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    coreSlice = createGameCoreSlice(
      mockStore.set as any,
      mockStore.get as unknown as () => AppState,
      {} as unknown as any
    );
  });

  describe('toggleReady', () => {
    it('should toggle ready state for current user seat', () => {
      mockStore.state.gameState!.seats![0]!.userId = 'user1';
      mockStore.state.gameState!.seats![0]!.isReady = false;

      coreSlice.toggleReady();

      expect(mockStore.state.gameState?.seats?.[0]?.isReady).toBe(true);
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should toggle ready from true to false', () => {
      mockStore.state.gameState!.seats![0]!.userId = 'user1';
      mockStore.state.gameState!.seats![0]!.isReady = true;

      coreSlice.toggleReady();

      expect(mockStore.state.gameState?.seats?.[0]?.isReady).toBe(false);
    });

    it('should not crash if no user', () => {
      mockStore.state.user = null;

      coreSlice.toggleReady();

      expect(mockStore.get().sync).not.toHaveBeenCalled();
    });

    it('should not crash if user not seated', () => {
      // No seat has userId === 'user1'

      coreSlice.toggleReady();

      // Should still call sync (code doesn't check if seat was found)
      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('addSeat', () => {
    it('should add a new seat', () => {
      const initialCount = mockStore.state.gameState!.seats!.length;

      coreSlice.addSeat();

      expect(mockStore.state.gameState?.seats?.length).toBe(initialCount + 1);
      const newSeat = mockStore.state.gameState?.seats?.[initialCount];
      expect(newSeat?.id).toBe(initialCount);
      expect(newSeat?.userName).toBe(`座位 ${initialCount + 1}`);
      expect(newSeat?.userId).toBe(null);
      expect(newSeat?.isVirtual).toBe(false);
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not add seat beyond 20', () => {
      // Create 20 seats
      mockStore.state.gameState!.seats = Array.from({ length: 20 }, (_, i) =>
        createTestSeat({ id: i, userName: `座位 ${i + 1}` })
      );

      coreSlice.addSeat();

      expect(mockStore.state.gameState?.seats?.length).toBe(20);
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      coreSlice.addSeat();

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('removeSeat', () => {
    it('should remove the last seat', () => {
      // Add more seats to allow removal
      mockStore.state.gameState!.seats = Array.from({ length: 7 }, (_, i) =>
        createTestSeat({ id: i, userName: `座位 ${i + 1}` })
      );

      coreSlice.removeSeat();

      expect(mockStore.state.gameState?.seats?.length).toBe(6);
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not remove seat below 5', () => {
      // Already have 5 seats
      expect(mockStore.state.gameState?.seats?.length).toBe(5);

      coreSlice.removeSeat();

      expect(mockStore.state.gameState?.seats?.length).toBe(5);
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      coreSlice.removeSeat();

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('addVirtualPlayer', () => {
    it('should add virtual player to empty seat', () => {
      coreSlice.addVirtualPlayer();

      const virtualSeat = mockStore.state.gameState?.seats?.find(s => s.isVirtual);
      expect(virtualSeat).toBeDefined();
      expect(virtualSeat?.userName).toContain('虚拟玩家');
      expect(virtualSeat?.userId).toContain('virtual-');
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not add virtual player if no empty seats', () => {
      // Fill all seats
      mockStore.state.gameState!.seats!.forEach((seat, i) => {
        seat.userId = `user${i}`;
      });

      coreSlice.addVirtualPlayer();

      const virtualSeat = mockStore.state.gameState?.seats?.find(s => s.isVirtual);
      expect(virtualSeat).toBeUndefined();
    });

    it('should not add virtual player to already virtual seat', () => {
      mockStore.state.gameState!.seats![0]!.isVirtual = true;
      mockStore.state.gameState!.seats![0]!.userId = 'virtual-1';

      coreSlice.addVirtualPlayer();

      // Should add to seat 1, not seat 0
      expect(mockStore.state.gameState?.seats?.[1]?.isVirtual).toBe(true);
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      coreSlice.addVirtualPlayer();

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('removeVirtualPlayer', () => {
    it('should remove virtual player from seat', () => {
      mockStore.state.gameState!.seats![2]!.isVirtual = true;
      mockStore.state.gameState!.seats![2]!.userId = 'virtual-123';
      mockStore.state.gameState!.seats![2]!.userName = '虚拟玩家 3';

      coreSlice.removeVirtualPlayer(2);

      expect(mockStore.state.gameState?.seats?.[2]?.isVirtual).toBe(false);
      expect(mockStore.state.gameState?.seats?.[2]?.userId).toBe(null);
      expect(mockStore.state.gameState?.seats?.[2]?.userName).toBe('座位 3');
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not remove non-virtual player', () => {
      mockStore.state.gameState!.seats![0]!.userId = 'real-user';
      mockStore.state.gameState!.seats![0]!.isVirtual = false;

      coreSlice.removeVirtualPlayer(0);

      // Should not change anything
      expect(mockStore.state.gameState?.seats?.[0]?.userId).toBe('real-user');
    });

    it('should not crash for non-existent seat', () => {
      coreSlice.removeVirtualPlayer(99);

      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      coreSlice.removeVirtualPlayer(0);

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('joinSeat', () => {
    it('should not crash if no user', async () => {
      mockStore.state.user = null;

      await coreSlice.joinSeat(0);

      // Should return early
    });

    it('should not crash if no gameState', async () => {
      mockStore.state.gameState = null;

      await coreSlice.joinSeat(0);

      // Should return early
    });

    it('should not join if seat already occupied', async () => {
      mockStore.state.gameState!.seats![0]!.userId = 'other-user';

      await coreSlice.joinSeat(0);

      // Should return early
    });

    it('should not join if seat not found', async () => {
      await coreSlice.joinSeat(99);

      // Should return early
    });
  });

  describe('leaveSeat', () => {
    it('should not crash if no user', async () => {
      mockStore.state.user = null;

      await coreSlice.leaveSeat();

      // Should return early
    });

    it('should not crash if no gameState', async () => {
      mockStore.state.gameState = null;

      await coreSlice.leaveSeat();

      // Should return early
    });

    it('should not crash if user not seated', async () => {
      // No seat has userId === 'user1'

      await coreSlice.leaveSeat();

      // Should return early
    });
  });

  describe('createGame', () => {
    it('should not crash if no user', async () => {
      mockStore.state.user = null;

      await coreSlice.createGame(7);

      // Should return early
    });

    it('should handle realtime postgres_changes callback with valid data', async () => {
      // Capture the callbacks
      let postgresChangesCallback: ((payload: unknown) => void) | null = null;

      const { supabase } = await import('../../../../src/store/slices/connection');

      // Setup mock to capture callbacks
      const mockChannel = {
        on: vi.fn().mockImplementation((_event: string, _config: unknown, cb: (payload: unknown) => void) => {
          postgresChangesCallback = cb;
          return mockChannel;
        }),
        subscribe: vi.fn().mockImplementation((cb: (status: string) => void) => {
          // Immediately call with SUBSCRIBED
          if (cb) cb('SUBSCRIBED');
          return { unsubscribe: vi.fn() };
        })
      };

      (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(mockChannel);

      await coreSlice.createGame(7);

      // Now trigger the postgres_changes callback with valid data
      expect(postgresChangesCallback).toBeDefined();
      if (postgresChangesCallback) {
        const mockPayload = {
          new: {
            data: {
              roomId: 'TEST123',
              seats: [],
              messages: [],
              phase: 'SETUP'
            }
          }
        };

        (postgresChangesCallback as (payload: unknown) => void)(mockPayload);

        // Verify the callback processed the data
        expect(setIsReceivingUpdate).toHaveBeenCalledWith(true);
        expect(setIsReceivingUpdate).toHaveBeenCalledWith(false);
      }
    });

    it('should handle realtime postgres_changes callback with no data', async () => {
      let postgresChangesCallback: ((payload: unknown) => void) | null = null;

      const { supabase } = await import('../../../../src/store/slices/connection');

      const mockChannel = {
        on: vi.fn().mockImplementation((_event: string, _config: unknown, cb: (payload: unknown) => void) => {
          postgresChangesCallback = cb;
          return mockChannel;
        }),
        subscribe: vi.fn().mockImplementation((cb: (status: string) => void) => {
          if (cb) cb('SUBSCRIBED');
          return { unsubscribe: vi.fn() };
        })
      };

      (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(mockChannel);

      await coreSlice.createGame(7);

      expect(postgresChangesCallback).toBeDefined();
      if (postgresChangesCallback) {
        // Trigger callback with undefined new data
        (postgresChangesCallback as (payload: unknown) => void)({ new: undefined });

        // _setIsReceivingUpdate should NOT be called when no data
        expect(setIsReceivingUpdate).not.toHaveBeenCalled();
      }
    });

    it('should handle realtime postgres_changes callback with empty new object', async () => {
      let postgresChangesCallback: ((payload: unknown) => void) | null = null;

      const { supabase } = await import('../../../../src/store/slices/connection');

      const mockChannel = {
        on: vi.fn().mockImplementation((_event: string, _config: unknown, cb: (payload: unknown) => void) => {
          postgresChangesCallback = cb;
          return mockChannel;
        }),
        subscribe: vi.fn().mockImplementation((cb: (status: string) => void) => {
          if (cb) cb('SUBSCRIBED');
          return { unsubscribe: vi.fn() };
        })
      };

      (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(mockChannel);

      await coreSlice.createGame(7);

      expect(postgresChangesCallback).toBeDefined();
      if (postgresChangesCallback) {
        // Trigger callback with new object but no data property
        (postgresChangesCallback as (payload: unknown) => void)({ new: {} });

        // _setIsReceivingUpdate should NOT be called when no data property
        expect(setIsReceivingUpdate).not.toHaveBeenCalled();
      }
    });

    it('should set connectionStatus to connected when subscription status is SUBSCRIBED', async () => {
      let subscribeCallback: ((status: string) => void) | null = null;

      const { supabase } = await import('../../../../src/store/slices/connection');

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((cb: (status: string) => void) => {
          subscribeCallback = cb;
          return { unsubscribe: vi.fn() };
        })
      };

      (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(mockChannel);

      await coreSlice.createGame(7);

      expect(subscribeCallback).toBeDefined();
      if (subscribeCallback) {
        (subscribeCallback as (status: string) => void)('SUBSCRIBED');
        expect(mockStore.state.connectionStatus).toBe('connected');
        expect(mockStore.state.isOffline).toBe(false);
      }
    });

    it('should set connectionStatus to disconnected when subscription status is CLOSED', async () => {
      let subscribeCallback: ((status: string) => void) | null = null;

      const { supabase } = await import('../../../../src/store/slices/connection');

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((cb: (status: string) => void) => {
          subscribeCallback = cb;
          return { unsubscribe: vi.fn() };
        })
      };

      (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(mockChannel);

      await coreSlice.createGame(7);

      expect(subscribeCallback).toBeDefined();
      if (subscribeCallback) {
        (subscribeCallback as (status: string) => void)('CLOSED');
        expect(mockStore.state.connectionStatus).toBe('disconnected');
      }
    });

    it('should set connectionStatus to reconnecting when subscription status is CHANNEL_ERROR', async () => {
      let subscribeCallback: ((status: string) => void) | null = null;

      const { supabase } = await import('../../../../src/store/slices/connection');

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((cb: (status: string) => void) => {
          subscribeCallback = cb;
          return { unsubscribe: vi.fn() };
        })
      };

      (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(mockChannel);

      await coreSlice.createGame(7);

      expect(subscribeCallback).toBeDefined();
      if (subscribeCallback) {
        (subscribeCallback as (status: string) => void)('CHANNEL_ERROR');
        expect(mockStore.state.connectionStatus).toBe('reconnecting');
      }
    });

    it('should handle database insert error and switch to offline mode', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { supabase } = await import('../../../../src/store/slices/connection');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'Insert failed' } })
      });

      await coreSlice.createGame(7);

      expect(mockStore.state.isOffline).toBe(true);
      expect(mockStore.state.connectionStatus).toBe('disconnected');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle database insert throwing exception and switch to offline mode', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { supabase } = await import('../../../../src/store/slices/connection');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockRejectedValue(new Error('Network error'))
      });

      await coreSlice.createGame(7);

      expect(mockStore.state.isOffline).toBe(true);
      expect(mockStore.state.connectionStatus).toBe('disconnected');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle non-Error exception and switch to offline mode', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { supabase } = await import('../../../../src/store/slices/connection');

      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockRejectedValue('String error')
      });

      await coreSlice.createGame(7);

      expect(mockStore.state.isOffline).toBe(true);
      expect(mockStore.state.connectionStatus).toBe('disconnected');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should set realtime channel after successful subscription', async () => {
      const { supabase } = await import('../../../../src/store/slices/connection');

      // Reset supabase.from to return success
      (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null })
      });

      // Create mock channel - subscribe should return the channel itself for chaining
      const mockChannel: {
        on: ReturnType<typeof vi.fn>;
        subscribe: ReturnType<typeof vi.fn>;
        unsubscribe: ReturnType<typeof vi.fn>;
      } = {
        on: vi.fn(),
        subscribe: vi.fn(),
        unsubscribe: vi.fn()
      };

      // Setup chaining: on() returns mockChannel, subscribe() also returns mockChannel
      mockChannel.on.mockReturnValue(mockChannel);
      mockChannel.subscribe.mockImplementation((cb: (status: string) => void) => {
        if (cb) cb('SUBSCRIBED');
        return mockChannel; // Returns the channel itself, like real Supabase
      });

      (supabase.channel as ReturnType<typeof vi.fn>).mockReturnValue(mockChannel);

      await coreSlice.createGame(7);

      expect(setRealtimeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('joinSeat RPC', () => {
    it('should successfully join seat when RPC succeeds', async () => {
      // Setup: user exists, seat is empty
      mockStore.state.gameState!.seats![0]!.userId = null;

      await coreSlice.joinSeat(0);

      // Should update user.isSeated to true
      expect(mockStore.state.user?.isSeated).toBe(true);
    });

    it('should handle RPC error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { supabase } = await import('../../../../src/store/slices/connection');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      mockStore.state.gameState!.seats![0]!.userId = null;

      await coreSlice.joinSeat(0);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle RPC failure response', async () => {
      const { supabase } = await import('../../../../src/store/slices/connection');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { success: false, error: 'Seat already taken' },
        error: null
      });

      mockStore.state.gameState!.seats![0]!.userId = null;
      mockStore.state.user!.isSeated = false;

      await coreSlice.joinSeat(0);

      // Should not update user.isSeated when RPC returns failure
      expect(mockStore.state.user?.isSeated).toBe(false);
    });

    it('should handle RPC throwing error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { supabase } = await import('../../../../src/store/slices/connection');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      mockStore.state.gameState!.seats![0]!.userId = null;

      await coreSlice.joinSeat(0);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('leaveSeat RPC', () => {
    it('should successfully leave seat when RPC succeeds', async () => {
      // Setup: user is seated
      mockStore.state.gameState!.seats![0]!.userId = 'user1';
      mockStore.state.user!.isSeated = true;

      await coreSlice.leaveSeat();

      expect(mockStore.state.user?.isSeated).toBe(false);
    });

    it('should handle RPC error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { supabase } = await import('../../../../src/store/slices/connection');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      mockStore.state.gameState!.seats![0]!.userId = 'user1';
      mockStore.state.user!.isSeated = true;

      await coreSlice.leaveSeat();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle RPC failure response', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { supabase } = await import('../../../../src/store/slices/connection');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: { success: false, error: 'Cannot leave' },
        error: null
      });

      mockStore.state.gameState!.seats![0]!.userId = 'user1';
      mockStore.state.user!.isSeated = true;

      await coreSlice.leaveSeat();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle RPC throwing error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { supabase } = await import('../../../../src/store/slices/connection');

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      mockStore.state.gameState!.seats![0]!.userId = 'user1';
      mockStore.state.user!.isSeated = true;

      await coreSlice.leaveSeat();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
