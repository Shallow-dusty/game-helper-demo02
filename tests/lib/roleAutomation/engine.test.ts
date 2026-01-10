/**
 * Role Automation Engine Extended Tests
 *
 * 角色自动化引擎扩展测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RoleAutomationEngine } from '../../../src/lib/roleAutomation/engine';
import type { GameState, Seat } from '../../../src/types';

// 创建测试座位
function createTestSeat(overrides: Partial<Seat> = {}): Seat {
  return {
    id: 0,
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
    userId: 'user1',
    userName: 'Player1',
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    ...overrides
  };
}

// 创建测试游戏状态
function createTestGameState(seats: Seat[]): GameState {
  return {
    seats,
    phase: 'NIGHT',
    voting: null,
    currentScriptId: 'tb',
    messages: [],
    roundInfo: { dayCount: 1, nightCount: 1 },
    voteHistory: [],
    storytellerNotes: [],
    audio: { trackId: null, isPlaying: false, volume: 0.5 },
    allowWhispers: false,
    customScripts: {},
    swapRequests: [],
    vibrationEnabled: true,
    nightQueue: ['washerwoman', 'librarian', 'chef', 'empath', 'imp'],
    setupPhase: 'READY',
    rolesRevealed: false
  } as GameState;
}

describe('RoleAutomationEngine', () => {
  let engine: RoleAutomationEngine;
  let gameState: GameState;

  beforeEach(() => {
    engine = new RoleAutomationEngine();
    const seats = [
      createTestSeat({ id: 0, roleId: 'washerwoman', realRoleId: 'washerwoman' }),
      createTestSeat({ id: 1, roleId: 'librarian', realRoleId: 'librarian' }),
      createTestSeat({ id: 2, roleId: 'chef', realRoleId: 'chef' }),
      createTestSeat({ id: 3, roleId: 'empath', realRoleId: 'empath' }),
      createTestSeat({ id: 4, roleId: 'imp', realRoleId: 'imp' })
    ];
    gameState = createTestGameState(seats);
  });

  describe('configuration', () => {
    it('should set default configuration', () => {
      const config = engine.getConfig();

      expect(config.level).toBe('GUIDED');
      expect(config.enableRuleChecks).toBe(true);
    });

    it('should accept custom configuration', () => {
      const customEngine = new RoleAutomationEngine({
        level: 'FULL_AUTO',
        autoProcessDeaths: true
      });

      const config = customEngine.getConfig();
      expect(config.level).toBe('FULL_AUTO');
      expect(config.autoProcessDeaths).toBe(true);
    });

    it('should update configuration', () => {
      engine.updateConfig({ level: 'MANUAL' });

      expect(engine.getConfig().level).toBe('MANUAL');
    });

    it('should set automation level', () => {
      engine.setAutomationLevel('FULL_AUTO');

      expect(engine.getAutomationLevel()).toBe('FULL_AUTO');
    });
  });

  describe('processNightPhase', () => {
    it('should process role at current index', () => {
      const results = engine.processNightPhase(gameState, gameState.nightQueue, 0);

      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty results for invalid index', () => {
      const results = engine.processNightPhase(gameState, gameState.nightQueue, 99);

      expect(results.length).toBe(0);
    });

    it('should skip dead players', () => {
      gameState.seats[0].isDead = true;

      const results = engine.processNightPhase(gameState, gameState.nightQueue, 0);

      expect(results.length).toBe(0);
    });

    it('should collect suggestions from processed roles', () => {
      engine.processNightPhase(gameState, gameState.nightQueue, 0);

      const suggestions = engine.getPendingSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('processRoleAbility', () => {
    it('should process townsfolk ability', () => {
      const result = engine.processRoleAbility(gameState, 0, 'washerwoman', {
        automationLevel: 'GUIDED',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      });

      expect(result.success).toBe(true);
    });

    it('should process demon ability', () => {
      const result = engine.processRoleAbility(gameState, 4, 'imp', {
        automationLevel: 'GUIDED',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      });

      expect(result.success).toBe(true);
    });

    it('should return error for unsupported script', () => {
      gameState.currentScriptId = 'unsupported_script';

      const result = engine.processRoleAbility(gameState, 0, 'washerwoman', {
        automationLevel: 'GUIDED',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('不支持');
    });
  });

  describe('suggestion management', () => {
    beforeEach(() => {
      // Generate some suggestions
      engine.processNightPhase(gameState, gameState.nightQueue, 0);
    });

    it('should get all pending suggestions', () => {
      const suggestions = engine.getPendingSuggestions();

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should get suggestions for specific seat', () => {
      const suggestions = engine.getSuggestionsForSeat(0);

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should confirm suggestion', () => {
      const suggestions = engine.getPendingSuggestions();
      if (suggestions.length > 0) {
        const suggestionId = suggestions[0].id;
        const confirmed = engine.confirmSuggestion(suggestionId);

        expect(confirmed).toBeDefined();
        expect(engine.getPendingSuggestions().find(s => s.id === suggestionId)).toBeUndefined();
      }
    });

    it('should return null for non-existent suggestion', () => {
      const result = engine.confirmSuggestion('nonexistent');

      expect(result).toBe(null);
    });

    it('should dismiss suggestion', () => {
      const suggestions = engine.getPendingSuggestions();
      if (suggestions.length > 0) {
        const suggestionId = suggestions[0].id;
        engine.dismissSuggestion(suggestionId);

        expect(engine.getPendingSuggestions().find(s => s.id === suggestionId)).toBeUndefined();
      }
    });

    it('should clear all pending items', () => {
      engine.clearPending();

      expect(engine.getPendingSuggestions().length).toBe(0);
      expect(engine.getPendingDeaths().length).toBe(0);
      expect(engine.getPendingStatusChanges().length).toBe(0);
    });
  });

  describe('generateAllNightSuggestions', () => {
    it('should generate suggestions for all night roles', () => {
      const result = engine.generateAllNightSuggestions(gameState);

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should skip dead players', () => {
      // Kill all players
      gameState.seats.forEach(s => s.isDead = true);

      const result = engine.generateAllNightSuggestions(gameState);

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBe(0);
    });

    it('should sort suggestions by priority', () => {
      const result = engine.generateAllNightSuggestions(gameState);

      for (let i = 0; i < result.suggestions.length - 1; i++) {
        expect(result.suggestions[i].priority).toBeGreaterThanOrEqual(result.suggestions[i + 1].priority);
      }
    });
  });

  describe('checkGameEndConditions', () => {
    it('should detect good win when demon is dead', () => {
      // Kill the imp
      gameState.seats[4].isDead = true;

      const result = engine.checkGameEndConditions(gameState);

      expect(result.shouldEnd).toBe(true);
      expect(result.winner).toBe('GOOD');
    });

    it('should not end game when demon is alive', () => {
      const result = engine.checkGameEndConditions(gameState);

      expect(result.shouldEnd).toBe(false);
    });

    it('should detect evil win when only 2 players left', () => {
      // Kill 3 players, leaving only 2 (including demon)
      gameState.seats[0].isDead = true;
      gameState.seats[1].isDead = true;
      gameState.seats[2].isDead = true;

      const result = engine.checkGameEndConditions(gameState);

      expect(result.shouldEnd).toBe(true);
      expect(result.winner).toBe('EVIL');
    });

    it('should allow scarlet woman to transform if enough players (5+)', () => {
      // Add more players to meet 5+ requirement
      gameState.seats.push(createTestSeat({ id: 5, seenRoleId: 'monk', realRoleId: 'monk' }));
      // Add scarlet woman
      gameState.seats[3].seenRoleId = 'scarlet_woman';
      gameState.seats[3].realRoleId = 'scarlet_woman';
      // Kill demon
      gameState.seats[4].isDead = true;

      const result = engine.checkGameEndConditions(gameState);

      // With 5 alive players and scarlet woman, game continues
      expect(result.shouldEnd).toBe(false);
    });

    it('should end game if scarlet woman exists but too few players', () => {
      // Add scarlet woman
      gameState.seats[3].seenRoleId = 'scarlet_woman';
      gameState.seats[3].realRoleId = 'scarlet_woman';
      // Kill demon and others
      gameState.seats[4].isDead = true;
      gameState.seats[0].isDead = true;
      gameState.seats[1].isDead = true;

      const result = engine.checkGameEndConditions(gameState);

      // With only 2 alive players, scarlet woman can't save the game
      expect(result.shouldEnd).toBe(true);
      expect(result.winner).toBe('GOOD');
    });
  });

  describe('applyStatusChanges', () => {
    it('should add status to seat', () => {
      // Manually add a pending status change
      engine.pendingStatusChanges.push({
        seatId: 0,
        status: 'PROTECTED',
        action: 'add',
        source: 'monk',
        duration: 'night'
      });

      const updatedSeats = engine.applyStatusChanges(gameState.seats);

      expect(updatedSeats[0].statuses).toContain('PROTECTED');
    });

    it('should remove status from seat', () => {
      gameState.seats[0].statuses = ['POISONED', 'PROTECTED'];
      engine.pendingStatusChanges.push({
        seatId: 0,
        status: 'POISONED',
        action: 'remove',
        source: 'system'
      });

      const updatedSeats = engine.applyStatusChanges(gameState.seats);

      expect(updatedSeats[0].statuses).not.toContain('POISONED');
      expect(updatedSeats[0].statuses).toContain('PROTECTED');
    });

    it('should clear pending status changes after applying', () => {
      engine.pendingStatusChanges.push({
        seatId: 0,
        status: 'PROTECTED',
        action: 'add',
        source: 'monk',
        duration: 'night'
      });

      engine.applyStatusChanges(gameState.seats);

      expect(engine.getPendingStatusChanges().length).toBe(0);
    });
  });

  describe('applyDeaths', () => {
    it('should mark seat as dead', () => {
      engine.pendingDeaths.push({
        seatId: 0,
        cause: 'demon_kill',
        killerRoleId: 'imp',
        isPreventable: false
      });

      const { seats, deadSeats } = engine.applyDeaths(gameState.seats);

      expect(seats[0].isDead).toBe(true);
      expect(deadSeats.length).toBe(1);
      expect(deadSeats[0].id).toBe(0);
    });

    it('should not apply prevented deaths', () => {
      engine.pendingDeaths.push({
        seatId: 0,
        cause: 'demon_kill',
        killerRoleId: 'imp',
        isPreventable: true,
        wasPrevented: true,
        preventedBy: 'monk'
      });

      const { seats, deadSeats } = engine.applyDeaths(gameState.seats);

      expect(seats[0].isDead).toBe(false);
      expect(deadSeats.length).toBe(0);
    });

    it('should clear pending deaths after applying', () => {
      engine.pendingDeaths.push({
        seatId: 0,
        cause: 'demon_kill',
        killerRoleId: 'imp',
        isPreventable: false
      });

      engine.applyDeaths(gameState.seats);

      expect(engine.getPendingDeaths().length).toBe(0);
    });
  });

  describe('getPendingChainReactions', () => {
    it('should return pending chain reactions', () => {
      engine.pendingChainReactions.push({
        type: 'imp_transfer',
        description: 'Imp transfer',
        targetSeatId: 1,
        newRoleId: 'imp'
      });

      const reactions = engine.getPendingChainReactions();

      expect(reactions.length).toBe(1);
      expect(reactions[0].type).toBe('imp_transfer');
    });
  });
});
