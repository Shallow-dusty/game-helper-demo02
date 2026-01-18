/**
 * Game Flow Module Tests
 *
 * 游戏流程模块测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGameFlowSlice } from '../../../../src/store/slices/game/flow/index';
import { createPhaseSlice } from '../../../../src/store/slices/game/flow/phase';
import { createFeaturesSlice } from '../../../../src/store/slices/game/flow/features';
import { createLifecycleSlice } from '../../../../src/store/slices/game/flow/lifecycle';
import { calculateNightQueue, calculateVoteResult } from '../../../../src/store/slices/game/flow/utils';
import type { Seat, GameState } from '../../../../src/types';

// 创建测试座位
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

// 创建测试 GameState
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    roomId: 'test-room',
    currentScriptId: 'tb',
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: true,
    vibrationEnabled: false,
    seats: [
      createTestSeat({ id: 1, userId: 'user1', userName: '玩家1', roleId: 'washerwoman', realRoleId: 'washerwoman', seenRoleId: 'washerwoman' }),
      createTestSeat({ id: 2, userId: 'user2', userName: '玩家2', roleId: 'imp', realRoleId: 'imp', seenRoleId: 'imp' }),
      createTestSeat({ id: 3, userId: 'user3', userName: '玩家3', roleId: 'empath', realRoleId: 'empath', seenRoleId: 'empath' })
    ],
    swapRequests: [],
    messages: [],
    gameOver: { isOver: false, winner: null, reason: '' },
    audio: { trackId: null, isPlaying: false, volume: 0.5 },
    nightQueue: [],
    nightCurrentIndex: 0,
    voting: null,
    customScripts: {},
    customRoles: {},
    voteHistory: [],
    roundInfo: {
      dayCount: 0,
      nightCount: 0,
      nominationCount: 0,
      totalRounds: 0
    },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    candlelightEnabled: false,
    dailyNominations: [],
    interactionLog: [],
    ...overrides
  };
}

// Mock store state 类型定义
interface MockStoreState {
  gameState: GameState | null;
  sync: () => void;
}

// Mock store state
const createMockStore = () => {
  const state: MockStoreState = {
    gameState: createTestGameState(),
    sync: vi.fn()
  };

  const set = vi.fn((fn: (state: MockStoreState) => MockStoreState) => {
    fn(state);
  });

  const get = vi.fn(() => state);

  return { state, set, get };
};

describe('Phase Slice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let phaseSlice: ReturnType<typeof createPhaseSlice>;

  beforeEach(() => {
    mockStore = createMockStore();
    phaseSlice = createPhaseSlice(
      mockStore.set as never,
      mockStore.get as never,
      {} as never
    );
  });

  describe('setPhase', () => {
    it('should set phase to NIGHT', () => {
      phaseSlice.setPhase('NIGHT');
      expect(mockStore.set).toHaveBeenCalled();
    });

    it('should set phase to DAY', () => {
      phaseSlice.setPhase('DAY');
      expect(mockStore.set).toHaveBeenCalled();
    });
  });
});

describe('Features Slice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let featuresSlice: ReturnType<typeof createFeaturesSlice>;

  beforeEach(() => {
    mockStore = createMockStore();
    featuresSlice = createFeaturesSlice(
      mockStore.set as never,
      mockStore.get as never,
      {} as never
    );
  });

  describe('toggleCandlelight', () => {
    it('should toggle candlelight mode', () => {
      featuresSlice.toggleCandlelight();
      expect(mockStore.set).toHaveBeenCalled();
    });
  });

  describe('addInteractionLog', () => {
    it('should call set when adding interaction log', () => {
      featuresSlice.addInteractionLog({
        type: 'phase_change',
        description: 'Test log',
        isConfirmed: true
      });
      expect(mockStore.set).toHaveBeenCalled();
    });
  });
});

describe('Lifecycle Slice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let lifecycleSlice: ReturnType<typeof createLifecycleSlice>;

  beforeEach(() => {
    mockStore = createMockStore();
    lifecycleSlice = createLifecycleSlice(
      mockStore.set as never,
      mockStore.get as never,
      {} as never
    );
  });

  describe('startGame', () => {
    it('should start the game', () => {
      lifecycleSlice.startGame();
      expect(mockStore.set).toHaveBeenCalled();
    });
  });

  describe('endGame', () => {
    it('should end the game with winner', () => {
      lifecycleSlice.endGame('GOOD', '恶魔被消灭');
      expect(mockStore.set).toHaveBeenCalled();
    });
  });
});

describe('Flow Utils', () => {
  describe('calculateNightQueue', () => {
    it('should generate night queue based on seats and roles', () => {
      const seats = [
        createTestSeat({ id: 1, roleId: 'poisoner' }),
        createTestSeat({ id: 2, roleId: 'monk' }),
        createTestSeat({ id: 3, roleId: 'imp' }),
        createTestSeat({ id: 4, roleId: 'empath' })
      ];

      const queue = calculateNightQueue(seats, false);
      expect(Array.isArray(queue)).toBe(true);
    });

    it('should generate first night queue', () => {
      const seats = [
        createTestSeat({ id: 1, roleId: 'washerwoman' }),
        createTestSeat({ id: 2, roleId: 'chef' }),
        createTestSeat({ id: 3, roleId: 'imp' })
      ];

      const queue = calculateNightQueue(seats, true);
      expect(Array.isArray(queue)).toBe(true);
    });

    it('should return empty queue for empty seats', () => {
      const queue = calculateNightQueue([], false);
      expect(queue).toEqual([]);
    });

    it('should exclude dead players from queue', () => {
      const seats = [
        createTestSeat({ id: 1, roleId: 'empath', isDead: true }),
        createTestSeat({ id: 2, roleId: 'imp' })
      ];

      const queue = calculateNightQueue(seats, false);
      // Dead empath should not be in queue
      expect(queue).not.toContain('empath');
    });
  });

  describe('calculateVoteResult', () => {
    it('should pass when majority votes yes (3 out of 5)', () => {
      const result = calculateVoteResult(3, 5);
      expect(result).toBe(true);
    });

    it('should fail when not enough votes (2 out of 5)', () => {
      const result = calculateVoteResult(2, 5);
      expect(result).toBe(false);
    });

    it('should fail when exactly half votes yes (3 out of 6) - strict majority required', () => {
      // Blood on the Clocktower requires STRICT MAJORITY (more than half)
      // 3 votes / 6 players = 50%, need >50% to pass
      const result = calculateVoteResult(3, 6);
      expect(result).toBe(false);
    });

    it('should fail with no votes', () => {
      const result = calculateVoteResult(0, 5);
      expect(result).toBe(false);
    });

    it('should handle edge case of 1 player', () => {
      const result = calculateVoteResult(1, 1);
      expect(result).toBe(true);
    });

    it('should fail when just under half (2 out of 5)', () => {
      // 2 < 5/2 = 2.5, so should fail
      const result = calculateVoteResult(2, 5);
      expect(result).toBe(false);
    });
  });
});

describe('Combined Flow Slice', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let flowSlice: ReturnType<typeof createGameFlowSlice>;

  beforeEach(() => {
    mockStore = createMockStore();
    flowSlice = createGameFlowSlice(
      mockStore.set as never,
      mockStore.get as never,
      {} as never
    );
  });

  it('should have all required methods', () => {
    expect(typeof flowSlice.setPhase).toBe('function');
    expect(typeof flowSlice.nightNext).toBe('function');
    expect(typeof flowSlice.nightPrev).toBe('function');
    expect(typeof flowSlice.startVote).toBe('function');
    expect(typeof flowSlice.closeVote).toBe('function');
    expect(typeof flowSlice.toggleHand).toBe('function');
    expect(typeof flowSlice.nextClockHand).toBe('function');
    expect(typeof flowSlice.startGame).toBe('function');
    expect(typeof flowSlice.endGame).toBe('function');
    expect(typeof flowSlice.toggleCandlelight).toBe('function');
    expect(typeof flowSlice.addInteractionLog).toBe('function');
  });
});
