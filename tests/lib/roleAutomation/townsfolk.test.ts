/**
 * Trouble Brewing - Townsfolk Role Tests
 *
 * 暗流涌动剧本 - 镇民角色自动化测试
 */

import { describe, it, expect } from 'vitest';
import {
  processWasherwoman,
  processLibrarian,
  processInvestigator,
  processChef,
  processEmpath,
  processFortuneTeller,
  processUndertaker,
  processMonk,
  processRavenkeeper,
  processVirgin,
  processSlayer,
  processSoldier,
  processMayor
} from '../../../src/lib/roleAutomation/troubleBrewing/townsfolk';
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
  isFirstNight: true,
  nightCount: 1,
  dayCount: 0
};

describe('processWasherwoman', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processWasherwoman(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should return info suggestion for valid seat', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'washerwoman', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processWasherwoman(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0]!.roleId).toBe('washerwoman');
    expect(result.suggestions[0]!.type).toBe('info');
    expect(result.suggestions[0]!.title).toBe('洗衣妇信息');
  });

  it('should return no townsfolk message when none available', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'washerwoman', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'poisoner', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processWasherwoman(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.suggestedResult).toBe('无法获取信息');
  });

  it('should mark as tainted when poisoned', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'washerwoman', userId: 'user0', statuses: ['POISONED'] }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processWasherwoman(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.isTainted).toBe(true);
    expect(result.suggestions[0]!.description).toContain('中毒');
  });
});

describe('processLibrarian', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processLibrarian(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should return no outsiders message when none exist', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'librarian', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processLibrarian(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.suggestedResult).toContain('没有外来者');
  });

  it('should return outsider info when outsiders exist', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'librarian', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'drunk', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processLibrarian(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.roleId).toBe('librarian');
    // Should mention someone is an outsider (酒鬼)
    expect(result.suggestions[0]!.suggestedResult).toContain('酒鬼');
  });

  it('should give fake info when tainted', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'librarian', userId: 'user0', statuses: ['DRUNK'] }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processLibrarian(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.isTainted).toBe(true);
  });
});

describe('processInvestigator', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processInvestigator(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should return minion info when minions exist', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'investigator', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'poisoner', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processInvestigator(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.roleId).toBe('investigator');
    expect(result.suggestions[0]!.title).toBe('调查员信息');
  });

  it('should return no minions message when none exist', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'investigator', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processInvestigator(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.suggestedResult).toContain('无法获取信息');
  });

  it('should provide fake minion info when investigator is poisoned', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'investigator', userId: 'user0', statuses: ['POISONED'] }),
      createTestSeat({ id: 1, realRoleId: 'poisoner', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' }),
      createTestSeat({ id: 3, realRoleId: 'empath', userId: 'user3' }),
      createTestSeat({ id: 4, realRoleId: 'chef', userId: 'user4' })
    ];
    const gameState = createTestGameState(seats);
    const result = processInvestigator(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.isTainted).toBe(true);
    // suggestedResult will be random due to poisoning
    expect(result.suggestions[0]!.suggestedResult).toBeDefined();
  });

  it('should provide fake info when investigator is poisoned and no minions exist', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'investigator', userId: 'user0', statuses: ['POISONED'] }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'empath', userId: 'user2' }),
      createTestSeat({ id: 3, realRoleId: 'chef', userId: 'user3' })
    ];
    const gameState = createTestGameState(seats);
    const result = processInvestigator(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.isTainted).toBe(true);
    // Even without real minions, poisoned investigator gets fake info
    expect(result.suggestions[0]!.suggestedResult).toBeDefined();
  });
});

describe('processChef', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processChef(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should count evil pairs correctly - no pairs', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'chef', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' }),
      createTestSeat({ id: 3, realRoleId: 'poisoner', userId: 'user3' })
    ];
    const gameState = createTestGameState(seats);
    const result = processChef(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.roleId).toBe('chef');
    expect(result.suggestions[0]!.title).toBe('厨师信息');
  });

  it('should detect evil pairs when adjacent', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'chef', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'poisoner', userId: 'user2' }),
      createTestSeat({ id: 3, realRoleId: 'monk', userId: 'user3' })
    ];
    const gameState = createTestGameState(seats);
    const result = processChef(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.realResult).toContain('1');
  });

  it('should give fake count when tainted', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'chef', userId: 'user0', statuses: ['POISONED'] }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processChef(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.isTainted).toBe(true);
  });
});

