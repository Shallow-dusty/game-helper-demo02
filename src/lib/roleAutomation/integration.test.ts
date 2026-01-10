/**
 * Role Automation Integration Tests
 *
 * 角色联动集成测试 - 测试多角色之间的交互
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RoleAutomationEngine, resetAutomationEngine } from './engine';
import type { GameState, Seat } from '../../types';

// 创建测试用的座位数据
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
    ...overrides
  };
}

// 创建完整的测试游戏状态
function createFullGameState(playerCount: number, customSeats?: Partial<Seat>[]): GameState {
  const defaultRoles = [
    'washerwoman', 'librarian', 'investigator', 'chef', 'empath',
    'fortune_teller', 'undertaker', 'monk', 'slayer', 'soldier',
    'butler', 'drunk', 'poisoner', 'imp'
  ];

  const seats: Seat[] = [];
  for (let i = 0; i < playerCount; i++) {
    const customSeat = customSeats?.[i] ?? {};
    seats.push(createTestSeat({
      id: i + 1,
      index: i,
      userId: `user${i + 1}`,
      realRoleId: defaultRoles[i % defaultRoles.length],
      ...customSeat
    }));
  }

  return {
    id: 'test-game-id',
    roomId: 'test-room-id',
    hostId: 'test-host-id',
    isActive: true,
    currentPhase: 'NIGHT',
    currentScriptId: 'tb',
    roundInfo: {
      dayCount: 1,
      nightCount: 1,
      nominations: [],
      executions: [],
      currentNomination: null
    },
    seats,
    nightQueue: ['poisoner', 'monk', 'imp', 'washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller'],
    nightCurrentIndex: 0,
    alivePlayers: seats.filter(s => !s.isDead).map(s => s.id),
    deadPlayers: seats.filter(s => s.isDead).map(s => s.id),
    messages: [],
    interactionLogs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

describe('角色联动测试', () => {
  let engine: RoleAutomationEngine;

  beforeEach(() => {
    resetAutomationEngine();
    engine = new RoleAutomationEngine({ level: 'FULL_AUTO' });
  });

  describe('投毒者 + 信息角色联动', () => {
    it('被投毒的共情者应该获得假信息', () => {
      const gameState = createFullGameState(8, [
        { id: 1, realRoleId: 'empath', statuses: ['POISONED'] },
        { id: 2, realRoleId: 'imp' },
        { id: 3, realRoleId: 'washerwoman' },
        { id: 4, realRoleId: 'poisoner' },
        { id: 5, realRoleId: 'chef' },
        { id: 6, realRoleId: 'monk' },
        { id: 7, realRoleId: 'soldier' },
        { id: 8, realRoleId: 'butler' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'empath', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]?.isTainted).toBe(true);
      // 中毒时 suggestedResult 和 realResult 应该不同
      expect(result.suggestions[0]?.suggestedResult).not.toBe(result.suggestions[0]?.realResult);
    });

    it('被投毒的厨师应该获得错误的邪恶玩家相邻数', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'chef', statuses: ['POISONED'] },
        { id: 2, realRoleId: 'imp' },
        { id: 3, realRoleId: 'poisoner' }, // 与imp相邻
        { id: 4, realRoleId: 'washerwoman' },
        { id: 5, realRoleId: 'empath' },
        { id: 6, realRoleId: 'soldier' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'chef', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]?.isTainted).toBe(true);
    });

    it('被投毒的占卜师查验结果不可靠', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'fortune_teller', statuses: ['POISONED'] },
        { id: 2, realRoleId: 'imp' },
        { id: 3, realRoleId: 'washerwoman' },
        { id: 4, realRoleId: 'poisoner' },
        { id: 5, realRoleId: 'empath' },
        { id: 6, realRoleId: 'soldier' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'fortune_teller', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0,
        targetSeatIds: [2, 3] // 查验恶魔和镇民
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]?.isTainted).toBe(true);
    });
  });

  describe('僧侣 + 小恶魔联动', () => {
    it('被僧侣保护的玩家应该添加PROTECTED状态', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'monk' },
        { id: 2, realRoleId: 'imp' },
        { id: 3, realRoleId: 'washerwoman' },
        { id: 4, realRoleId: 'empath' },
        { id: 5, realRoleId: 'chef' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'monk', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [3] // 保护洗衣妇
      });

      expect(result.success).toBe(true);
      expect(result.statusChanges).toBeDefined();
      expect(result.statusChanges?.length).toBe(1);
      expect(result.statusChanges?.[0]?.status).toBe('PROTECTED');
      expect(result.statusChanges?.[0]?.seatId).toBe(3);
    });

    it('中毒的僧侣保护应该无效', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'monk', statuses: ['POISONED'] },
        { id: 2, realRoleId: 'imp' },
        { id: 3, realRoleId: 'washerwoman' },
        { id: 4, realRoleId: 'empath' },
        { id: 5, realRoleId: 'chef' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'monk', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [3]
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]?.isTainted).toBe(true);
      // 中毒时不应该添加保护状态
      expect(result.statusChanges?.length ?? 0).toBe(0);
    });
  });

  describe('小恶魔击杀逻辑', () => {
    it('小恶魔应该能够击杀普通玩家', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'imp' },
        { id: 2, realRoleId: 'washerwoman' },
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'monk' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'imp', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [2] // 击杀洗衣妇
      });

      expect(result.success).toBe(true);
      expect(result.deaths).toBeDefined();
      expect(result.deaths?.length).toBe(1);
      expect(result.deaths?.[0]?.seatId).toBe(2);
      expect(result.deaths?.[0]?.cause).toBe('demon_kill');
    });

    it('小恶魔击杀士兵应该无效', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'imp' },
        { id: 2, realRoleId: 'soldier' }, // 士兵免疫恶魔击杀
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'monk' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'imp', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [2] // 尝试击杀士兵
      });

      expect(result.success).toBe(true);
      // 士兵免疫，击杀被阻止
      const death = result.deaths?.[0];
      expect(death?.wasPrevented).toBe(true);
      expect(death?.preventedBy).toBe('soldier');
    });

    it('小恶魔自杀应该触发爪牙变形', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'imp' },
        { id: 2, realRoleId: 'scarlet_woman' },
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'monk' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'imp', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [1] // 自杀
      });

      expect(result.success).toBe(true);
      expect(result.chainReactions).toBeDefined();
      expect(result.chainReactions?.length).toBeGreaterThan(0);
      expect(result.chainReactions?.[0]?.type).toBe('imp_transfer');
    });
  });

  describe('猩红女郎变形', () => {
    it('恶魔死亡时猩红女郎应该变形（>=5人存活）', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'scarlet_woman' },
        { id: 2, realRoleId: 'washerwoman' },
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'monk' },
        { id: 6, realRoleId: 'imp', isDead: true }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'scarlet_woman', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        additionalData: { demonDied: true }
      });

      expect(result.success).toBe(true);
      expect(result.chainReactions).toBeDefined();
      expect(result.chainReactions?.[0]?.type).toBe('scarlet_woman_transform');
      expect(result.chainReactions?.[0]?.newRoleId).toBe('imp');
    });

    it('恶魔死亡时猩红女郎不应变形（<5人存活）', () => {
      const gameState = createFullGameState(4, [
        { id: 1, realRoleId: 'scarlet_woman' },
        { id: 2, realRoleId: 'washerwoman' },
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'imp', isDead: true }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'scarlet_woman', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        additionalData: { demonDied: true }
      });

      expect(result.success).toBe(true);
      // 人数不足，不应该变形
      expect(result.chainReactions?.length ?? 0).toBe(0);
    });
  });

  describe('圣女能力', () => {
    it('镇民提名圣女应该导致提名者死亡', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'virgin' },
        { id: 2, realRoleId: 'washerwoman' }, // 镇民提名
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'imp' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'virgin', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 1,
        dayCount: 1,
        additionalData: { nominatorSeatId: 2 }
      });

      expect(result.success).toBe(true);
      expect(result.deaths).toBeDefined();
      expect(result.deaths?.length).toBe(1);
      expect(result.deaths?.[0]?.seatId).toBe(2);
      expect(result.deaths?.[0]?.cause).toBe('ability');
    });

    it('非镇民提名圣女不应触发能力', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'virgin' },
        { id: 2, realRoleId: 'imp' }, // 恶魔提名
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'washerwoman' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'virgin', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 1,
        dayCount: 1,
        additionalData: { nominatorSeatId: 2 }
      });

      expect(result.success).toBe(true);
      expect(result.deaths?.length ?? 0).toBe(0);
    });

    it('中毒的圣女能力无效', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'virgin', statuses: ['POISONED'] },
        { id: 2, realRoleId: 'washerwoman' },
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'imp' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'virgin', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 1,
        dayCount: 1,
        additionalData: { nominatorSeatId: 2 }
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]?.isTainted).toBe(true);
      expect(result.deaths?.length ?? 0).toBe(0);
    });
  });

  describe('杀手能力', () => {
    it('杀手击中恶魔应该导致恶魔死亡', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'slayer' },
        { id: 2, realRoleId: 'imp' },
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'washerwoman' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'slayer', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 1,
        dayCount: 1,
        targetSeatIds: [2]
      });

      expect(result.success).toBe(true);
      expect(result.deaths).toBeDefined();
      expect(result.deaths?.length).toBe(1);
      expect(result.deaths?.[0]?.seatId).toBe(2);
      expect(result.deaths?.[0]?.cause).toBe('slayer');
    });

    it('杀手击中非恶魔不应造成死亡', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'slayer' },
        { id: 2, realRoleId: 'washerwoman' }, // 非恶魔
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'imp' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'slayer', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 1,
        dayCount: 1,
        targetSeatIds: [2]
      });

      expect(result.success).toBe(true);
      expect(result.deaths?.length ?? 0).toBe(0);
    });
  });

  describe('圣徒处决', () => {
    it('圣徒被处决应该导致邪恶获胜', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'saint' },
        { id: 2, realRoleId: 'washerwoman' },
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'imp' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'saint', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 1,
        dayCount: 1,
        additionalData: { isBeingExecuted: true }
      });

      expect(result.success).toBe(true);
      expect(result.gameEndCondition).toBeDefined();
      expect(result.gameEndCondition?.winner).toBe('EVIL');
      expect(result.gameEndCondition?.reason).toBe('圣徒被处决');
    });
  });

  describe('守鸦人能力', () => {
    it('守鸦人死亡时应该获得目标角色信息', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'ravenkeeper', isDead: true },
        { id: 2, realRoleId: 'imp' },
        { id: 3, realRoleId: 'empath' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'washerwoman' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'ravenkeeper', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [2] // 查看恶魔
      });

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]?.type).toBe('info');
    });
  });

  describe('酒鬼状态', () => {
    it('酒鬼应该显示假角色但实际是酒鬼', () => {
      const gameState = createFullGameState(6, [
        { id: 1, realRoleId: 'drunk', seenRoleId: 'empath' }, // 以为自己是共情者
        { id: 2, realRoleId: 'imp' },
        { id: 3, realRoleId: 'washerwoman' },
        { id: 4, realRoleId: 'chef' },
        { id: 5, realRoleId: 'monk' },
        { id: 6, realRoleId: 'poisoner' }
      ]);

      const result = engine.processRoleAbility(gameState, 1, 'drunk', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      });

      expect(result.success).toBe(true);
      expect(result.suggestions[0]?.description).toContain('共情者');
      expect(result.suggestions[0]?.description).toContain('酒鬼');
    });
  });

  describe('夜间全流程', () => {
    it('generateAllNightSuggestions应该处理所有角色', () => {
      const gameState = createFullGameState(8, [
        { id: 1, realRoleId: 'poisoner' },
        { id: 2, realRoleId: 'monk' },
        { id: 3, realRoleId: 'imp' },
        { id: 4, realRoleId: 'empath' },
        { id: 5, realRoleId: 'chef' },
        { id: 6, realRoleId: 'washerwoman' },
        { id: 7, realRoleId: 'soldier' },
        { id: 8, realRoleId: 'butler' }
      ]);
      gameState.nightQueue = ['poisoner', 'monk', 'imp', 'empath', 'chef', 'washerwoman'];

      const result = engine.generateAllNightSuggestions(gameState);

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
      // 应该按优先级排序
      for (let i = 1; i < result.suggestions.length; i++) {
        const prev = result.suggestions[i - 1];
        const curr = result.suggestions[i];
        if (prev && curr) {
          expect(prev.priority).toBeGreaterThanOrEqual(curr.priority);
        }
      }
    });
  });
});

describe('游戏结束条件', () => {
  let engine: RoleAutomationEngine;

  beforeEach(() => {
    resetAutomationEngine();
    engine = new RoleAutomationEngine({ level: 'FULL_AUTO' });
  });

  it('应该在恶魔死亡时判定好人胜利', () => {
    const gameState = createFullGameState(5, [
      { id: 1, realRoleId: 'washerwoman' },
      { id: 2, realRoleId: 'empath' },
      { id: 3, realRoleId: 'chef' },
      { id: 4, realRoleId: 'poisoner' },
      { id: 5, realRoleId: 'imp', isDead: true }
    ]);

    const result = engine.checkGameEndConditions(gameState);
    expect(result.shouldEnd).toBe(true);
    expect(result.winner).toBe('GOOD');
  });

  it('应该在只剩2人且恶魔存活时判定邪恶胜利', () => {
    const gameState = createFullGameState(5, [
      { id: 1, realRoleId: 'washerwoman', isDead: true },
      { id: 2, realRoleId: 'empath', isDead: true },
      { id: 3, realRoleId: 'chef', isDead: true },
      { id: 4, realRoleId: 'soldier' },
      { id: 5, realRoleId: 'imp' }
    ]);

    const result = engine.checkGameEndConditions(gameState);
    expect(result.shouldEnd).toBe(true);
    expect(result.winner).toBe('EVIL');
  });

  it('猩红女郎存活且>=5人时恶魔死亡不应结束游戏', () => {
    const gameState = createFullGameState(6, [
      { id: 1, realRoleId: 'washerwoman' },
      { id: 2, realRoleId: 'empath' },
      { id: 3, realRoleId: 'chef' },
      { id: 4, realRoleId: 'soldier' },
      { id: 5, realRoleId: 'scarlet_woman' },
      { id: 6, realRoleId: 'imp', isDead: true }
    ]);

    const result = engine.checkGameEndConditions(gameState);
    expect(result.shouldEnd).toBe(false);
  });

  it('猩红女郎存活但<5人时恶魔死亡应判定好人胜利', () => {
    const gameState = createFullGameState(4, [
      { id: 1, realRoleId: 'washerwoman' },
      { id: 2, realRoleId: 'empath' },
      { id: 3, realRoleId: 'scarlet_woman' },
      { id: 4, realRoleId: 'imp', isDead: true }
    ]);

    const result = engine.checkGameEndConditions(gameState);
    expect(result.shouldEnd).toBe(true);
    expect(result.winner).toBe('GOOD');
  });
});
