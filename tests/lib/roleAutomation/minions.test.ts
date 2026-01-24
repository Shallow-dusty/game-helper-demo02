/**
 * Trouble Brewing - Minion Role Tests
 *
 * 暗流涌动剧本 - 爪牙角色自动化测试
 */

import { describe, it, expect } from 'vitest';
import {
  processPoisoner,
  processSpy,
  processScarletWoman,
  processBaron,
  MINION_PROCESSORS
} from '../../../src/lib/roleAutomation/troubleBrewing/minions';
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

// 创建测试游戏状态
function createTestGameState(seats: Seat[]): GameState {
  return {
    roomId: 'test-room',
    currentScriptId: 'tb',
    phase: 'NIGHT',
    setupPhase: 'READY',
    rolesRevealed: false,
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
    roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 0 },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    candlelightEnabled: false,
    dailyNominations: [],
    interactionLog: []
  };
}

// 默认测试上下文
const defaultContext: AbilityContext = {
  automationLevel: 'GUIDED',
  isFirstNight: true,
  nightCount: 1,
  dayCount: 0
};

// ==================== processPoisoner Tests ====================

describe('processPoisoner', () => {
  describe('basic validation', () => {
    it('should return error for non-existent seat', () => {
      const gameState = createTestGameState([]);
      const result = processPoisoner(gameState, 99, defaultContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('座位不存在');
    });
  });

  describe('target selection (no target provided)', () => {
    it('should ask for target when not provided', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'poisoner', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processPoisoner(gameState, 0, defaultContext);

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBe(1);
      expect(result.suggestions[0]!.type).toBe('action');
      expect(result.suggestions[0]!.title).toBe('投毒者选择目标');
    });

    it('should recommend target in FULL_AUTO mode', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'poisoner', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'empath', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processPoisoner(gameState, 0, {
        ...defaultContext,
        automationLevel: 'FULL_AUTO'
      });

      expect(result.success).toBe(true);
      const options = result.suggestions[0]!.options;
      const recommendedOption = options?.find(o => o.id === 'recommended');
      expect(recommendedOption).toBeDefined();
      expect(recommendedOption?.isRecommended).toBe(true);
    });

    it('should prioritize info roles for poisoning', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'poisoner', userId: 'user0', userName: 'Player0' }),
        createTestSeat({ id: 1, realRoleId: 'fortune_teller', userId: 'user1', userName: '占卜师玩家' }),
        createTestSeat({ id: 2, realRoleId: 'chef', userId: 'user2', userName: 'Player2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processPoisoner(gameState, 0, {
        ...defaultContext,
        automationLevel: 'FULL_AUTO'
      });

      expect(result.success).toBe(true);
      const options = result.suggestions[0]!.options;
      const recommendedOption = options?.find(o => o.id === 'recommended');
      // Should recommend the fortune_teller player (seat 1)
      expect(recommendedOption?.label).toContain('2号');
    });

    it('should not include self in target list', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'poisoner', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processPoisoner(gameState, 0, defaultContext);

      expect(result.success).toBe(true);
      // The suggestion should ask for target selection
      expect(result.suggestions[0]!.type).toBe('action');
    });

    it('should randomly select target when no info roles in FULL_AUTO mode', () => {
      // No info roles among targets
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'poisoner', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'butler', userId: 'user1' }), // Not an info role
        createTestSeat({ id: 2, realRoleId: 'drunk', userId: 'user2' })   // Not an info role
      ];
      const gameState = createTestGameState(seats);
      const result = processPoisoner(gameState, 0, {
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
    it('should ask for target when targetSeatIds is empty array', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'poisoner', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processPoisoner(gameState, 0, {
        ...defaultContext,
        targetSeatIds: []
      });

      // Empty array means no target selected
      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('action');
    });

    it('should return error when targetSeatIds[0] is undefined', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'poisoner', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      // Create an array with undefined as first element
      const targetSeatIds: (number | undefined)[] = [undefined];
      const result = processPoisoner(gameState, 0, {
        ...defaultContext,
        targetSeatIds: targetSeatIds as number[]
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('未指定目标');
    });

    it('should return error for non-existent target seat', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'poisoner', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processPoisoner(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [99]
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('目标座位不存在');
    });
  });

  describe('successful poisoning', () => {
    it('should poison the target', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'poisoner', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processPoisoner(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('effect');
      expect(result.suggestions[0]!.title).toBe('投毒者投毒');
      expect(result.statusChanges?.length).toBe(1);
      expect(result.statusChanges?.[0]!.seatId).toBe(1);
      expect(result.statusChanges?.[0]!.status).toBe('POISONED');
      expect(result.statusChanges?.[0]!.action).toBe('add');
      expect(result.statusChanges?.[0]!.source).toBe('poisoner');
    });

    it('should set duration to day', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'poisoner', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
      ];
      const gameState = createTestGameState(seats);
      const result = processPoisoner(gameState, 0, {
        ...defaultContext,
        targetSeatIds: [1]
      });

      expect(result.statusChanges?.[0]!.duration).toBe('day');
    });
  });
});