describe('processEmpath', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processEmpath(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should count evil neighbors correctly', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'imp', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'empath', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'poisoner', userId: 'user2' }),
      createTestSeat({ id: 3, realRoleId: 'monk', userId: 'user3' })
    ];
    const gameState = createTestGameState(seats);
    const result = processEmpath(gameState, 1, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.roleId).toBe('empath');
    expect(result.suggestions[0]!.title).toBe('共情者信息');
    // Both neighbors are evil (imp and poisoner)
    expect(result.suggestions[0]!.realResult).toContain('2');
  });

  it('should return 0 for no evil neighbors', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'monk', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'empath', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'chef', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processEmpath(gameState, 1, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.realResult).toContain('没有邪恶');
  });

  it('should give fake info when tainted', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'monk', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'empath', userId: 'user1', statuses: ['DRUNK'] }),
      createTestSeat({ id: 2, realRoleId: 'chef', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processEmpath(gameState, 1, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.isTainted).toBe(true);
  });
});

describe('processFortuneTeller', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processFortuneTeller(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should ask for targets when not provided', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'fortune_teller', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processFortuneTeller(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.type).toBe('action');
    expect(result.suggestions[0]!.description).toContain('选择两名玩家');
  });

  it('should process with targets provided', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'fortune_teller', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTargets: AbilityContext = {
      ...defaultContext,
      targetSeatIds: [1, 2]
    };
    const result = processFortuneTeller(gameState, 0, contextWithTargets);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.roleId).toBe('fortune_teller');
  });

  it('should return error when target seat does not exist', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'fortune_teller', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTargets: AbilityContext = {
      ...defaultContext,
      targetSeatIds: [1, 99] // 99 doesn't exist
    };
    const result = processFortuneTeller(gameState, 0, contextWithTargets);

    expect(result.success).toBe(false);
    expect(result.error).toBe('目标座位不存在');
  });

  it('should provide random yes/no when fortune teller is poisoned', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'fortune_teller', userId: 'user0', statuses: ['POISONED'] }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'monk', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTargets: AbilityContext = {
      ...defaultContext,
      targetSeatIds: [1, 2]
    };
    const result = processFortuneTeller(gameState, 0, contextWithTargets);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.isTainted).toBe(true);
    // suggestedResult could be '是' or '否' randomly when poisoned
    expect(['是', '否']).toContain(result.suggestions[0]!.suggestedResult);
    // Real result should be correct (target includes imp)
    expect(result.suggestions[0]!.realResult).toBe('是');
  });
});

describe('processUndertaker', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processUndertaker(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should return empty suggestions on first night', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'undertaker', userId: 'user0' })
    ];
    const gameState = createTestGameState(seats);
    const result = processUndertaker(gameState, 0, { ...defaultContext, isFirstNight: true });

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(0);
  });

  it('should return no execution message when no one was executed', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'undertaker', userId: 'user0' })
    ];
    const gameState = createTestGameState(seats);
    const result = processUndertaker(gameState, 0, { ...defaultContext, isFirstNight: false });

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.suggestedResult).toBe('昨天没有处决');
  });

  it('should return executed player role when provided', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'undertaker', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1', isDead: true })
    ];
    const gameState = createTestGameState(seats);
    const contextWithExecution: AbilityContext = {
      ...defaultContext,
      isFirstNight: false,
      executedSeatId: 1
    };
    const result = processUndertaker(gameState, 0, contextWithExecution);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.title).toBe('殓葬师信息');
    expect(result.suggestions[0]!.suggestedResult).toContain('僧侣');
  });

  it('should provide random role info when undertaker is poisoned', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'undertaker', userId: 'user0', statuses: ['POISONED'] }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1', isDead: true })
    ];
    const gameState = createTestGameState(seats);
    const contextWithExecution: AbilityContext = {
      ...defaultContext,
      isFirstNight: false,
      executedSeatId: 1
    };
    const result = processUndertaker(gameState, 0, contextWithExecution);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.isTainted).toBe(true);
    // suggestedResult will be random due to poisoning
    expect(result.suggestions[0]!.suggestedResult).toBeDefined();
    expect(result.suggestions[0]!.realResult).toContain('僧侣');
  });

  it('should return error when executed seat does not exist', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'undertaker', userId: 'user0' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithExecution: AbilityContext = {
      ...defaultContext,
      isFirstNight: false,
      executedSeatId: 99 // Non-existent seat
    };
    const result = processUndertaker(gameState, 0, contextWithExecution);

    expect(result.success).toBe(false);
    expect(result.error).toBe('被处决座位不存在');
  });
});

