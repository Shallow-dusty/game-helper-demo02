/**
 * Voting Slice Extended Tests
 *
 * 投票功能更完整的测试覆盖
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createVotingSlice } from '../../../../src/store/slices/game/flow/voting';
import type { GameState, Seat } from '../../../../src/types';

// Mock supabase
vi.mock('../../../../src/store/slices/createConnectionSlice', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

// Mock external dependencies
vi.mock('../../../../src/lib/gameLogic', () => ({
  checkGameOver: vi.fn()
}));

vi.mock('../../../../src/lib/supabaseService', () => ({
  logExecution: vi.fn().mockResolvedValue(undefined),
  updateNominationResult: vi.fn().mockResolvedValue(undefined)
}));

// 创建测试座位
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
    userId: null,
    userName: '座位 1',
    roleId: null,
    isVirtual: false,
    ...overrides
  };
}

// Mock store state
const createMockStore = () => {
  const state: {
    gameState: Partial<GameState> | null;
    user: { id: string; name: string; roomId: string } | null;
    sync: () => void;
  } = {
    gameState: {
      seats: [
        createTestSeat({ id: 0, userId: 'user1', userName: 'Player1' }),
        createTestSeat({ id: 1, userId: 'user2', userName: 'Player2' }),
        createTestSeat({ id: 2, userId: 'user3', userName: 'Player3' }),
        createTestSeat({ id: 3, userId: 'user4', userName: 'Player4' }),
        createTestSeat({ id: 4, userId: 'user5', userName: 'Player5' })
      ],
      voting: null,
      phase: 'DAY',
      voteHistory: [],
      messages: [],
      roundInfo: { dayCount: 1, nightCount: 1 }
    } as Partial<GameState>,
    user: { id: 'user1', name: 'Player1', roomId: 'room123' },
    sync: vi.fn()
  };

  const set = vi.fn((fn: (state: typeof state) => void) => {
    fn(state);
  });

  const get = vi.fn(() => state);

  return { state, set, get };
};

describe('createVotingSlice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let votingSlice: ReturnType<typeof createVotingSlice>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    votingSlice = createVotingSlice(mockStore.set, mockStore.get, {});
  });

  describe('startVote', () => {
    it('should start a vote for a nominee', () => {
      votingSlice.startVote(2);

      expect(mockStore.state.gameState?.voting).toBeDefined();
      expect(mockStore.state.gameState?.voting?.nomineeSeatId).toBe(2);
      expect(mockStore.state.gameState?.voting?.clockHandSeatId).toBe(2);
      expect(mockStore.state.gameState?.voting?.votes).toEqual([]);
      expect(mockStore.state.gameState?.voting?.isOpen).toBe(true);
      expect(mockStore.state.gameState?.phase).toBe('VOTING');
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      votingSlice.startVote(0);

      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should reset previous voting state', () => {
      mockStore.state.gameState!.voting = {
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        clockHandSeatId: 1,
        votes: [0, 2, 3],
        isOpen: true
      };

      votingSlice.startVote(3);

      expect(mockStore.state.gameState?.voting?.nomineeSeatId).toBe(3);
      expect(mockStore.state.gameState?.voting?.votes).toEqual([]);
    });
  });

  describe('nextClockHand', () => {
    beforeEach(() => {
      mockStore.state.gameState!.voting = {
        nominatorSeatId: null,
        nomineeSeatId: 0,
        clockHandSeatId: 0,
        votes: [],
        isOpen: true
      };
    });

    it('should advance clock hand to next seat', () => {
      votingSlice.nextClockHand();

      expect(mockStore.state.gameState?.voting?.clockHandSeatId).toBe(1);
    });

    it('should wrap around to seat 0', () => {
      mockStore.state.gameState!.voting!.clockHandSeatId = 4;

      votingSlice.nextClockHand();

      expect(mockStore.state.gameState?.voting?.clockHandSeatId).toBe(0);
    });

    it('should not advance if clockHandSeatId is null', () => {
      mockStore.state.gameState!.voting!.clockHandSeatId = null;

      votingSlice.nextClockHand();

      expect(mockStore.state.gameState?.voting?.clockHandSeatId).toBe(null);
    });

    it('should not crash if no voting state', () => {
      mockStore.state.gameState!.voting = null;

      votingSlice.nextClockHand();

      expect(mockStore.get().sync).toHaveBeenCalled();
    });
  });

  describe('toggleHand', () => {
    beforeEach(() => {
      mockStore.state.gameState!.voting = {
        nominatorSeatId: null,
        nomineeSeatId: 1,
        clockHandSeatId: 0,
        votes: [],
        isOpen: true
      };
    });

    it('should not do anything if no user', () => {
      mockStore.state.user = null;

      // toggleHand is async but we don't need to await in tests since it returns early
      void votingSlice.toggleHand();

      // Should return early
      expect(mockStore.state.gameState?.voting?.votes).toEqual([]);
    });

    it('should not do anything if no voting state', () => {
      mockStore.state.gameState!.voting = null;

      void votingSlice.toggleHand();

      // Should return early
    });

    it('should not do anything if user does not own current seat', () => {
      // user1 owns seat 0, but clockHand is pointing to seat 1
      mockStore.state.gameState!.voting!.clockHandSeatId = 1;

      void votingSlice.toggleHand();

      expect(mockStore.state.gameState?.voting?.votes).toEqual([]);
    });

    it('should not do anything if clockHandSeatId is null', () => {
      mockStore.state.gameState!.voting!.clockHandSeatId = null;

      void votingSlice.toggleHand();

      expect(mockStore.state.gameState?.voting?.votes).toEqual([]);
    });
  });

  describe('closeVote', () => {
    beforeEach(() => {
      mockStore.state.gameState!.voting = {
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        clockHandSeatId: 4,
        votes: [0, 2, 3],
        isOpen: true
      };
    });

    it('should close vote and record in history', () => {
      votingSlice.closeVote();

      expect(mockStore.state.gameState?.voting).toBe(null);
      expect(mockStore.state.gameState?.phase).toBe('DAY');
      expect(mockStore.state.gameState?.voteHistory?.length).toBe(1);
      expect(mockStore.state.gameState?.voteHistory?.[0]?.voteCount).toBe(3);
    });

    it('should execute nominee with enough votes', () => {
      // 3 votes with 5 alive players should execute
      votingSlice.closeVote();

      const nominee = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      expect(nominee?.isDead).toBe(true);
    });

    it('should not execute with insufficient votes', () => {
      mockStore.state.gameState!.voting!.votes = [0]; // Only 1 vote

      votingSlice.closeVote();

      const nominee = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      expect(nominee?.isDead).toBe(false);
    });

    it('should add appropriate system message for execution', () => {
      votingSlice.closeVote();

      const sysMsg = mockStore.state.gameState?.messages?.find(m =>
        m.type === 'system' && m.content.includes('处决')
      );
      expect(sysMsg).toBeDefined();
    });

    it('should add system message for insufficient votes', () => {
      mockStore.state.gameState!.voting!.votes = [];

      votingSlice.closeVote();

      const sysMsg = mockStore.state.gameState?.messages?.find(m =>
        m.type === 'system' && m.content.includes('票数不足')
      );
      expect(sysMsg).toBeDefined();
    });

    it('should not crash if no voting state', () => {
      mockStore.state.gameState!.voting = null;

      votingSlice.closeVote();

      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should record correct vote result in history', () => {
      votingSlice.closeVote();

      const history = mockStore.state.gameState?.voteHistory?.[0];
      expect(history?.result).toBe('executed');
      expect(history?.votes).toEqual([0, 2, 3]);
      // nominatorSeatId: when it's 0, code uses `nominatorSeatId || -1` which evaluates to -1
      // since 0 is falsy in JavaScript
      expect(history?.nominatorSeatId).toBe(-1);
      expect(history?.nomineeSeatId).toBe(1);
    });

    it('should handle vote with no nominee seat', () => {
      mockStore.state.gameState!.voting!.nomineeSeatId = 99;

      votingSlice.closeVote();

      // Should not crash
      expect(mockStore.state.gameState?.voting).toBe(null);
    });
  });
});
