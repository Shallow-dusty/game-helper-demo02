/**
 * Trouble Brewing - Demon Role Tests
 *
 * 暗流涌动剧本 - 恶魔角色自动化测试
 */

import { describe, it, expect } from 'vitest';
import { processImp, DEMON_PROCESSORS } from '../../../src/lib/roleAutomation/troubleBrewing/demons';
import type { GameState, Seat } from '../../../src/types';
import type { AbilityContext } from '../../../src/lib/roleAutomation/types';

// 创建测试座位
function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 0,
    userId: 'user1',
    userName: 'Player1',
    isDead: false,
    hasGhostVote: true,
    roleId: null,  // deprecated
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

// 创建测试游戏状态
function createTestGameState(seats: Seat[]): GameState {
  return {
    roomId: 'test-room',
    currentScriptId: 'tb',
    phase: 'NIGHT',
    setupPhase: 'STARTED',
    rolesRevealed: true,
    allowWhispers: false,
    vibrationEnabled: true,
    seats,
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
    roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 1 },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    candlelightEnabled: false,
    dailyExecutionCompleted: false,
    dailyNominations: [],
    interactionLog: []
  };
}

// 默认测试上下文
const defaultContext: AbilityContext = {
  automationLevel: 'GUIDED',
  isFirstNight: false,
  nightCount: 2,
  dayCount: 1
};