describe('processMonk', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processMonk(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should return empty suggestions on first night', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'monk', userId: 'user0' })
    ];
    const gameState = createTestGameState(seats);
    const result = processMonk(gameState, 0, { ...defaultContext, isFirstNight: true });

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(0);
  });

  it('should ask for protection target', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'monk', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'empath', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const result = processMonk(gameState, 0, { ...defaultContext, isFirstNight: false });

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.type).toBe('action');
    expect(result.suggestions[0]!.description).toContain('选择一名玩家');
  });

  it('should recommend protecting info roles in FULL_AUTO mode', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'monk', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'fortune_teller', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'chef', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processMonk(gameState, 0, {
      ...defaultContext,
      isFirstNight: false,
      automationLevel: 'FULL_AUTO'
    });

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.type).toBe('action');
    // In FULL_AUTO mode, should have a recommended option for info roles
    const options = result.suggestions[0]!.options;
    expect(options).toBeDefined();
    expect(options!.some(o => o.id === 'recommended')).toBe(true);
  });

  it('should protect target when provided', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'monk', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'empath', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      isFirstNight: false,
      targetSeatIds: [1]
    };
    const result = processMonk(gameState, 0, contextWithTarget);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.roleId).toBe('monk');
    expect(result.suggestions[0]!.title).toBe('僧侣保护');
  });

  it('should return error when targetSeatIds[0] is undefined', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'monk', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'empath', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const targetSeatIds: (number | undefined)[] = [undefined];
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      isFirstNight: false,
      targetSeatIds: targetSeatIds as number[]
    };
    const result = processMonk(gameState, 0, contextWithTarget);

    expect(result.success).toBe(false);
    expect(result.error).toBe('未指定目标');
  });

  it('should return error when target seat does not exist', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'monk', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'empath', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      isFirstNight: false,
      targetSeatIds: [99] // Non-existent seat
    };
    const result = processMonk(gameState, 0, contextWithTarget);

    expect(result.success).toBe(false);
    expect(result.error).toBe('目标座位不存在');
  });
});

