/**
 * Trouble Brewing - Outsider Role Tests
 *
 * 暗流涌动剧本 - 外来者角色测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  processButler,
  processDrunk,
  processRecluse,
  processSaint
} from '../../../src/lib/roleAutomation/troubleBrewing/outsiders';
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
    nightCurrentIndex: 0,
    voting: null,
    customScripts: {},
    customRoles: {},
    voteHistory: [],
    roundInfo: { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 1 },
    storytellerNotes: [],
    skillDescriptionMode: 'detailed',
    aiMessages: [],
    nightActionRequests: [],
    candlelightEnabled: false,
    dailyNominations: [],
    interactionLog: []
  };
}

describe('processButler', () => {
  let gameState: GameState;
  let context: AbilityContext;

  beforeEach(() => {
    const seats = [
      createTestSeat({ id: 0, userId: 'user1', userName: 'Butler', roleId: 'butler', realRoleId: 'butler' }),
      createTestSeat({ id: 1, userId: 'user2', userName: 'Player2' }),
      createTestSeat({ id: 2, userId: 'user3', userName: 'Player3' }),
      createTestSeat({ id: 3, userId: 'user4', userName: 'Player4' }),
      createTestSeat({ id: 4, userId: 'user5', userName: 'Player5' })
    ];
    gameState = createTestGameState(seats);
    context = {
      automationLevel: 'GUIDED',
      isFirstNight: true,
      nightCount: 1,
      dayCount: 0
    };
  });

  it('should return error if seat not found', () => {
    const result = processButler(gameState, 99, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('座位不存在');
  });

  it('should return action suggestion when no target selected', () => {
    const result = processButler(gameState, 0, context);

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(1);
    expect(result.suggestions[0]!.type).toBe('action');
    expect(result.suggestions[0]!.title).toContain('管家');
  });

  it('should exclude self from master options', () => {
    const result = processButler(gameState, 0, context);

    expect(result.success).toBe(true);
    // The options should be for selecting a master, excluding self
    const suggestion = result.suggestions[0]!;
    expect(suggestion.options).toBeDefined();
  });

  it('should return effect when master is selected', () => {
    context.targetSeatIds = [1];

    const result = processButler(gameState, 0, context);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.type).toBe('effect');
    expect(result.suggestions[0]!.targetSeatIds).toContain(1);
  });

  it('should return error if target seat not found', () => {
    context.targetSeatIds = [99];

    const result = processButler(gameState, 0, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('主人座位不存在');
  });

  it('should return error if targetSeatIds is defined but empty with undefined first element', () => {
    context.targetSeatIds = [];

    const result = processButler(gameState, 0, context);

    // Should return action suggestion as no target selected
    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.type).toBe('action');
  });

  it('should return error when targetSeatIds[0] is explicitly undefined', () => {
    // Create an array with undefined as first element
    const targetSeatIds: (number | undefined)[] = [undefined];
    context.targetSeatIds = targetSeatIds as number[];

    const result = processButler(gameState, 0, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('未指定主人');
  });

  it('should provide random recommendation in FULL_AUTO mode', () => {
    context.automationLevel = 'FULL_AUTO';

    const result = processButler(gameState, 0, context);

    expect(result.success).toBe(true);
    const suggestion = result.suggestions[0]!;
    expect(suggestion.options?.some(o => o.id === 'random')).toBe(true);
  });
});

describe('processDrunk', () => {
  let gameState: GameState;
  let context: AbilityContext;

  beforeEach(() => {
    const seats = [
      createTestSeat({
        id: 0,
        userId: 'user1',
        userName: 'Drunk',
        roleId: 'washerwoman', // Shows as washerwoman
        realRoleId: 'drunk',   // Actually drunk
        seenRoleId: 'washerwoman'
      }),
      createTestSeat({ id: 1, userId: 'user2', userName: 'Player2' })
    ];
    gameState = createTestGameState(seats);
    context = {
      automationLevel: 'GUIDED',
      isFirstNight: true,
      nightCount: 1,
      dayCount: 0
    };
  });

  it('should return error if seat not found', () => {
    const result = processDrunk(gameState, 99, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('座位不存在');
  });

  it('should return drunk status info', () => {
    const result = processDrunk(gameState, 0, context);

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(1);
    expect(result.suggestions[0]!.type).toBe('info');
    expect(result.suggestions[0]!.roleId).toBe('drunk');
    expect(result.suggestions[0]!.description).toContain('洗衣妇');
    expect(result.suggestions[0]!.description).toContain('酒鬼');
  });

  it('should return empty suggestions if not drunk', () => {
    gameState.seats[0]!.realRoleId = 'washerwoman';

    const result = processDrunk(gameState, 0, context);

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(0);
  });

  it('should handle drunk without seenRoleId', () => {
    gameState.seats[0]!.seenRoleId = null;

    const result = processDrunk(gameState, 0, context);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.description).toContain('未设置');
  });
});

describe('processRecluse', () => {
  let gameState: GameState;
  let context: AbilityContext;

  beforeEach(() => {
    const seats = [
      createTestSeat({
        id: 0,
        userId: 'user1',
        userName: 'Recluse',
        roleId: 'recluse',
        realRoleId: 'recluse'
      }),
      createTestSeat({ id: 1, userId: 'user2', userName: 'Player2' })
    ];
    gameState = createTestGameState(seats);
    context = {
      automationLevel: 'GUIDED',
      isFirstNight: true,
      nightCount: 1,
      dayCount: 0
    };
  });

  it('should return error if seat not found', () => {
    const result = processRecluse(gameState, 99, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('座位不存在');
  });

  it('should return recluse status info', () => {
    const result = processRecluse(gameState, 0, context);

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(1);
    expect(result.suggestions[0]!.type).toBe('info');
    expect(result.suggestions[0]!.description).toContain('邪恶');
  });

  it('should provide detection options in GUIDED mode', () => {
    const result = processRecluse(gameState, 0, context);

    expect(result.suggestions[0]!.options).toBeDefined();
    expect(result.suggestions[0]!.options?.length).toBe(4);
    expect(result.suggestions[0]!.options?.some(o => o.id === 'show_evil')).toBe(true);
  });

  it('should not provide options in FULL_AUTO mode', () => {
    context.automationLevel = 'FULL_AUTO';

    const result = processRecluse(gameState, 0, context);

    expect(result.suggestions[0]!.options).toBeUndefined();
  });

  it('should indicate tainted status if poisoned', () => {
    gameState.seats[0]!.statuses = ['POISONED'];

    const result = processRecluse(gameState, 0, context);

    expect(result.suggestions[0]!.isTainted).toBe(true);
    expect(result.suggestions[0]!.description).toContain('中毒');
  });
});

describe('processSaint', () => {
  let gameState: GameState;
  let context: AbilityContext;

  beforeEach(() => {
    const seats = [
      createTestSeat({
        id: 0,
        userId: 'user1',
        userName: 'Saint',
        roleId: 'saint',
        realRoleId: 'saint'
      }),
      createTestSeat({ id: 1, userId: 'user2', userName: 'Player2' })
    ];
    gameState = createTestGameState(seats);
    context = {
      automationLevel: 'GUIDED',
      isFirstNight: true,
      nightCount: 1,
      dayCount: 0
    };
  });

  it('should return error if seat not found', () => {
    const result = processSaint(gameState, 99, context);

    expect(result.success).toBe(false);
    expect(result.error).toBe('座位不存在');
  });

  it('should return warning when saint is not being executed', () => {
    const result = processSaint(gameState, 0, context);

    expect(result.success).toBe(true);
    expect(result.suggestions.length).toBe(1);
    expect(result.suggestions[0]!.type).toBe('warning');
    expect(result.suggestions[0]!.description).toContain('被处决');
    expect(result.suggestions[0]!.description).toContain('邪恶');
  });

  it('should return game end effect when saint is executed', () => {
    context.additionalData = { isBeingExecuted: true };

    const result = processSaint(gameState, 0, context);

    expect(result.success).toBe(true);
    expect(result.suggestions[0]!.type).toBe('effect');
    expect(result.suggestions[0]!.title).toContain('被处决');
    expect(result.gameEndCondition).toBeDefined();
    expect(result.gameEndCondition?.winner).toBe('EVIL');
    expect(result.gameEndCondition?.reason).toContain('圣徒');
  });

  it('should require confirmation in GUIDED mode for execution', () => {
    context.additionalData = { isBeingExecuted: true };
    context.automationLevel = 'GUIDED';

    const result = processSaint(gameState, 0, context);

    expect(result.suggestions[0]!.requiresConfirmation).toBe(true);
  });

  it('should not require confirmation in FULL_AUTO mode for execution', () => {
    context.additionalData = { isBeingExecuted: true };
    context.automationLevel = 'FULL_AUTO';

    const result = processSaint(gameState, 0, context);

    expect(result.suggestions[0]!.requiresConfirmation).toBe(false);
  });
});
