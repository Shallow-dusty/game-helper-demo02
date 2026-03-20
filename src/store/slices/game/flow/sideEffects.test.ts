import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Draft } from 'immer';
import type { AppState } from '@/store/types';
import {
  onEnterNight,
  onEnterDay,
  onExitVoting,
  resolveDailyExecution,
  addPhaseChangeMessage,
} from './sideEffects';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/store/utils', () => ({
  addSystemMessage: vi.fn(),
}));

vi.mock('@/constants', () => ({
  PHASE_LABELS: {
    SETUP: '准备阶段',
    NIGHT: '夜晚',
    DAY: '白天',
    VOTING: '投票',
  },
}));

const mockCalculateNightQueue = vi.fn().mockReturnValue(['imp', 'washerwoman']);
const mockGetVoteThreshold = vi.fn().mockReturnValue(2);

vi.mock('./utils', () => ({
  calculateNightQueue: (...args: unknown[]) => mockCalculateNightQueue(...args),
  getVoteThreshold: (...args: unknown[]) => mockGetVoteThreshold(...args),
}));

const mockCheckGameOver = vi.fn().mockReturnValue(null);

vi.mock('@/lib/gameLogic', () => ({
  checkGameOver: (...args: unknown[]) => mockCheckGameOver(...args),
}));

const mockLogExecution = vi.fn().mockResolvedValue(undefined);
const mockUpdateNominationResult = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/supabaseService', () => ({
  logExecution: (...args: unknown[]) => mockLogExecution(...args),
  updateNominationResult: (...args: unknown[]) => mockUpdateNominationResult(...args),
}));

// Import the mocked addSystemMessage so we can inspect calls
import { addSystemMessage } from '@/store/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createSeat(overrides: Partial<{
  id: number;
  userId: string;
  userName: string;
  roleId: string | null;
  realRoleId: string | null;
  seenRoleId: string | null;
  isDead: boolean;
  hasGhostVote: boolean;
}> = {}) {
  return {
    id: 0,
    odai: null,
    odaiSubmittedAt: null,
    odaiUpdatedAt: null,
    odaiSubmittedBy: null,
    userId: 'user1',
    userName: '玩家1',
    roleId: 'washerwoman',
    realRoleId: 'washerwoman',
    seenRoleId: 'washerwoman',
    isDead: false,
    hasGhostVote: true,
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    ...overrides,
  };
}