describe('processRavenkeeper', () => {
  it('should return empty suggestions for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processRavenkeeper(gameState, 99, defaultContext);

    // Ravenkeeper returns success with empty suggestions when seat doesn't exist or is alive
    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(0);
  });

  it('should return empty suggestions if ravenkeeper is alive', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'ravenkeeper', userId: 'user0', isDead: false })
    ];
    const gameState = createTestGameState(seats);
    const result = processRavenkeeper(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(0);
  });

  it('should ask for target when ravenkeeper dies', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'ravenkeeper', userId: 'user0', isDead: true }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const result = processRavenkeeper(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.type).toBe('action');
    expect(result.suggestions[0]!.description).toContain('选择一名玩家');
  });

  it('should return target role when provided', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'ravenkeeper', userId: 'user0', isDead: true }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      targetSeatIds: [1]
    };
    const result = processRavenkeeper(gameState, 0, contextWithTarget);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.title).toBe('守鸦人信息');
    expect(result.suggestions[0]!.suggestedResult).toContain('僧侣');
  });

  it('should return error when target seat does not exist', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'ravenkeeper', userId: 'user0', isDead: true }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      targetSeatIds: [99] // Non-existent seat
    };
    const result = processRavenkeeper(gameState, 0, contextWithTarget);

    expect(result.success).toBe(false);
    expect(result.error).toBe('目标座位不存在');
  });

  it('should return error when targetSeatIds[0] is undefined', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'ravenkeeper', userId: 'user0', isDead: true }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const targetSeatIds: (number | undefined)[] = [undefined];
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      targetSeatIds: targetSeatIds as number[]
    };
    const result = processRavenkeeper(gameState, 0, contextWithTarget);

    expect(result.success).toBe(false);
    expect(result.error).toBe('未指定目标');
  });

  it('should provide random role when ravenkeeper is poisoned', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'ravenkeeper', userId: 'user0', isDead: true, statuses: ['POISONED'] }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      targetSeatIds: [1]
    };
    const result = processRavenkeeper(gameState, 0, contextWithTarget);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.isTainted).toBe(true);
    // The suggested result may differ from the real result due to poisoning
    expect(result.suggestions[0]!.realResult).toContain('僧侣');
    // suggestedResult could be any role due to random selection when tainted
    expect(result.suggestions[0]!.suggestedResult).toBeDefined();
  });
});

describe('processVirgin', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processVirgin(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should return empty suggestions when no nominator provided', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'virgin', userId: 'user0' })
    ];
    const gameState = createTestGameState(seats);
    const result = processVirgin(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(0);
  });

  it('should return empty suggestions if ability already used', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'virgin', userId: 'user0', hasUsedAbility: true })
    ];
    const gameState = createTestGameState(seats);
    const result = processVirgin(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(0);
  });

  it('should trigger when nominated by townsfolk', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'virgin', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithNominator: AbilityContext = {
      ...defaultContext,
      additionalData: { nominatorSeatId: 1 }
    };
    const result = processVirgin(gameState, 0, contextWithNominator);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.type).toBe('effect');
    expect(result.deaths?.length).toBe(1);
    expect(result.deaths![0]!.seatId).toBe(1);
  });

  it('should return error when nominator seat does not exist', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'virgin', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithNominator: AbilityContext = {
      ...defaultContext,
      additionalData: { nominatorSeatId: 99 } // Non-existent seat
    };
    const result = processVirgin(gameState, 0, contextWithNominator);

    expect(result.success).toBe(false);
    expect(result.error).toBe('提名者座位不存在');
  });

  it('should not trigger ability when virgin is poisoned', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'virgin', userId: 'user0', statuses: ['POISONED'] }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithNominator: AbilityContext = {
      ...defaultContext,
      additionalData: { nominatorSeatId: 1 }
    };
    const result = processVirgin(gameState, 0, contextWithNominator);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.type).toBe('info');
    expect(result.suggestions[0]!.isTainted).toBe(true);
    expect(result.suggestions[0]!.description).toContain('中毒');
    // Should not kill the nominator when poisoned
    expect(result.deaths).toBeUndefined();
  });

  it('should not trigger ability when nominator is not townsfolk', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'virgin', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' }) // Demon, not townsfolk
    ];
    const gameState = createTestGameState(seats);
    const contextWithNominator: AbilityContext = {
      ...defaultContext,
      additionalData: { nominatorSeatId: 1 }
    };
    const result = processVirgin(gameState, 0, contextWithNominator);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.type).toBe('info');
    expect(result.suggestions[0]!.description).toContain('不是镇民');
    // Should not kill the nominator when they're not a townsfolk
    expect(result.deaths).toBeUndefined();
  });
});

