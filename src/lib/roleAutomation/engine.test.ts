/**
 * Role Automation Engine Tests
 *
 * 角色自动化引擎测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RoleAutomationEngine, getAutomationEngine, resetAutomationEngine } from './engine';
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

// 创建测试用的游戏状态
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
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
    seats: [],
    nightQueue: [],
    nightCurrentIndex: 0,
    alivePlayers: [],
    deadPlayers: [],
    messages: [],
    interactionLogs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

describe('RoleAutomationEngine', () => {
  let engine: RoleAutomationEngine;

  beforeEach(() => {
    resetAutomationEngine();
    engine = new RoleAutomationEngine();
  });

  describe('初始化', () => {
    it('应该使用默认配置初始化', () => {
      const config = engine.getConfig();
      expect(config.level).toBe('GUIDED');
      expect(config.enableRuleChecks).toBe(true);
      expect(config.autoApplyStatusChanges).toBe(true);
      expect(config.autoProcessDeaths).toBe(false);
    });

    it('应该可以使用自定义配置初始化', () => {
      const customEngine = new RoleAutomationEngine({
        level: 'FULL_AUTO',
        enableRuleChecks: false
      });
      const config = customEngine.getConfig();
      expect(config.level).toBe('FULL_AUTO');
      expect(config.enableRuleChecks).toBe(false);
    });
  });

  describe('自动化级别', () => {
    it('应该可以获取当前自动化级别', () => {
      expect(engine.getAutomationLevel()).toBe('GUIDED');
    });

    it('应该可以设置自动化级别', () => {
      engine.setAutomationLevel('FULL_AUTO');
      expect(engine.getAutomationLevel()).toBe('FULL_AUTO');

      engine.setAutomationLevel('MANUAL');
      expect(engine.getAutomationLevel()).toBe('MANUAL');
    });
  });

  describe('配置更新', () => {
    it('应该可以更新配置', () => {
      engine.updateConfig({
        level: 'MANUAL',
        autoProcessDeaths: true
      });
      const config = engine.getConfig();
      expect(config.level).toBe('MANUAL');
      expect(config.autoProcessDeaths).toBe(true);
      // 其他配置应保持不变
      expect(config.enableRuleChecks).toBe(true);
    });
  });

  describe('待处理项管理', () => {
    it('应该可以获取和清除待处理建议', () => {
      // 初始状态应该没有待处理建议
      expect(engine.getPendingSuggestions()).toEqual([]);

      // 清除操作不应报错
      engine.clearPending();
      expect(engine.getPendingSuggestions()).toEqual([]);
    });

    it('应该可以获取和清除待处理死亡事件', () => {
      expect(engine.getPendingDeaths()).toEqual([]);
      engine.clearPending();
      expect(engine.getPendingDeaths()).toEqual([]);
    });

    it('应该可以获取和清除待处理状态变更', () => {
      expect(engine.getPendingStatusChanges()).toEqual([]);
      engine.clearPending();
      expect(engine.getPendingStatusChanges()).toEqual([]);
    });

    it('应该可以获取和清除待处理连锁反应', () => {
      expect(engine.getPendingChainReactions()).toEqual([]);
      engine.clearPending();
      expect(engine.getPendingChainReactions()).toEqual([]);
    });
  });

  describe('状态变更应用', () => {
    it('应该可以应用添加状态变更', () => {
      const seats = [createTestSeat({ id: 1, statuses: [] })];

      // 手动添加状态变更
      const updatedSeats = engine.applyStatusChanges(seats);

      // 没有待处理的变更，应该返回相同的座位
      expect(updatedSeats).toEqual(seats);
    });
  });

  describe('死亡应用', () => {
    it('应该可以应用死亡事件', () => {
      const seats = [
        createTestSeat({ id: 1, isDead: false }),
        createTestSeat({ id: 2, isDead: false })
      ];

      // 没有待处理的死亡，应该返回相同的座位
      const { seats: updatedSeats, deadSeats } = engine.applyDeaths(seats);
      expect(updatedSeats).toEqual(seats);
      expect(deadSeats).toEqual([]);
    });
  });

  describe('游戏结束条件检查', () => {
    it('应该检测恶魔死亡时好人获胜', () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({ id: 1, userId: 'user1', realRoleId: 'washerwoman', isDead: false }),
          createTestSeat({ id: 2, userId: 'user2', realRoleId: 'empath', isDead: false }),
          createTestSeat({ id: 3, userId: 'user3', realRoleId: 'imp', isDead: true })
        ]
      });

      const result = engine.checkGameEndConditions(gameState);
      expect(result.shouldEnd).toBe(true);
      expect(result.winner).toBe('GOOD');
      expect(result.reason).toBe('恶魔被消灭');
    });

    it('应该检测只剩2人且恶魔存活时邪恶获胜', () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({ id: 1, userId: 'user1', realRoleId: 'imp', isDead: false }),
          createTestSeat({ id: 2, userId: 'user2', realRoleId: 'washerwoman', isDead: false }),
          createTestSeat({ id: 3, userId: 'user3', realRoleId: 'empath', isDead: true })
        ]
      });

      const result = engine.checkGameEndConditions(gameState);
      expect(result.shouldEnd).toBe(true);
      expect(result.winner).toBe('EVIL');
    });

    it('应该在猩红女郎存活且人数>=5时不判定好人胜利', () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({ id: 1, userId: 'user1', realRoleId: 'washerwoman', isDead: false }),
          createTestSeat({ id: 2, userId: 'user2', realRoleId: 'empath', isDead: false }),
          createTestSeat({ id: 3, userId: 'user3', realRoleId: 'chef', isDead: false }),
          createTestSeat({ id: 4, userId: 'user4', realRoleId: 'monk', isDead: false }),
          createTestSeat({ id: 5, userId: 'user5', realRoleId: 'scarlet_woman', isDead: false }),
          createTestSeat({ id: 6, userId: 'user6', realRoleId: 'imp', isDead: true })
        ]
      });

      const result = engine.checkGameEndConditions(gameState);
      // 猩红女郎存活且人数>=5，不应该结束
      expect(result.shouldEnd).toBe(false);
    });

    it('应该在游戏继续时返回不结束', () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({ id: 1, userId: 'user1', realRoleId: 'washerwoman', isDead: false }),
          createTestSeat({ id: 2, userId: 'user2', realRoleId: 'empath', isDead: false }),
          createTestSeat({ id: 3, userId: 'user3', realRoleId: 'chef', isDead: false }),
          createTestSeat({ id: 4, userId: 'user4', realRoleId: 'imp', isDead: false }),
          createTestSeat({ id: 5, userId: 'user5', realRoleId: 'poisoner', isDead: false })
        ]
      });

      const result = engine.checkGameEndConditions(gameState);
      expect(result.shouldEnd).toBe(false);
    });
  });

  describe('单例模式', () => {
    it('getAutomationEngine应该返回单例', () => {
      const engine1 = getAutomationEngine();
      const engine2 = getAutomationEngine();
      expect(engine1).toBe(engine2);
    });

    it('resetAutomationEngine应该重置单例', () => {
      const engine1 = getAutomationEngine();
      resetAutomationEngine();
      const engine2 = getAutomationEngine();
      expect(engine1).not.toBe(engine2);
    });
  });
});

describe('Role Processing', () => {
  let engine: RoleAutomationEngine;

  beforeEach(() => {
    resetAutomationEngine();
    engine = new RoleAutomationEngine({ level: 'FULL_AUTO' });
  });

  describe('厨师 (Chef)', () => {
    it('应该计算邪恶玩家相邻对数', () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({ id: 1, userId: 'user1', realRoleId: 'chef', isDead: false }),
          createTestSeat({ id: 2, userId: 'user2', realRoleId: 'imp', isDead: false }),
          createTestSeat({ id: 3, userId: 'user3', realRoleId: 'poisoner', isDead: false }),
          createTestSeat({ id: 4, userId: 'user4', realRoleId: 'washerwoman', isDead: false })
        ],
        nightQueue: ['chef']
      });

      const result = engine.processRoleAbility(gameState, 1, 'chef', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      });

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]?.roleId).toBe('chef');
    });
  });

  describe('共情者 (Empath)', () => {
    it('应该计算邻居中的邪恶玩家数', () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({ id: 1, userId: 'user1', realRoleId: 'empath', isDead: false }),
          createTestSeat({ id: 2, userId: 'user2', realRoleId: 'imp', isDead: false }),
          createTestSeat({ id: 3, userId: 'user3', realRoleId: 'washerwoman', isDead: false })
        ],
        nightQueue: ['empath']
      });

      const result = engine.processRoleAbility(gameState, 1, 'empath', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      });

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]?.roleId).toBe('empath');
    });
  });

  describe('投毒者 (Poisoner)', () => {
    it('应该在没有选择目标时返回选择建议', () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({ id: 1, userId: 'user1', realRoleId: 'poisoner', isDead: false }),
          createTestSeat({ id: 2, userId: 'user2', realRoleId: 'washerwoman', isDead: false }),
          createTestSeat({ id: 3, userId: 'user3', realRoleId: 'empath', isDead: false })
        ],
        nightQueue: ['poisoner']
      });

      const result = engine.processRoleAbility(gameState, 1, 'poisoner', {
        automationLevel: 'GUIDED',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      });

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0]?.type).toBe('action');
    });

    it('应该在选择目标后应用中毒状态', () => {
      const gameState = createTestGameState({
        seats: [
          createTestSeat({ id: 1, userId: 'user1', realRoleId: 'poisoner', isDead: false }),
          createTestSeat({ id: 2, userId: 'user2', realRoleId: 'washerwoman', isDead: false })
        ],
        nightQueue: ['poisoner']
      });

      const result = engine.processRoleAbility(gameState, 1, 'poisoner', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0,
        targetSeatIds: [2]
      });

      expect(result.success).toBe(true);
      expect(result.statusChanges).toBeDefined();
      expect(result.statusChanges?.length).toBe(1);
      expect(result.statusChanges?.[0]?.status).toBe('POISONED');
      expect(result.statusChanges?.[0]?.seatId).toBe(2);
    });
  });

  describe('不支持的剧本', () => {
    it('应该对不支持的剧本返回错误', () => {
      const gameState = createTestGameState({
        currentScriptId: 'unsupported_script',
        seats: [createTestSeat({ id: 1, userId: 'user1', realRoleId: 'chef' })]
      });

      const result = engine.processRoleAbility(gameState, 1, 'chef', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('不支持的剧本');
    });
  });
});
