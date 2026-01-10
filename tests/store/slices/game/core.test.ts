/**
 * Game Core Slice Tests
 *
 * 游戏核心功能状态测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameCoreSlice } from '../../../../src/store/slices/game/core';
import type { GameState, Seat } from '../../../../src/types';

// Mock supabase
vi.mock('../../../../src/store/slices/createConnectionSlice', () => ({
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
  }
}));

// 创建测试座位
function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 0,
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
    userId: null,
    userName: '座位 1',
    roleId: null,
    isVirtual: false,
    isReady: false,
    ...overrides
  };
}

// Mock store state
const createMockStore = () => {
  const state: {
    gameState: Partial<GameState> | null;
    user: { id: string; name: string; roomId: string; isSeated?: boolean } | null;
    connectionStatus: string;
    isOffline: boolean;
    sync: () => void;
    _setIsReceivingUpdate?: (value: boolean) => void;
    _setRealtimeChannel?: (channel: unknown) => void;
  } = {
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

  const set = vi.fn((fn: (state: typeof state) => void) => {
    if (typeof fn === 'function') {
      fn(state);
    } else {
      Object.assign(state, fn);
    }
  });

  const get = vi.fn(() => state);

  return { state, set, get };
};

describe('createGameCoreSlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let coreSlice: ReturnType<typeof createGameCoreSlice>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    coreSlice = createGameCoreSlice(mockStore.set, mockStore.get, {});
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
      const initialCount = mockStore.state.gameState!.seats!.length;
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
  });
});