function createMockState(overrides: Partial<{
  gameState: unknown;
  roomDbId: number | null;
}> = {}): Draft<AppState> {
  return {
    roomDbId: null,
    gameState: {
      phase: 'NIGHT' as const,
      candlelightEnabled: false,
      roundInfo: { nightCount: 0, dayCount: 0, nominationCount: 0, totalRounds: 0 },
      seats: [
        createSeat({ id: 0, userId: 'user1', userName: '玩家1', roleId: 'washerwoman', realRoleId: 'washerwoman', seenRoleId: 'washerwoman' }),
        createSeat({ id: 1, userId: 'user2', userName: '玩家2', roleId: 'imp', realRoleId: 'imp', seenRoleId: 'imp' }),
        createSeat({ id: 2, userId: 'user3', userName: '玩家3', roleId: 'empath', realRoleId: 'empath', seenRoleId: 'empath' }),
      ],
      nightQueue: [],
      nightCurrentIndex: -1,
      voting: null,
      voteHistory: [] as {
        round: number;
        nomineeSeatId: number;
        voteCount: number;
        result: string;
      }[],
      interactionLog: [],
      dailyNominations: [],
      dailyExecutionCompleted: false,
      gameOver: null,
      messages: [],
      currentScriptId: 'tb',
    },
    ...overrides,
  } as unknown as Draft<AppState>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('sideEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckGameOver.mockReturnValue(null);
    mockCalculateNightQueue.mockReturnValue(['imp', 'washerwoman']);
    mockGetVoteThreshold.mockReturnValue(2);
  });

  // =========================================================================
  // onEnterNight
  // =========================================================================
  describe('onEnterNight', () => {
    it('increments nightCount and totalRounds', () => {
      const state = createMockState();
      onEnterNight(state);

      expect(state.gameState!.roundInfo.nightCount).toBe(1);
      expect(state.gameState!.roundInfo.totalRounds).toBe(1);
    });

    it('resets dailyExecutionCompleted to false', () => {
      const state = createMockState();
      (state.gameState as any).dailyExecutionCompleted = true;
      onEnterNight(state);

      expect((state.gameState as any).dailyExecutionCompleted).toBe(false);
    });

    it('calculates nightQueue with isFirstNight=true when nightCount becomes 1', () => {
      const state = createMockState();
      onEnterNight(state);

      expect(mockCalculateNightQueue).toHaveBeenCalledWith(
        state.gameState!.seats,
        true,  // isFirstNight
        'tb',
      );
    });

    it('calculates nightQueue with isFirstNight=false on subsequent nights', () => {
      const state = createMockState();
      state.gameState!.roundInfo.nightCount = 1; // already had first night
      onEnterNight(state);

      expect(mockCalculateNightQueue).toHaveBeenCalledWith(
        state.gameState!.seats,
        false,
        'tb',
      );
    });

    it('sets nightCurrentIndex to -1', () => {
      const state = createMockState();
      (state.gameState as any).nightCurrentIndex = 3;
      onEnterNight(state);

      expect(state.gameState!.nightCurrentIndex).toBe(-1);
    });

    it('does nothing when gameState is null', () => {
      const state = createMockState({ gameState: null });
      expect(() => onEnterNight(state)).not.toThrow();
    });
  });

  // =========================================================================
  // onEnterDay
  // =========================================================================
  describe('onEnterDay', () => {
    it('increments dayCount', () => {
      const state = createMockState();
      onEnterDay(state);
      expect(state.gameState!.roundInfo.dayCount).toBe(1);
    });

    it('resets nominationCount to 0', () => {
      const state = createMockState();
      state.gameState!.roundInfo.nominationCount = 5;
      onEnterDay(state);
      expect(state.gameState!.roundInfo.nominationCount).toBe(0);
    });

    it('disables candlelight', () => {
      const state = createMockState();
      (state.gameState as any).candlelightEnabled = true;
      onEnterDay(state);
      expect(state.gameState!.candlelightEnabled).toBe(false);
    });

    it('clears dailyNominations', () => {
      const state = createMockState();
      (state.gameState as any).dailyNominations = [{ id: 1 }];
      onEnterDay(state);
      expect((state.gameState as any).dailyNominations).toEqual([]);
    });

    it('does nothing when gameState is null', () => {
      const state = createMockState({ gameState: null });
      expect(() => onEnterDay(state)).not.toThrow();
    });
  });

  // =========================================================================
  // onExitVoting
  // =========================================================================
  describe('onExitVoting', () => {
    it('sets voting to null', () => {
      const state = createMockState();
      state.gameState!.voting = {
        nominatorSeatId: 0,
        nomineeSeatId: 1,
        clockHandSeatId: null,
        votes: [],
        isOpen: true,
      } as any;
      onExitVoting(state);
      expect(state.gameState!.voting).toBeNull();
    });

    it('does nothing when gameState is null', () => {
      const state = createMockState({ gameState: null });
      expect(() => onExitVoting(state)).not.toThrow();
    });
  });

  // =========================================================================
  // resolveDailyExecution
  // =========================================================================
  describe('resolveDailyExecution', () => {
    it('does nothing when gameState is null', () => {
      const state = createMockState({ gameState: null });
      expect(() => resolveDailyExecution(state)).not.toThrow();
      expect(mockCheckGameOver).not.toHaveBeenCalled();
    });

    it('calls checkGameOver with executionOccurred:false when no votes exist', () => {
      const state = createMockState();
      state.gameState!.roundInfo.dayCount = 1;
      (state.gameState as any).voteHistory = [];

      resolveDailyExecution(state);

      expect(mockCheckGameOver).toHaveBeenCalledWith(
        state.gameState!.seats,
        { executionOccurred: false },
      );
    });

    it('sets gameOver when checkGameOver returns a result (no votes)', () => {
      mockCheckGameOver.mockReturnValue({ winner: 'EVIL', reason: '邪恶获胜' });
      const state = createMockState();
      state.gameState!.roundInfo.dayCount = 1;
      (state.gameState as any).voteHistory = [];

      resolveDailyExecution(state);

      expect((state.gameState as any).gameOver).toEqual({ winner: 'EVIL', reason: '邪恶获胜' });
      expect(addSystemMessage).toHaveBeenCalledWith(
        state.gameState,
        expect.stringContaining('邪恶'),
      );
    });

    it('filters out cancelled votes', () => {
      const state = createMockState();
      state.gameState!.roundInfo.dayCount = 1;
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 0, voteCount: 3, result: 'cancelled' },
      ];

      resolveDailyExecution(state);

      // Cancelled vote is filtered → treated as no votes
      expect(mockCheckGameOver).toHaveBeenCalledWith(
        state.gameState!.seats,
        { executionOccurred: false },
      );
    });

    it('does not execute when votes are below threshold', () => {
      mockGetVoteThreshold.mockReturnValue(3); // need 3 votes
      const state = createMockState();
      state.gameState!.roundInfo.dayCount = 1;
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 1, voteCount: 2, result: 'pending' },
      ];

      resolveDailyExecution(state);

      // No eligible votes → no execution
      expect(mockCheckGameOver).toHaveBeenCalledWith(
        state.gameState!.seats,
        { executionOccurred: false },
      );
      expect((state.gameState as any).dailyExecutionCompleted).toBe(false);
    });

    it('executes the single winner: marks dead, sets dailyExecutionCompleted', () => {
      mockGetVoteThreshold.mockReturnValue(2);
      const state = createMockState();
      state.gameState!.roundInfo.dayCount = 1;
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 1, voteCount: 3, result: 'pending' },
      ];

      resolveDailyExecution(state);

      // Seat 1 should be marked dead
      expect(state.gameState!.seats[1].isDead).toBe(true);
      expect((state.gameState as any).dailyExecutionCompleted).toBe(true);
      expect((state.gameState as any).voteHistory[0].result).toBe('executed');
      expect(addSystemMessage).toHaveBeenCalledWith(
        state.gameState,
        expect.stringContaining('玩家2'),
      );
    });

    it('calls checkGameOver with executedSeatId on successful execution', () => {
      mockGetVoteThreshold.mockReturnValue(2);
      const state = createMockState();
      state.gameState!.roundInfo.dayCount = 1;
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 1, voteCount: 3, result: 'pending' },
      ];

      resolveDailyExecution(state);

      expect(mockCheckGameOver).toHaveBeenCalledWith(
        state.gameState!.seats,
        { executedSeatId: 1, executionOccurred: true },
      );
    });

    it('handles tied votes: sets result=tied, no execution', () => {
      mockGetVoteThreshold.mockReturnValue(2);
      const state = createMockState();
      state.gameState!.roundInfo.dayCount = 1;
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 0, voteCount: 3, result: 'pending' },
        { round: 1, nomineeSeatId: 1, voteCount: 3, result: 'pending' },
      ];

      resolveDailyExecution(state);

      expect((state.gameState as any).voteHistory[0].result).toBe('tied');
      expect((state.gameState as any).voteHistory[1].result).toBe('tied');
      expect(addSystemMessage).toHaveBeenCalledWith(
        state.gameState,
        expect.stringContaining('平票'),
      );
      // Also calls checkGameOver with no execution
      expect(mockCheckGameOver).toHaveBeenCalledWith(
        state.gameState!.seats,
        { executionOccurred: false },
      );
    });

    it('cancels execution when nominee is already dead', () => {
      mockGetVoteThreshold.mockReturnValue(2);
      const state = createMockState();
      state.gameState!.roundInfo.dayCount = 1;
      state.gameState!.seats[1].isDead = true; // nominee already dead
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 1, voteCount: 3, result: 'pending' },
      ];

      resolveDailyExecution(state);

      expect((state.gameState as any).voteHistory[0].result).toBe('cancelled');
      expect(addSystemMessage).toHaveBeenCalledWith(
        state.gameState,
        expect.stringContaining('已死亡'),
      );
    });

    it('voudon presence sets threshold to 0 (all votes eligible)', () => {
      mockGetVoteThreshold.mockReturnValue(3);
      const state = createMockState();
      // Add a voudon seat (alive)
      state.gameState!.seats.push(
        createSeat({ id: 3, userId: 'user4', userName: '玩家4', roleId: 'voudon', realRoleId: 'voudon', seenRoleId: 'voudon' }),
      );
      state.gameState!.roundInfo.dayCount = 1;
      // A vote with count=1, normally below threshold of 3
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 1, voteCount: 1, result: 'pending' },
      ];

      resolveDailyExecution(state);

      // With voudon, threshold is 0, so even 1 vote is eligible
      expect(state.gameState!.seats[1].isDead).toBe(true);
      expect((state.gameState as any).dailyExecutionCompleted).toBe(true);
    });

    it('voudon detection uses realRoleId, seenRoleId, and roleId fallbacks', () => {
      mockGetVoteThreshold.mockReturnValue(3);
      const state = createMockState();
      // Voudon with only seenRoleId set (realRoleId is null)
      state.gameState!.seats.push(
        createSeat({ id: 3, userId: 'user4', userName: '玩家4', roleId: null, realRoleId: null, seenRoleId: 'voudon' }),
      );
      state.gameState!.roundInfo.dayCount = 1;
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 1, voteCount: 1, result: 'pending' },
      ];

      resolveDailyExecution(state);

      // seenRoleId fallback should detect voudon
      expect(state.gameState!.seats[1].isDead).toBe(true);
    });

    it('logs execution to supabase when roomDbId is set', () => {
      mockGetVoteThreshold.mockReturnValue(2);
      const state = createMockState({ roomDbId: 42 });
      state.gameState!.roundInfo.dayCount = 1;
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 1, voteCount: 3, result: 'pending' },
      ];

      resolveDailyExecution(state);

      expect(mockLogExecution).toHaveBeenCalledWith(42, 1, 1, 'imp', 3);
      expect(mockUpdateNominationResult).toHaveBeenCalledWith(42, 1, 1, true, 3, true);
    });

    it('does not log to supabase when roomDbId is null', () => {
      mockGetVoteThreshold.mockReturnValue(2);
      const state = createMockState({ roomDbId: null });
      state.gameState!.roundInfo.dayCount = 1;
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 1, voteCount: 3, result: 'pending' },
      ];

      resolveDailyExecution(state);

      expect(mockLogExecution).not.toHaveBeenCalled();
      expect(mockUpdateNominationResult).not.toHaveBeenCalled();
    });

    it('only considers votes from the current day', () => {
      mockGetVoteThreshold.mockReturnValue(2);
      const state = createMockState();
      state.gameState!.roundInfo.dayCount = 2;
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 1, voteCount: 5, result: 'executed' }, // previous day
        { round: 2, nomineeSeatId: 0, voteCount: 3, result: 'pending' }, // current day
      ];

      resolveDailyExecution(state);

      // Should only process round 2 vote
      expect(state.gameState!.seats[0].isDead).toBe(true);
      expect(state.gameState!.seats[1].isDead).toBe(false);
    });

    it('sets gameOver on execution when checkGameOver returns result', () => {
      mockGetVoteThreshold.mockReturnValue(2);
      mockCheckGameOver.mockReturnValue({ winner: 'GOOD', reason: '恶魔死亡' });
      const state = createMockState();
      state.gameState!.roundInfo.dayCount = 1;
      (state.gameState as any).voteHistory = [
        { round: 1, nomineeSeatId: 1, voteCount: 3, result: 'pending' },
      ];

      resolveDailyExecution(state);

      expect((state.gameState as any).gameOver).toEqual({ winner: 'GOOD', reason: '恶魔死亡' });
      expect(addSystemMessage).toHaveBeenCalledWith(
        state.gameState,
        expect.stringContaining('好人'),
      );
    });
  });

  // =========================================================================
  // addPhaseChangeMessage
  // =========================================================================
  describe('addPhaseChangeMessage', () => {
    it('adds system message with phase label', () => {
      const state = createMockState();
      addPhaseChangeMessage(state, 'NIGHT' as any);

      expect(addSystemMessage).toHaveBeenCalledWith(
        state.gameState,
        '游戏阶段变更为: 夜晚',
      );
    });

    it('does nothing when gameState is null', () => {
      const state = createMockState({ gameState: null });
      addPhaseChangeMessage(state, 'DAY' as any);
      expect(addSystemMessage).not.toHaveBeenCalled();
    });
  });
});
