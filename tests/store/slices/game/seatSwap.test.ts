/**
 * Game Seat Swap Slice Tests
 *
 * 座位交换功能状态测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameSeatSwapSlice } from '../../../../src/store/slices/game/seatSwap';
import type { GameState, Seat, SwapRequest } from '../../../../src/types';
import type { AppState } from '../../../../src/store/types';

// 创建测试座位
function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 1,
    isDead: false,
    hasGhostVote: true,
    isNominated: false,
    isHandRaised: false,
    hasUsedAbility: false,
    statuses: [],
    reminders: [],
    userId: null,
    userName: '座位 1',
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    isVirtual: false,
    ...overrides
  };
}

// Mock store state
const createMockStore = () => {
  const state: any = {
    gameState: {
      seats: [
        createTestSeat({ id: 0, userId: 'user1', userName: 'Player1', isVirtual: false }),
        createTestSeat({ id: 1, userId: 'user2', userName: 'Player2', isVirtual: false }),
        createTestSeat({ id: 2, userId: null, userName: '座位 3', isVirtual: false })
      ],
      swapRequests: [] as SwapRequest[]
    } as Partial<GameState>,
    user: { id: 'user1', name: 'Player1', roomId: 'room123', isStoryteller: false, isSeated: true },
    sync: vi.fn()
  };

  const set = vi.fn((fn: (state: any) => void) => {
    fn(state);
  }) as any;

  const get = vi.fn(() => state as AppState);

  return { state, set, get };
};

describe('createGameSeatSwapSlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let seatSwapSlice: ReturnType<typeof createGameSeatSwapSlice>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    seatSwapSlice = createGameSeatSwapSlice(mockStore.set, mockStore.get, {} as any);
  });

  describe('swapSeats', () => {
    it('should swap two seats', () => {
      seatSwapSlice.swapSeats(0, 1);

      const seats = mockStore.state.gameState?.seats;
      expect(seats?.[0]?.userId).toBe('user2');
      expect(seats?.[0]?.userName).toBe('Player2');
      expect(seats?.[1]?.userId).toBe('user1');
      expect(seats?.[1]?.userName).toBe('Player1');
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should swap seat with empty seat', () => {
      seatSwapSlice.swapSeats(0, 2);

      const seats = mockStore.state.gameState?.seats;
      expect(seats?.[0]?.userId).toBe(null);
      expect(seats?.[2]?.userId).toBe('user1');
    });

    it('should handle non-existent seats gracefully', () => {
      seatSwapSlice.swapSeats(0, 99);

      // Should not crash
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should swap virtual player flag', () => {
      mockStore.state.gameState!.seats![0]!.isVirtual = true;
      mockStore.state.gameState!.seats![1]!.isVirtual = false;

      seatSwapSlice.swapSeats(0, 1);

      expect(mockStore.state.gameState?.seats?.[0]?.isVirtual).toBe(false);
      expect(mockStore.state.gameState?.seats?.[1]?.isVirtual).toBe(true);
    });
  });

  describe('requestSeatSwap', () => {
    it('should create a swap request', () => {
      seatSwapSlice.requestSeatSwap(1);

      expect(mockStore.state.gameState?.swapRequests?.length).toBe(1);
      const request = mockStore.state.gameState?.swapRequests?.[0];
      expect(request?.fromSeatId).toBe(0);
      expect(request?.fromUserId).toBe('user1');
      expect(request?.toSeatId).toBe(1);
      expect(request?.toUserId).toBe('user2');
    });

    it('should not create request if no user', () => {
      mockStore.state.user = null;

      seatSwapSlice.requestSeatSwap(1);

      expect(mockStore.state.gameState?.swapRequests?.length).toBe(0);
    });

    it('should not create request if target seat is empty', () => {
      seatSwapSlice.requestSeatSwap(2);

      // Seat 2 has no userId, so no request should be created
      expect(mockStore.state.gameState?.swapRequests?.length).toBe(0);
    });

    it('should not create request if user not seated', () => {
      mockStore.state.user = { id: 'user99', name: 'Unseated', roomId: 'room123', isStoryteller: false, isSeated: false };

      seatSwapSlice.requestSeatSwap(1);

      expect(mockStore.state.gameState?.swapRequests?.length).toBe(0);
    });
  });

  describe('respondToSwapRequest', () => {
    beforeEach(() => {
      mockStore.state.gameState!.swapRequests = [{
        id: 'req1',
        fromSeatId: 0,
        fromUserId: 'user1',
        fromName: 'Player1',
        toSeatId: 1,
        toUserId: 'user2',
        timestamp: Date.now()
      }];
    });

    it('should remove request when accepted', () => {
      seatSwapSlice.respondToSwapRequest('req1', true);

      expect(mockStore.state.gameState?.swapRequests?.length).toBe(0);
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should remove request when rejected', () => {
      seatSwapSlice.respondToSwapRequest('req1', false);

      expect(mockStore.state.gameState?.swapRequests?.length).toBe(0);
    });

    it('should not crash if request not found', () => {
      seatSwapSlice.respondToSwapRequest('nonexistent', true);

      expect(mockStore.state.gameState?.swapRequests?.length).toBe(1);
    });
  });

  describe('forceLeaveSeat', () => {
    it('should force a player to leave their seat', () => {
      seatSwapSlice.forceLeaveSeat(0);

      const seat = mockStore.state.gameState?.seats?.[0];
      expect(seat?.userId).toBe(null);
      expect(seat?.userName).toBe('座位 1');

      expect(seat?.roleId).toBe(null);
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not crash if seat not found', () => {
      seatSwapSlice.forceLeaveSeat(99);

      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should clear empty seat gracefully', () => {
      seatSwapSlice.forceLeaveSeat(2);

      const seat = mockStore.state.gameState?.seats?.[2];
      expect(seat?.userId).toBe(null);
    });
  });
});