describe('processImp', () => {
  describe('basic validation', () => {
    it('should return error for non-existent seat', () => {
      const gameState = createTestGameState([]);
      const result = processImp(gameState, 99, defaultContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('座位不存在');
    });

    it('should return empty suggestions on first night', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, { ...defaultContext, isFirstNight: true });

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBe(0);
    });
  });

  describe('target selection (no target provided)', () => {
    it('should ask for target when not provided', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, defaultContext);

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBe(1);
      expect(result.suggestions[0]!.type).toBe('action');
      expect(result.suggestions[0]!.title).toBe('小恶魔击杀');
    });

    it('should include self-kill option when minions exist', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'poisoner', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, defaultContext);

      expect(result.success).toBe(true);
      const options = result.suggestions[0]!.options;
      expect(options).toBeDefined();
      const selfKillOption = options?.find(o => o.id === 'self_kill');
      expect(selfKillOption).toBeDefined();
      expect(selfKillOption?.label).toBe('自杀传位');
    });

    it('should not include self-kill option when no minions', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, defaultContext);

      expect(result.success).toBe(true);
      const options = result.suggestions[0]!.options;
      const selfKillOption = options?.find(o => o.id === 'self_kill');
      expect(selfKillOption).toBeUndefined();
    });

    it('should recommend target in FULL_AUTO mode', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'slayer', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        automationLevel: 'FULL_AUTO'
      });

      expect(result.success).toBe(true);
      const options = result.suggestions[0]!.options;
      const recommendedOption = options?.find(o => o.id === 'recommended');
      expect(recommendedOption).toBeDefined();
      expect(recommendedOption?.isRecommended).toBe(true);
    });

    it('should prioritize dangerous roles in FULL_AUTO mode', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0', userName: 'Player0' }),
        createTestSeat({ id: 1, realRoleId: 'fortune_teller', userId: 'user1', userName: '占卜师玩家' }),
        createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2', userName: 'Player2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        automationLevel: 'FULL_AUTO'
      });

      expect(result.success).toBe(true);
      const options = result.suggestions[0]!.options;
      const recommendedOption = options?.find(o => o.id === 'recommended');
      // Should recommend the fortune_teller player (seat 1)
      expect(recommendedOption?.label).toContain('2号');
    });

    it('should handle empty unprotected list in FULL_AUTO mode', () => {
      // All non-imp players are protected
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1', statuses: ['PROTECTED'] }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2', statuses: ['PROTECTED'] })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        automationLevel: 'FULL_AUTO'
      });

      expect(result.success).toBe(true);
      // Should still return action without a recommended option
      expect(result.suggestions[0]!.type).toBe('action');
      const options = result.suggestions[0]!.options;
      // No recommended option when all are protected
      const recommendedOption = options?.find(o => o.id === 'recommended');
      expect(recommendedOption).toBeUndefined();
    });

    it('should randomly select target in FULL_AUTO mode when no dangerous roles', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'butler', userId: 'user1' }), // Not dangerous
        createTestSeat({ id: 2, realRoleId: 'drunk', userId: 'user2' })  // Not dangerous
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        automationLevel: 'FULL_AUTO'
      });

      expect(result.success).toBe(true);
      const options = result.suggestions[0]!.options;
      const recommendedOption = options?.find(o => o.id === 'recommended');
      // Should still have a recommended option (randomly selected)
      expect(recommendedOption).toBeDefined();
    });
  });

  describe('target validation', () => {
    it('should return error when targetSeatIds is empty array', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: []
      });

      // Empty array means no target selected, should ask for target
      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('action');
    });

    it('should return error when targetSeatIds[0] is undefined', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      // Create an array with undefined as first element
      const targetSeatIds: (number | undefined)[] = [undefined];
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: targetSeatIds as number[]
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('未指定目标');
    });

    it('should return error for non-existent target seat', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [99]
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('目标座位不存在');
    });
  });

  describe('normal kill', () => {
    it('should kill unprotected target', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('effect');
      expect(result.suggestions[0]!.title).toBe('小恶魔击杀');
      expect(result.deaths?.length).toBe(1);
      expect(result.deaths![0]!.seatId).toBe(1);
      expect(result.deaths![0]!.cause).toBe('demon_kill');
    });

    it('should trigger ravenkeeper ability when killed', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'ravenkeeper', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBe(2);
      // First suggestion is the kill
      expect(result.suggestions[0]!.type).toBe('effect');
      // Second suggestion is ravenkeeper ability trigger
      expect(result.suggestions[1]!.roleId).toBe('ravenkeeper');
      expect(result.suggestions[1]!.type).toBe('action');
      expect(result.suggestions[1]!.title).toBe('守鸦人能力触发');
    });

    it('should not trigger ravenkeeper ability if tainted', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'ravenkeeper', userId: 'user1', statuses: ['POISONED'] })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBe(1);
      expect(result.suggestions[0]!.type).toBe('effect');
    });
  });

  describe('kill prevention - monk protection', () => {
    it('should be blocked by monk protection', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1', statuses: ['PROTECTED'] })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('effect');
      expect(result.suggestions[0]!.title).toBe('小恶魔击杀被阻止');
      expect(result.suggestions[0]!.description).toContain('僧侣保护');
      expect(result.deaths?.length).toBe(1);
      expect(result.deaths![0]!.wasPrevented).toBe(true);
      expect(result.deaths![0]!.preventedBy).toBe('monk');
    });

    it('should show override option in GUIDED mode', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1', statuses: ['PROTECTED'] })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        automationLevel: 'GUIDED',
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBe(2);
      expect(result.suggestions[1]!.type).toBe('warning');
      expect(result.suggestions[1]!.title).toBe('规则违反选项');
    });

    it('should not show override option in FULL_AUTO mode', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1', statuses: ['PROTECTED'] })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        automationLevel: 'FULL_AUTO',
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBe(1);
    });
  });

  describe('kill prevention - soldier immunity', () => {
    it('should be blocked by soldier immunity', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'soldier', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('effect');
      expect(result.suggestions[0]!.title).toBe('小恶魔击杀被阻止');
      expect(result.suggestions[0]!.description).toContain('士兵免疫');
      expect(result.deaths![0]!.preventedBy).toBe('soldier');
    });

    it('should kill soldier if poisoned', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'soldier', userId: 'user1', statuses: ['POISONED'] })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('effect');
      expect(result.suggestions[0]!.title).toBe('小恶魔击杀');
      expect(result.deaths?.length).toBe(1);
      expect(result.deaths![0]!.wasPrevented).toBeUndefined();
    });

    it('should kill soldier if drunk', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'soldier', userId: 'user1', statuses: ['DRUNK'] })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.title).toBe('小恶魔击杀');
      expect(result.deaths![0]!.wasPrevented).toBeUndefined();
    });
  });

  describe('self-kill (传位)', () => {
    it('should fail self-kill when no minions', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [0]  // Self-kill
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('warning');
      expect(result.suggestions[0]!.title).toBe('自杀传位失败');
    });

    it('should ask for new demon when minions exist', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'poisoner', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'spy', userId: 'user2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [0]  // Self-kill
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('action');
      expect(result.suggestions[0]!.title).toBe('小恶魔自杀传位');
      expect(result.suggestions[0]!.options?.length).toBe(2);  // Two minions
    });

    it('should auto-select first minion in FULL_AUTO mode', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'poisoner', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'spy', userId: 'user2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        automationLevel: 'FULL_AUTO',
        targetSeatIds: [0]  // Self-kill
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('effect');
      expect(result.suggestions[0]!.title).toBe('小恶魔自杀传位');
      expect(result.deaths?.length).toBe(1);
      expect(result.chainReactions?.length).toBe(1);
      expect(result.chainReactions![0]!.type).toBe('imp_transfer');
    });

    it('should complete self-kill with specified new demon', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'poisoner', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [0],  // Self-kill
        additionalData: { newDemonSeatId: 1 }
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('effect');
      expect(result.deaths?.length).toBe(1);
      expect(result.deaths![0]!.seatId).toBe(0);
      expect(result.chainReactions![0]!.targetSeatId).toBe(1);
      expect(result.chainReactions![0]!.newRoleId).toBe('imp');
    });

    it('should return error for invalid new demon seat', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'poisoner', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processImp(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [0],
        additionalData: { newDemonSeatId: 99 }
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('目标座位不存在');
    });
  });
});

describe('DEMON_PROCESSORS', () => {
  it('should export imp processor', () => {
    expect(DEMON_PROCESSORS.imp).toBe(processImp);
  });
});
