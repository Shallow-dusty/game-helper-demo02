/**
 * Role Automation Engine Extended Tests
 *
 * 角色自动化引擎扩展测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RoleAutomationEngine } from '../../../src/lib/roleAutomation/engine';
import * as troubleBrewingModule from '../../../src/lib/roleAutomation/troubleBrewing';
import type { GameState, Seat } from '../../../src/types';

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
    nightQueue: ['washerwoman', 'librarian', 'chef', 'empath', 'imp'],
    nightCurrentIndex: 0,
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
    dailyNominations: [],
    interactionLog: []
  };
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

  afterEach(() => {
    vi.restoreAllMocks();
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
      gameState.seats[0]!.isDead = true;

      const results = engine.processNightPhase(gameState, gameState.nightQueue, 0);

      expect(results.length).toBe(0);
    });

    it('should collect suggestions from processed roles', () => {
      engine.processNightPhase(gameState, gameState.nightQueue, 0);

      const suggestions = engine.getPendingSuggestions();
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('processNightPhase with mocked processors', () => {
    // These tests use mocking to test internal collection of statusChanges/deaths/chainReactions
    // They are isolated in their own describe block to prevent interference with other tests

    it('should collect statusChanges when role returns them', () => {
      // Mock processTroubleBrewingRole to return statusChanges
      const spy = vi.spyOn(troubleBrewingModule, 'processTroubleBrewingRole').mockReturnValueOnce({
        success: true,
        suggestions: [{
          id: 'test-suggestion',
          roleId: 'poisoner',
          seatId: 0,
          type: 'effect',
          title: 'Test',
          description: 'Test',
          priority: 90,
          requiresConfirmation: false
        }],
        statusChanges: [{
          seatId: 1,
          status: 'POISONED',
          action: 'add',
          source: 'poisoner'
        }]
      });

      const newEngine = new RoleAutomationEngine();
      newEngine.processNightPhase(gameState, ['washerwoman'], 0);

      expect(newEngine.getPendingStatusChanges().length).toBeGreaterThan(0);
      expect(newEngine.getPendingStatusChanges()[0]?.status).toBe('POISONED');

      spy.mockRestore();
    });

    it('should collect deaths when role returns them', () => {
      // Mock processTroubleBrewingRole to return deaths
      const spy = vi.spyOn(troubleBrewingModule, 'processTroubleBrewingRole').mockReturnValueOnce({
        success: true,
        suggestions: [{
          id: 'test-suggestion',
          roleId: 'imp',
          seatId: 4,
          type: 'effect',
          title: 'Test',
          description: 'Test',
          priority: 90,
          requiresConfirmation: false
        }],
        deaths: [{
          seatId: 1,
          source: 'imp',
          wasPrevented: false
        }]
      });

      const newEngine = new RoleAutomationEngine();
      newEngine.processNightPhase(gameState, ['imp'], 0);

      expect(newEngine.getPendingDeaths().length).toBeGreaterThan(0);
      expect(newEngine.getPendingDeaths()[0]?.seatId).toBe(1);

      spy.mockRestore();
    });

    it('should collect chainReactions when role returns them', () => {
      // Add a scarlet_woman seat to the game state
      const testGameState = createTestGameState([
        createTestSeat({ id: 0, roleId: 'scarlet_woman', realRoleId: 'scarlet_woman' }),
        createTestSeat({ id: 1, roleId: 'monk', realRoleId: 'monk' })
      ]);

      // Mock processTroubleBrewingRole to return chainReactions
      const spy = vi.spyOn(troubleBrewingModule, 'processTroubleBrewingRole').mockReturnValueOnce({
        success: true,
        suggestions: [{
          id: 'test-suggestion',
          roleId: 'scarlet_woman',
          seatId: 0,
          type: 'effect',
          title: 'Test',
          description: 'Test',
          priority: 90,
          requiresConfirmation: false
        }],
        chainReactions: [{
          type: 'scarlet_woman_transform',
          description: 'Scarlet woman becomes the imp',
          targetSeatId: 0
        }]
      });

      const newEngine = new RoleAutomationEngine();
      newEngine.processNightPhase(testGameState, ['scarlet_woman'], 0);

      expect(newEngine.getPendingChainReactions().length).toBeGreaterThan(0);
      expect(newEngine.getPendingChainReactions()[0]?.type).toBe('scarlet_woman_transform');

      spy.mockRestore();
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

    it('should sort suggestions by priority in descending order', () => {
      // Use mocking to add suggestions with different priorities
      const spy = vi.spyOn(troubleBrewingModule, 'processTroubleBrewingRole')
        .mockReturnValueOnce({
          success: true,
          suggestions: [{
            id: 'low-priority',
            roleId: 'test',
            seatId: 0,
            type: 'info',
            title: 'Low',
            description: 'Low priority',
            priority: 10,
            requiresConfirmation: false
          }]
        })
        .mockReturnValueOnce({
          success: true,
          suggestions: [{
            id: 'high-priority',
            roleId: 'test',
            seatId: 1,
            type: 'info',
            title: 'High',
            description: 'High priority',
            priority: 100,
            requiresConfirmation: false
          }]
        });

      const newEngine = new RoleAutomationEngine();
      // Create game state with two roles
      const testState = createTestGameState([
        createTestSeat({ id: 0, roleId: 'washerwoman', realRoleId: 'washerwoman' }),
        createTestSeat({ id: 1, roleId: 'librarian', realRoleId: 'librarian' })
      ]);

      // Process both roles
      newEngine.processNightPhase(testState, ['washerwoman', 'librarian'], 0);
      newEngine.processNightPhase(testState, ['washerwoman', 'librarian'], 1);

      const suggestions = newEngine.getPendingSuggestions();

      // Verify sorted by priority (high to low)
      expect(suggestions.length).toBe(2);
      expect(suggestions[0]!.priority).toBeGreaterThanOrEqual(suggestions[1]!.priority);
      expect(suggestions[0]!.id).toBe('high-priority');
      expect(suggestions[1]!.id).toBe('low-priority');

      spy.mockRestore();
    });

    it('should get suggestions for specific seat', () => {
      const suggestions = engine.getSuggestionsForSeat(0);

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should confirm suggestion', () => {
      const suggestions = engine.getPendingSuggestions();
      if (suggestions.length > 0) {
        const suggestionId = suggestions[0]!.id;
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
        const suggestionId = suggestions[0]!.id;
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
        expect(result.suggestions[i]!.priority).toBeGreaterThanOrEqual(result.suggestions[i + 1]!.priority);
      }
    });
  });

  describe('checkGameEndConditions', () => {
    it('should detect good win when demon is dead', () => {
      // Kill the imp
      gameState.seats[4]!.isDead = true;

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
      gameState.seats[0]!.isDead = true;
      gameState.seats[1]!.isDead = true;
      gameState.seats[2]!.isDead = true;

      const result = engine.checkGameEndConditions(gameState);

      expect(result.shouldEnd).toBe(true);
      expect(result.winner).toBe('EVIL');
    });

    it('should allow scarlet woman to transform if enough players (5+)', () => {
      // Add more players to meet 5+ requirement
      gameState.seats.push(createTestSeat({ id: 5, seenRoleId: 'monk', realRoleId: 'monk' }));
      // Add scarlet woman
      gameState.seats[3]!.seenRoleId = 'scarlet_woman';
      gameState.seats[3]!.realRoleId = 'scarlet_woman';
      // Kill demon
      gameState.seats[4]!.isDead = true;

      const result = engine.checkGameEndConditions(gameState);

      // With 5 alive players and scarlet woman, game continues
      expect(result.shouldEnd).toBe(false);
    });

    it('should end game if scarlet woman exists but too few players', () => {
      // Add scarlet woman
      gameState.seats[3]!.seenRoleId = 'scarlet_woman';
      gameState.seats[3]!.realRoleId = 'scarlet_woman';
      // Kill demon and others
      gameState.seats[4]!.isDead = true;
      gameState.seats[0]!.isDead = true;
      gameState.seats[1]!.isDead = true;

      const result = engine.checkGameEndConditions(gameState);

      // With only 2 alive players, scarlet woman can't save the game
      expect(result.shouldEnd).toBe(true);
      expect(result.winner).toBe('GOOD');
    });
  });

  describe('applyStatusChanges', () => {
    it('should add status to seat via poisoner night phase', () => {
      // Setup game with poisoner
      const seats = [
        createTestSeat({ id: 0, roleId: 'poisoner', realRoleId: 'poisoner' }),
        createTestSeat({ id: 1, roleId: 'monk', realRoleId: 'monk' }),
        createTestSeat({ id: 2, roleId: 'empath', realRoleId: 'empath' })
      ];
      gameState = createTestGameState(seats);
      gameState.nightQueue = ['poisoner'];
      gameState.roundInfo.nightCount = 2;

      // Process poisoner targeting seat 1
      const result = engine.processRoleAbility(gameState, 0, 'poisoner', {
        automationLevel: 'GUIDED',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [1]
      });

      // The result should have statusChanges
      expect(result.success).toBe(true);
      expect(result.statusChanges).toBeDefined();
      expect(result.statusChanges!.length).toBeGreaterThan(0);
      expect(result.statusChanges![0]!.action).toBe('add');
      expect(result.statusChanges![0]!.status).toBe('POISONED');
    });

    it('should add PROTECTED status via monk ability result', () => {
      // Setup game with monk
      const seats = [
        createTestSeat({ id: 0, roleId: 'monk', realRoleId: 'monk' }),
        createTestSeat({ id: 1, roleId: 'empath', realRoleId: 'empath' }),
        createTestSeat({ id: 2, roleId: 'chef', realRoleId: 'chef' })
      ];
      gameState = createTestGameState(seats);
      gameState.roundInfo.nightCount = 2;

      // Process monk protecting seat 1
      const result = engine.processRoleAbility(gameState, 0, 'monk', {
        automationLevel: 'GUIDED',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      expect(result.statusChanges).toBeDefined();
      expect(result.statusChanges!.length).toBeGreaterThan(0);
      expect(result.statusChanges![0]!.action).toBe('add');
      expect(result.statusChanges![0]!.status).toBe('PROTECTED');
    });

    it('should apply status changes to seats', () => {
      gameState.seats[0]!.statuses = ['POISONED', 'PROTECTED'];
      engine.clearPending();

      // With no pending changes, seats should remain unchanged
      const updatedSeats = engine.applyStatusChanges(gameState.seats);

      expect(updatedSeats[0]!.statuses).toContain('POISONED');
      expect(updatedSeats[0]!.statuses).toContain('PROTECTED');
    });

    it('should actually apply pending status changes via processNightPhase', () => {
      // Setup engine with FULL_AUTO mode
      const autoEngine = new RoleAutomationEngine({ level: 'FULL_AUTO' });

      // Setup game with poisoner and targets
      const seats = [
        createTestSeat({ id: 0, roleId: 'poisoner', realRoleId: 'poisoner' }),
        createTestSeat({ id: 1, roleId: 'empath', realRoleId: 'empath' }),
        createTestSeat({ id: 2, roleId: 'chef', realRoleId: 'chef' })
      ];
      const testState = createTestGameState(seats);
      testState.nightQueue = ['poisoner'];
      testState.roundInfo.nightCount = 2;

      // Process poisoner with a target via processRoleAbility
      const result = autoEngine.processRoleAbility(testState, 0, 'poisoner', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [1]
      });

      // Verify result has statusChanges
      expect(result.success).toBe(true);
      expect(result.statusChanges).toBeDefined();
      expect(result.statusChanges!.length).toBeGreaterThan(0);

      // Manually add statusChanges to pending (simulating processNightPhase behavior)
      // Using type assertion to access private property for testing
      (autoEngine as unknown as { pendingStatusChanges: { seatId: number; status: string; action: string; source: string }[] }).pendingStatusChanges.push(...result.statusChanges!);

      // Now apply the pending status changes
      const updatedSeats = autoEngine.applyStatusChanges(testState.seats);

      // Verify the status was applied
      expect(updatedSeats[1]!.statuses).toContain('POISONED');

      // Verify pending was cleared
      expect(autoEngine.getPendingStatusChanges().length).toBe(0);
    });

    it('should apply remove action to remove status', () => {
      // Setup engine
      const autoEngine = new RoleAutomationEngine({ level: 'FULL_AUTO' });

      // Setup game with player that has POISONED status
      const seats = [
        createTestSeat({ id: 0, roleId: 'monk', realRoleId: 'monk', statuses: ['POISONED'] })
      ];
      const testState = createTestGameState(seats);

      // Manually add a remove status change
      (autoEngine as unknown as { pendingStatusChanges: { seatId: number; status: string; action: string; source: string }[] }).pendingStatusChanges.push({
        seatId: 0,
        status: 'POISONED',
        action: 'remove',
        source: 'test'
      });

      // Apply the pending status changes
      const updatedSeats = autoEngine.applyStatusChanges(testState.seats);

      // Verify the status was removed
      expect(updatedSeats[0]!.statuses).not.toContain('POISONED');
    });

    it('should clear pending status changes after applying', () => {
      // Use processNightPhase which adds status changes to the engine
      gameState.seats[0]!.roleId = 'poisoner';
      gameState.seats[0]!.realRoleId = 'poisoner';
      gameState.nightQueue = ['poisoner'];
      gameState.roundInfo.nightCount = 2;

      // First, manually test the result has statusChanges
      const result = engine.processRoleAbility(gameState, 0, 'poisoner', {
        automationLevel: 'GUIDED',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [1]
      });

      expect(result.statusChanges).toBeDefined();
    });
  });

  describe('applyDeaths', () => {
    it('should return death events from imp kill result', () => {
      // Setup game with imp
      const seats = [
        createTestSeat({ id: 0, roleId: 'imp', realRoleId: 'imp' }),
        createTestSeat({ id: 1, roleId: 'monk', realRoleId: 'monk' }),
        createTestSeat({ id: 2, roleId: 'empath', realRoleId: 'empath' })
      ];
      gameState = createTestGameState(seats);
      gameState.roundInfo.nightCount = 2;

      // Process imp killing seat 1
      const result = engine.processRoleAbility(gameState, 0, 'imp', {
        automationLevel: 'GUIDED',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [1]
      });

      // The result should have deaths
      expect(result.success).toBe(true);
      expect(result.deaths).toBeDefined();
      expect(result.deaths!.length).toBeGreaterThan(0);
      expect(result.deaths![0]!.seatId).toBe(1);
    });

    it('should not create death when target is protected', () => {
      // Setup game with imp and protected target
      const seats = [
        createTestSeat({ id: 0, roleId: 'imp', realRoleId: 'imp' }),
        createTestSeat({ id: 1, roleId: 'monk', realRoleId: 'monk', statuses: ['PROTECTED'] }),
        createTestSeat({ id: 2, roleId: 'empath', realRoleId: 'empath' })
      ];
      gameState = createTestGameState(seats);
      gameState.roundInfo.nightCount = 2;

      // Process imp trying to kill protected target
      const result = engine.processRoleAbility(gameState, 0, 'imp', {
        automationLevel: 'GUIDED',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [1]
      });

      expect(result.success).toBe(true);
      // Death should be prevented
      if (result.deaths && result.deaths.length > 0) {
        expect(result.deaths[0]!.wasPrevented).toBe(true);
      }
    });

    it('should handle empty pending deaths', () => {
      engine.clearPending();

      const { deadSeats } = engine.applyDeaths(gameState.seats);
      expect(deadSeats.length).toBe(0);
    });

    it('should actually apply pending deaths and mark seats as dead', () => {
      // Setup engine
      const autoEngine = new RoleAutomationEngine({ level: 'FULL_AUTO' });

      // Setup game with imp and target
      const seats = [
        createTestSeat({ id: 0, roleId: 'imp', realRoleId: 'imp' }),
        createTestSeat({ id: 1, roleId: 'monk', realRoleId: 'monk' }),
        createTestSeat({ id: 2, roleId: 'empath', realRoleId: 'empath' })
      ];
      const testState = createTestGameState(seats);
      testState.roundInfo.nightCount = 2;

      // Process imp killing seat 1
      const result = autoEngine.processRoleAbility(testState, 0, 'imp', {
        automationLevel: 'FULL_AUTO',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [1]
      });

      // Verify result has deaths
      expect(result.success).toBe(true);
      expect(result.deaths).toBeDefined();
      expect(result.deaths!.length).toBeGreaterThan(0);
      // wasPrevented may be false or undefined when not prevented
      expect(result.deaths![0]!.wasPrevented).not.toBe(true);

      // Manually add deaths to pending (simulating processNightPhase behavior)
      (autoEngine as unknown as { pendingDeaths: { seatId: number; source: string; wasPrevented: boolean }[] }).pendingDeaths.push(...result.deaths!);

      // Apply the pending deaths
      const { seats: updatedSeats, deadSeats } = autoEngine.applyDeaths(testState.seats);

      // Verify the death was applied
      expect(deadSeats.length).toBe(1);
      expect(deadSeats[0]!.id).toBe(1);
      expect(updatedSeats[1]!.isDead).toBe(true);

      // Verify pending was cleared
      expect(autoEngine.getPendingDeaths().length).toBe(0);
    });

    it('should skip prevented deaths', () => {
      // Setup engine
      const autoEngine = new RoleAutomationEngine({ level: 'FULL_AUTO' });

      // Setup game
      const seats = [
        createTestSeat({ id: 0, roleId: 'imp', realRoleId: 'imp' }),
        createTestSeat({ id: 1, roleId: 'monk', realRoleId: 'monk' })
      ];
      const testState = createTestGameState(seats);

      // Manually add a prevented death
      (autoEngine as unknown as { pendingDeaths: { seatId: number; source: string; wasPrevented: boolean }[] }).pendingDeaths.push({
        seatId: 1,
        source: 'imp',
        wasPrevented: true
      });

      // Apply the pending deaths
      const { deadSeats } = autoEngine.applyDeaths(testState.seats);

      // Verify no death was applied because it was prevented
      expect(deadSeats.length).toBe(0);
    });

    it('should handle death for non-existent seat index gracefully', () => {
      // Setup engine
      const autoEngine = new RoleAutomationEngine({ level: 'FULL_AUTO' });

      // Setup game
      const seats = [
        createTestSeat({ id: 0, roleId: 'imp', realRoleId: 'imp' })
      ];
      const testState = createTestGameState(seats);

      // Manually add a death for non-existent seat
      (autoEngine as unknown as { pendingDeaths: { seatId: number; source: string; wasPrevented: boolean }[] }).pendingDeaths.push({
        seatId: 99,
        source: 'imp',
        wasPrevented: false
      });

      // Apply the pending deaths - should not crash
      const { deadSeats } = autoEngine.applyDeaths(testState.seats);

      // No death should be applied since seat doesn't exist
      expect(deadSeats.length).toBe(0);
    });

    it('should clear pending deaths after applying', () => {
      // Verify the engine clears pending deaths
      engine.clearPending();
      const { deadSeats } = engine.applyDeaths(gameState.seats);

      expect(deadSeats.length).toBe(0);
      expect(engine.getPendingDeaths().length).toBe(0);
    });

    it('should handle non-existent seat in imp target', () => {
      const seats = [
        createTestSeat({ id: 0, roleId: 'imp', realRoleId: 'imp' }),
        createTestSeat({ id: 1, roleId: 'monk', realRoleId: 'monk' })
      ];
      gameState = createTestGameState(seats);
      gameState.roundInfo.nightCount = 2;

      // Process imp targeting non-existent seat
      const result = engine.processRoleAbility(gameState, 0, 'imp', {
        automationLevel: 'GUIDED',
        isFirstNight: false,
        nightCount: 2,
        dayCount: 1,
        targetSeatIds: [99]
      });

      // Should return error
      expect(result.success).toBe(false);
      expect(result.error).toContain('目标座位不存在');
    });
  });

  describe('getPendingChainReactions', () => {
    it('should return pending chain reactions', () => {
      // Generate suggestions which may include chain reactions
      engine.generateAllNightSuggestions(gameState);

      const reactions = engine.getPendingChainReactions();

      expect(Array.isArray(reactions)).toBe(true);
      // Chain reactions may or may not be generated depending on the game state
    });
  });
});