describe('processSlayer', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processSlayer(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should return error if ability already used', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'slayer', userId: 'user0', hasUsedAbility: true })
    ];
    const gameState = createTestGameState(seats);
    const result = processSlayer(gameState, 0, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('已使用能力');
  });

  it('should ask for target when not provided', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'slayer', userId: 'user0', hasUsedAbility: false })
    ];
    const gameState = createTestGameState(seats);
    const result = processSlayer(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.type).toBe('action');
    expect(result.suggestions[0]!.description).toContain('选择一名玩家');
  });

  it('should kill demon when targeted', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'slayer', userId: 'user0', hasUsedAbility: false }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      targetSeatIds: [1]
    };
    const result = processSlayer(gameState, 0, contextWithTarget);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.title).toContain('命中');
    expect(result.deaths?.length).toBe(1);
  });

  it('should miss when non-demon targeted', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'slayer', userId: 'user0', hasUsedAbility: false }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      targetSeatIds: [1]
    };
    const result = processSlayer(gameState, 0, contextWithTarget);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.suggestedResult).toContain('未命中');
  });

  it('should return error when targetSeatIds[0] is undefined', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'slayer', userId: 'user0', hasUsedAbility: false }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    // Create an array with undefined as first element
    const targetSeatIds: (number | undefined)[] = [undefined];
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      targetSeatIds: targetSeatIds as number[]
    };
    const result = processSlayer(gameState, 0, contextWithTarget);

    expect(result.success).toBe(false);
    expect(result.error).toContain('未指定目标');
  });

  it('should return error when target seat does not exist', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'slayer', userId: 'user0', hasUsedAbility: false })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      targetSeatIds: [99] // Non-existent seat
    };
    const result = processSlayer(gameState, 0, contextWithTarget);

    expect(result.success).toBe(false);
    expect(result.error).toContain('目标座位不存在');
  });

  it('should fail silently when slayer is poisoned', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'slayer', userId: 'user0', hasUsedAbility: false, statuses: ['POISONED'] }),
      createTestSeat({ id: 1, realRoleId: 'imp', userId: 'user1' })
    ];
    const gameState = createTestGameState(seats);
    const contextWithTarget: AbilityContext = {
      ...defaultContext,
      targetSeatIds: [1]
    };
    const result = processSlayer(gameState, 0, contextWithTarget);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.isTainted).toBe(true);
    expect(result.suggestions[0]!.suggestedResult).toContain('未命中');
    // Should NOT kill demon when poisoned
    expect(result.deaths).toBeUndefined();
  });
});

describe('processSoldier', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processSoldier(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should return immunity info', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'soldier', userId: 'user0' })
    ];
    const gameState = createTestGameState(seats);
    const result = processSoldier(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.suggestedResult).toContain('免疫恶魔击杀');
  });

  it('should indicate vulnerability when tainted', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'soldier', userId: 'user0', statuses: ['POISONED'] })
    ];
    const gameState = createTestGameState(seats);
    const result = processSoldier(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.suggestedResult).toContain('可被恶魔击杀');
    expect(result.suggestions[0]!.isTainted).toBe(true);
  });
});

describe('processMayor', () => {
  it('should return error for non-existent seat', () => {
    const gameState = createTestGameState([]);
    const result = processMayor(gameState, 99, defaultContext);

    expect(result.success).toBe(false);
    expect(result.error).toContain('座位不存在');
  });

  it('should return empty suggestions normally', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'mayor', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'chef', userId: 'user2' }),
      createTestSeat({ id: 3, realRoleId: 'empath', userId: 'user3' }),
      createTestSeat({ id: 4, realRoleId: 'imp', userId: 'user4' })
    ];
    const gameState = createTestGameState(seats);
    const result = processMayor(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(0);
  });

  it('should warn about 3-player victory condition', () => {
    const seats = [
      createTestSeat({ id: 0, realRoleId: 'mayor', userId: 'user0' }),
      createTestSeat({ id: 1, realRoleId: 'monk', userId: 'user1' }),
      createTestSeat({ id: 2, realRoleId: 'imp', userId: 'user2' })
    ];
    const gameState = createTestGameState(seats);
    const result = processMayor(gameState, 0, defaultContext);

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(1);
    expect(result.suggestions[0]!.title).toContain('市长胜利条件');
    expect(result.suggestions[0]!.description).toContain('好人获胜');
  });
});