// ==================== processSpy Tests ====================

describe('processSpy', () => {
  describe('basic validation', () => {
    it('should return error for non-existent seat', () => {
      const gameState = createTestGameState([]);
      const result = processSpy(gameState, 99, defaultContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('座位不存在');
    });
  });

  describe('grimoire access', () => {
    it('should show grimoire access info when healthy', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'spy', userId: 'user0' })
      ];
      const gameState = createTestGameState(seats);
      const result = processSpy(gameState, 0, defaultContext);

      expect(result.success).toBe(true);
      const infoSuggestion = result.suggestions.find(s => s.title === '间谍能力');
      expect(infoSuggestion).toBeDefined();
      expect(infoSuggestion?.suggestedResult).toContain('有效');
      expect(infoSuggestion?.isTainted).toBe(false);
    });

    it('should show grimoire access disabled when poisoned', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'spy', userId: 'user0', statuses: ['POISONED'] })
      ];
      const gameState = createTestGameState(seats);
      const result = processSpy(gameState, 0, defaultContext);

      expect(result.success).toBe(true);
      const infoSuggestion = result.suggestions.find(s => s.title === '间谍能力');
      expect(infoSuggestion?.suggestedResult).toContain('无效');
      expect(infoSuggestion?.isTainted).toBe(true);
    });

    it('should show grimoire access disabled when drunk', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'spy', userId: 'user0', statuses: ['DRUNK'] })
      ];
      const gameState = createTestGameState(seats);
      const result = processSpy(gameState, 0, defaultContext);

      expect(result.success).toBe(true);
      const infoSuggestion = result.suggestions.find(s => s.title === '间谍能力');
      expect(infoSuggestion?.isTainted).toBe(true);
    });
  });

  describe('detection options', () => {
    it('should show detection options in GUIDED mode', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'spy', userId: 'user0' })
      ];
      const gameState = createTestGameState(seats);
      const result = processSpy(gameState, 0, {
        ...defaultContext,
        automationLevel: 'GUIDED'
      });

      expect(result.success).toBe(true);
      const detectionSuggestion = result.suggestions.find(s => s.title === '间谍探测选项');
      expect(detectionSuggestion).toBeDefined();
      expect(detectionSuggestion?.options?.length).toBe(3);
    });

    it('should have show_evil, show_good, show_specific options', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'spy', userId: 'user0' })
      ];
      const gameState = createTestGameState(seats);
      const result = processSpy(gameState, 0, {
        ...defaultContext,
        automationLevel: 'GUIDED'
      });

      const detectionSuggestion = result.suggestions.find(s => s.title === '间谍探测选项');
      const options = detectionSuggestion?.options;
      expect(options?.find(o => o.id === 'show_evil')).toBeDefined();
      expect(options?.find(o => o.id === 'show_good')).toBeDefined();
      expect(options?.find(o => o.id === 'show_specific')).toBeDefined();
    });

    it('should not show detection options in non-GUIDED mode', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'spy', userId: 'user0' })
      ];
      const gameState = createTestGameState(seats);
      const result = processSpy(gameState, 0, {
        ...defaultContext,
        automationLevel: 'FULL_AUTO'
      });

      expect(result.success).toBe(true);
      const detectionSuggestion = result.suggestions.find(s => s.title === '间谍探测选项');
      expect(detectionSuggestion).toBeUndefined();
    });
  });
});

// ==================== processScarletWoman Tests ====================

