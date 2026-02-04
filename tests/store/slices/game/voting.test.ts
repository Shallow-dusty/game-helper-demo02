/**
 * Voting Slice Extended Tests
 *
 * 投票功能更完整的测试覆盖
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createVotingSlice } from '../../../../src/store/slices/game/flow/voting';
import type { GameState, Seat } from '../../../../src/types';

// Import mocked modules
import { checkGameOver } from '../../../../src/lib/gameLogic';

// Mock supabase
vi.mock('../../../../src/store/slices/connection', () => ({
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
    userId: null,
    userName: '座位 1',
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

// Mock store state
const createMockStore = () => {
  type MockStoreState = {
    gameState: Partial<GameState> | null;
    user: { id: string; name: string; roomId: string } | null;
    sync: () => void;
  };

  const state: MockStoreState = {
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
      dailyNominations: [],
      dailyExecutionCompleted: false,
      messages: [],
      roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 1 }
    } as Partial<GameState>,
    user: { id: 'user1', name: 'Player1', roomId: 'room123' },
    sync: vi.fn()
  };

  const set = vi.fn((fn: (state: MockStoreState) => void) => {
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
    votingSlice = (createVotingSlice as any)(
      mockStore.set,
      mockStore.get
    );
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
      expect(mockStore.state.gameState?.dailyNominations?.length).toBe(1);
      expect(mockStore.state.gameState?.roundInfo?.nominationCount).toBe(1);
      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not crash if no gameState', () => {
      mockStore.state.gameState = null;

      votingSlice.startVote(0);

      expect(mockStore.get().sync).toHaveBeenCalled();
    });

    it('should not start a new vote while another vote is active', () => {
      mockStore.state.gameState!.voting = {
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        clockHandSeatId: 1,
        votes: [0, 2, 3],
        isOpen: true
      };
      mockStore.state.gameState!.ruleAutomationLevel = 'FULL_AUTO';

      votingSlice.startVote(3);

      expect(mockStore.state.gameState?.voting?.nomineeSeatId).toBe(1);
      expect(mockStore.state.gameState?.voting?.votes).toEqual([0, 2, 3]);
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
      votingSlice.toggleHand();

      // Should return early
      expect(mockStore.state.gameState?.voting?.votes).toEqual([]);
    });

    it('should not do anything if no voting state', () => {
      mockStore.state.gameState!.voting = null;

      votingSlice.toggleHand();

      // Should return early
    });

    it('should not do anything if user does not own current seat', () => {
      // user1 owns seat 0, but clockHand is pointing to seat 1
      mockStore.state.gameState!.voting!.clockHandSeatId = 1;

      votingSlice.toggleHand();

      expect(mockStore.state.gameState?.voting?.votes).toEqual([]);
    });

    it('should not do anything if clockHandSeatId is null', () => {
      mockStore.state.gameState!.voting!.clockHandSeatId = null;

      votingSlice.toggleHand();

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

    it('should mark nominee on the block with enough votes', () => {
      // 3 votes with 5 alive players should put nominee on the block
      votingSlice.closeVote();

      const nominee = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      expect(nominee?.isDead).toBe(false);
      expect(mockStore.state.gameState?.voteHistory?.[0]?.result).toBe('on_the_block');
    });

    it('should not execute with insufficient votes', () => {
      mockStore.state.gameState!.voting!.votes = [0]; // Only 1 vote

      votingSlice.closeVote();

      const nominee = mockStore.state.gameState?.seats?.find(s => s.id === 1);
      expect(nominee?.isDead).toBe(false);
    });

    it('should add appropriate system message for nomination lead', () => {
      votingSlice.closeVote();

      const sysMsg = mockStore.state.gameState?.messages?.find(m =>
        m.type === 'system' && m.content.includes('处决候选')
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
      expect(history?.result).toBe('on_the_block');
      expect(history?.votes).toEqual([0, 2, 3]);
      // nominatorSeatId: when it's 0, code correctly preserves 0 using nullish coalescing (??)
      expect(history?.nominatorSeatId).toBe(0);
      expect(history?.nomineeSeatId).toBe(1);
    });

    it('should handle vote with no nominee seat', () => {
      mockStore.state.gameState!.voting!.nomineeSeatId = 99;

      votingSlice.closeVote();

      // Should not crash
      expect(mockStore.state.gameState?.voting).toBe(null);
    });
  });

  describe('closeVote with game over', () => {
    beforeEach(() => {
      mockStore.state.gameState!.voting = {
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        clockHandSeatId: 4,
        votes: [0, 2, 3],  // 3 votes to execute
        isOpen: true
      };
      // Set nominee as demon so game can end
      mockStore.state.gameState!.seats![1]!.realRoleId = 'imp';
    });

    it('should not trigger game over during closeVote', () => {
      vi.mocked(checkGameOver).mockReturnValue({
        isOver: true,
        winner: 'GOOD',
        reason: '恶魔被处决'
      });

      votingSlice.closeVote();

      expect(checkGameOver).not.toHaveBeenCalled();
      expect(mockStore.state.gameState?.gameOver).toBeUndefined();
    });

    it('should not add game over message during closeVote', () => {
      vi.mocked(checkGameOver).mockReturnValue({
        isOver: true,
        winner: 'GOOD',
        reason: '恶魔被处决'
      });

      votingSlice.closeVote();

      const gameOverMsg = mockStore.state.gameState?.messages?.find(m =>
        m.type === 'system' && m.content.includes('游戏结束')
      );
      expect(gameOverMsg).toBeUndefined();
    });

    it('should not show evil wins during closeVote', () => {
      vi.mocked(checkGameOver).mockReturnValue({
        isOver: true,
        winner: 'EVIL',
        reason: '圣徒被处决'
      });

      votingSlice.closeVote();

      const gameOverMsg = mockStore.state.gameState?.messages?.find(m =>
        m.type === 'system' && m.content.includes('游戏结束')
      );
      expect(gameOverMsg).toBeUndefined();
    });

    it('should not set game over when game continues', () => {
      vi.mocked(checkGameOver).mockReturnValue(null);

      votingSlice.closeVote();

      expect(mockStore.state.gameState?.gameOver).toBeUndefined();
    });
  });

  describe('closeVote edge cases', () => {
    it('should handle no user gracefully', () => {
      mockStore.state.user = null;
      mockStore.state.gameState!.voting = {
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        clockHandSeatId: 4,
        votes: [0, 2, 3],
        isOpen: true
      };

      votingSlice.closeVote();

      // Should still close vote, just not log to database
      expect(mockStore.state.gameState?.voting).toBe(null);
    });

    it('should record survived result with insufficient votes', () => {
      mockStore.state.gameState!.voting = {
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        clockHandSeatId: 4,
        votes: [0],  // Only 1 vote
        isOpen: true
      };

      votingSlice.closeVote();

      expect(mockStore.state.gameState?.voteHistory?.[0]?.result).toBe('survived');
    });

    it('should handle null nomineeSeatId gracefully', () => {
      mockStore.state.gameState!.voting = {
        nominatorSeatId: 0,
        nomineeSeatId: null as unknown as number,
        clockHandSeatId: 4,
        votes: [0, 2, 3],
        isOpen: true
      };

      votingSlice.closeVote();

      // Should not crash and record -1
      expect(mockStore.state.gameState?.voteHistory?.[0]?.nomineeSeatId).toBe(-1);
    });
  });
});
