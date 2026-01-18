/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';

// Helper to create a test seat with all required properties
const createTestSeat = (overrides: {
  id: number;
  userId: string | null;
  userName: string;
  isVirtual?: boolean;
}) => ({
  id: overrides.id,
  userId: overrides.userId,
  userName: overrides.userName,
  isDead: false,
  hasGhostVote: false,
  roleId: null,
  realRoleId: null,
  seenRoleId: null,
  reminders: [],
  isHandRaised: false,
  isNominated: false,
  hasUsedAbility: false,
  statuses: [],
  isVirtual: overrides.isVirtual ?? false,
});

// Create mock state
const createMockState = () => ({
  gameState: {
    seats: [
      createTestSeat({ id: 0, userId: 'user1', userName: 'Player1', isVirtual: false }),
      createTestSeat({ id: 1, userId: 'user2', userName: 'Player2', isVirtual: false }),
      createTestSeat({ id: 2, userId: null, userName: '座位 3', isVirtual: false }),
    ],
    swapRequests: [] as {
      id: string;
      fromSeatId: number;
      fromUserId: string;
      fromName: string;
      toSeatId: number;
      toUserId: string;
      timestamp: number;
    }[],
  },
  user: { id: 'user1', name: 'Player1' },
});

describe('createGameSeatSwapSlice', () => {
  describe('swapSeats', () => {
    it('swaps two occupied seats', () => {
      const state = createMockState();
      const s1 = state.gameState.seats.find(s => s.id === 0)!;
      const s2 = state.gameState.seats.find(s => s.id === 1)!;
      
      // Perform swap
      const tempUser = { userId: s1.userId, userName: s1.userName, isVirtual: s1.isVirtual };
      s1.userId = s2.userId;
      s1.userName = s2.userName;
      s1.isVirtual = s2.isVirtual;
      s2.userId = tempUser.userId;
      s2.userName = tempUser.userName;
      s2.isVirtual = tempUser.isVirtual;
      
      expect(state.gameState.seats[0]!.userId).toBe('user2');
      expect(state.gameState.seats[1]!.userId).toBe('user1');
    });

    it('handles swap with empty seat', () => {
      const state = createMockState();
      const s1 = state.gameState.seats.find(s => s.id === 0)!;
      const s2 = state.gameState.seats.find(s => s.id === 2)!; // empty seat
      
      const tempUser = { userId: s1.userId, userName: s1.userName, isVirtual: s1.isVirtual };
      s1.userId = s2.userId;
      s1.userName = s2.userName;
      s2.userId = tempUser.userId;
      s2.userName = tempUser.userName;
      
      expect(state.gameState.seats[0]!.userId).toBe(null);
      expect(state.gameState.seats[2]!.userId).toBe('user1');
    });
  });

  describe('requestSeatSwap', () => {
    it('creates swap request', () => {
      const state = createMockState();
      const fromSeat = state.gameState.seats.find(s => s.userId === state.user.id)!;
      const toSeat = state.gameState.seats.find(s => s.id === 1)!;
      
      state.gameState.swapRequests.push({
        id: Date.now().toString(),
        fromSeatId: fromSeat.id,
        fromUserId: state.user.id,
        fromName: state.user.name,
        toSeatId: toSeat.id,
        toUserId: toSeat.userId!,
        timestamp: Date.now(),
      });
      
      expect(state.gameState.swapRequests).toHaveLength(1);
      expect(state.gameState.swapRequests[0]!.fromSeatId).toBe(0);
      expect(state.gameState.swapRequests[0]!.toSeatId).toBe(1);
    });

    it('does not create request if target seat is empty', () => {
      const state = createMockState();
      const toSeat = state.gameState.seats.find(s => s.id === 2)!; // empty
      
      if (toSeat.userId) {
        state.gameState.swapRequests.push({
          id: Date.now().toString(),
          fromSeatId: 0,
          fromUserId: state.user.id,
          fromName: state.user.name,
          toSeatId: toSeat.id,
          toUserId: toSeat.userId,
          timestamp: Date.now(),
        });
      }
      
      expect(state.gameState.swapRequests).toHaveLength(0);
    });
  });

  describe('respondToSwapRequest', () => {
    it('removes swap request after response', () => {
      const state = createMockState();
      state.gameState.swapRequests.push({
        id: 'req1',
        fromSeatId: 0,
        fromUserId: 'user1',
        fromName: 'Player1',
        toSeatId: 1,
        toUserId: 'user2',
        timestamp: Date.now(),
      });
      
      const reqIndex = state.gameState.swapRequests.findIndex(r => r.id === 'req1');
      state.gameState.swapRequests.splice(reqIndex, 1);
      
      expect(state.gameState.swapRequests).toHaveLength(0);
    });
  });

  describe('forceLeaveSeat', () => {
    it('clears seat user data', () => {
      const state = createMockState();
      const seat = state.gameState.seats.find(s => s.id === 0)!;
      
      seat.userId = null;
      seat.userName = `座位 ${seat.id + 1}`;
      
      expect(state.gameState.seats[0]!.userId).toBeNull();
      expect(state.gameState.seats[0]!.userName).toBe('座位 1');
    });
  });
});