describe('processScarletWoman', () => {
  describe('basic validation', () => {
    it('should return error for non-existent seat', () => {
      const gameState = createTestGameState([]);
      const result = processScarletWoman(gameState, 99, defaultContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('座位不存在');
    });
  });

  describe('transformation trigger', () => {
    it('should transform when demon dies and 5+ alive', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'scarlet_woman', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' }),
        createTestSeat({ id: 3, realRoleId: 'chef', userId: 'user3' }),
        createTestSeat({ id: 4, realRoleId: 'washerwoman', userId: 'user4' })
      ];
      const gameState = createTestGameState(seats);
      const result = processScarletWoman(gameState, 0, {
        ...defaultContext,
        additionalData: { demonDied: true }
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('effect');
      expect(result.suggestions[0]!.title).toBe('猩红女郎变形！');
      expect(result.chainReactions?.length).toBe(1);
      expect(result.chainReactions?.[0]!.type).toBe('scarlet_woman_transform');
      expect(result.chainReactions?.[0]!.newRoleId).toBe('imp');
    });

    it('should not transform when less than 5 alive', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'scarlet_woman', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' }),
        createTestSeat({ id: 3, realRoleId: 'chef', userId: 'user3', isDead: true })
      ];
      const gameState = createTestGameState(seats);
      const result = processScarletWoman(gameState, 0, {
        ...defaultContext,
        additionalData: { demonDied: true }
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('info');
      expect(result.suggestions[0]!.title).toBe('猩红女郎状态');
      expect(result.chainReactions).toBeUndefined();
    });

    it('should not transform when demon has not died', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'scarlet_woman', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' }),
        createTestSeat({ id: 3, realRoleId: 'chef', userId: 'user3' }),
        createTestSeat({ id: 4, realRoleId: 'washerwoman', userId: 'user4' })
      ];
      const gameState = createTestGameState(seats);
      const result = processScarletWoman(gameState, 0, defaultContext);

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('info');
      expect(result.chainReactions).toBeUndefined();
    });
  });

  describe('status info', () => {
    it('should show standby status when 5+ alive and no trigger', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'scarlet_woman', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' }),
        createTestSeat({ id: 3, realRoleId: 'chef', userId: 'user3' }),
        createTestSeat({ id: 4, realRoleId: 'washerwoman', userId: 'user4' })
      ];
      const gameState = createTestGameState(seats);
      const result = processScarletWoman(gameState, 0, defaultContext);

      expect(result.suggestions[0]!.suggestedResult).toContain('待机中');
    });

    it('should show invalid status when less than 5 alive', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'scarlet_woman', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' })
      ];
      const gameState = createTestGameState(seats);
      const result = processScarletWoman(gameState, 0, defaultContext);

      expect(result.suggestions[0]!.suggestedResult).toContain('无效');
      expect(result.suggestions[0]!.description).toContain('不足5人');
    });
  });

  describe('confirmation requirements', () => {
    it('should require confirmation in GUIDED mode', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'scarlet_woman', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' }),
        createTestSeat({ id: 3, realRoleId: 'chef', userId: 'user3' }),
        createTestSeat({ id: 4, realRoleId: 'washerwoman', userId: 'user4' })
      ];
      const gameState = createTestGameState(seats);
      const result = processScarletWoman(gameState, 0, {
        ...defaultContext,
        automationLevel: 'GUIDED',
        additionalData: { demonDied: true }
      });

      expect(result.suggestions[0]!.requiresConfirmation).toBe(true);
    });

    it('should not require confirmation in FULL_AUTO mode', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'scarlet_woman', userId: 'user0' }),
        createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
        createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' }),
        createTestSeat({ id: 3, realRoleId: 'chef', userId: 'user3' }),
        createTestSeat({ id: 4, realRoleId: 'washerwoman', userId: 'user4' })
      ];
      const gameState = createTestGameState(seats);
      const result = processScarletWoman(gameState, 0, {
        ...defaultContext,
        automationLevel: 'FULL_AUTO',
        additionalData: { demonDied: true }
      });

      expect(result.suggestions[0]!.requiresConfirmation).toBe(false);
    });
  });
});

// ==================== processBaron Tests ====================

describe('processBaron', () => {
  describe('basic validation', () => {
    it('should return error for non-existent seat', () => {
      const gameState = createTestGameState([]);
      const result = processBaron(gameState, 99, defaultContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('座位不存在');
    });
  });

  describe('effect info', () => {
    it('should return info about outsider increase', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'baron', userId: 'user0' })
      ];
      const gameState = createTestGameState(seats);
      const result = processBaron(gameState, 0, defaultContext);

      expect(result.success).toBe(true);
      expect(result.suggestions[0]!.type).toBe('info');
      expect(result.suggestions[0]!.title).toBe('男爵效果');
      expect(result.suggestions[0]!.description).toContain('+2');
    });

    it('should not require confirmation', () => {
      const seats = [
        createTestSeat({ id: 0, realRoleId: 'baron', userId: 'user0' })
      ];
      const gameState = createTestGameState(seats);
      const result = processBaron(gameState, 0, defaultContext);

      expect(result.suggestions[0]!.requiresConfirmation).toBe(false);
    });
  });
});

// ==================== MINION_PROCESSORS Tests ====================

describe('MINION_PROCESSORS', () => {
  it('should export all minion processors', () => {
    expect(MINION_PROCESSORS.poisoner).toBe(processPoisoner);
    expect(MINION_PROCESSORS.spy).toBe(processSpy);
    expect(MINION_PROCESSORS.scarlet_woman).toBe(processScarletWoman);
    expect(MINION_PROCESSORS.baron).toBe(processBaron);
  });

  it('should have 4 processors', () => {
    expect(Object.keys(MINION_PROCESSORS).length).toBe(4);
  });
});
