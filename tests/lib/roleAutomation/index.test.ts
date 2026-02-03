/**
 * Role Automation Index Module Tests
 *
 * 测试角色自动化模块的导出
 */

import { describe, it, expect } from 'vitest';

// Import all exports to verify they are accessible
import {
  // Types
  type AutomationLevel,
  type AbilityType,
  type TriggerTiming,
  type AutomationSuggestion,
  type AutomationOption,
  type RoleAbilityDef,
  type AbilityContext,
  type AbilityResult,
  type StatusChange,
  type DeathEvent,
  type ChainReaction,
  type RuleViolationRequest,
  type RoleAutomationConfig,

  // Constants
  DEFAULT_AUTOMATION_CONFIG,
  ROLE_AUTOMATION_CATEGORIES,
  TROUBLE_BREWING_ROLES,

  // Engine
  RoleAutomationEngine,
  getAutomationEngine,
  resetAutomationEngine,

  // Utils
  isTainted,
  isProtected,
  getRealRoleId,
  getSeenRoleId,
  isEvil,
  getTeamFromRoleId,
  getAlivePlayers,
  getDeadPlayers,
  getNeighbors,
  getAliveNeighbors,
  countEvilPairs,
  findDemon,
  findMinions,
  findRoleSeats,
  getRandomSeat,
  getRandomSeatByTeam,
  generateId,
  applyStatusChange,
  clearNightStatuses,
  formatSeatName,
  formatRoleName,
  isInfoRole,
  hasNightAction,

  // Trouble Brewing processors
  processTroubleBrewingRole,
  TROUBLE_BREWING_PROCESSORS,
  TOWNSFOLK_PROCESSORS,
  OUTSIDER_PROCESSORS,
  MINION_PROCESSORS,
  DEMON_PROCESSORS
} from '../../../src/lib/roleAutomation';

type _UnusedTypeExports =
  | AbilityType
  | TriggerTiming
  | AutomationSuggestion
  | AutomationOption
  | RoleAbilityDef
  | RuleViolationRequest
  | RoleAutomationConfig;

const _unusedTypeCheck = null as _UnusedTypeExports | null;
void _unusedTypeCheck;

describe('roleAutomation module exports', () => {
  describe('Constants', () => {
    it('should export DEFAULT_AUTOMATION_CONFIG', () => {
      expect(DEFAULT_AUTOMATION_CONFIG).toBeDefined();
      expect(DEFAULT_AUTOMATION_CONFIG.level).toBeDefined();
    });

    it('should export ROLE_AUTOMATION_CATEGORIES', () => {
      expect(ROLE_AUTOMATION_CATEGORIES).toBeDefined();
      expect(typeof ROLE_AUTOMATION_CATEGORIES).toBe('object');
      // Check it has the expected structure
      expect(ROLE_AUTOMATION_CATEGORIES.fullyAutomatable).toBeDefined();
      expect(Array.isArray(ROLE_AUTOMATION_CATEGORIES.fullyAutomatable)).toBe(true);
    });

    it('should export TROUBLE_BREWING_ROLES', () => {
      expect(TROUBLE_BREWING_ROLES).toBeDefined();
      expect(typeof TROUBLE_BREWING_ROLES).toBe('object');
    });
  });

  describe('Engine exports', () => {
    it('should export RoleAutomationEngine class', () => {
      expect(RoleAutomationEngine).toBeDefined();
      const engine = new RoleAutomationEngine();
      expect(engine).toBeInstanceOf(RoleAutomationEngine);
    });

    it('should export getAutomationEngine singleton getter', () => {
      expect(getAutomationEngine).toBeDefined();
      expect(typeof getAutomationEngine).toBe('function');

      const engine = getAutomationEngine();
      expect(engine).toBeInstanceOf(RoleAutomationEngine);
    });

    it('should export resetAutomationEngine function', () => {
      expect(resetAutomationEngine).toBeDefined();
      expect(typeof resetAutomationEngine).toBe('function');

      resetAutomationEngine();
      const engine = getAutomationEngine();
      expect(engine).toBeInstanceOf(RoleAutomationEngine);
    });

    it('should return same engine instance from getAutomationEngine', () => {
      resetAutomationEngine();
      const engine1 = getAutomationEngine();
      const engine2 = getAutomationEngine();
      expect(engine1).toBe(engine2);
    });

    it('should accept custom config in getAutomationEngine', () => {
      resetAutomationEngine();
      const engine = getAutomationEngine({ level: 'FULL_AUTO' });
      expect(engine.getAutomationLevel()).toBe('FULL_AUTO');
    });
  });

  describe('Utility function exports', () => {
    it('should export isTainted', () => {
      expect(typeof isTainted).toBe('function');
    });

    it('should export isProtected', () => {
      expect(typeof isProtected).toBe('function');
    });

    it('should export getRealRoleId', () => {
      expect(typeof getRealRoleId).toBe('function');
    });

    it('should export getSeenRoleId', () => {
      expect(typeof getSeenRoleId).toBe('function');
    });

    it('should export isEvil', () => {
      expect(typeof isEvil).toBe('function');
    });

    it('should export getTeamFromRoleId', () => {
      expect(typeof getTeamFromRoleId).toBe('function');
    });

    it('should export getAlivePlayers', () => {
      expect(typeof getAlivePlayers).toBe('function');
    });

    it('should export getDeadPlayers', () => {
      expect(typeof getDeadPlayers).toBe('function');
    });

    it('should export getNeighbors', () => {
      expect(typeof getNeighbors).toBe('function');
    });

    it('should export getAliveNeighbors', () => {
      expect(typeof getAliveNeighbors).toBe('function');
    });

    it('should export countEvilPairs', () => {
      expect(typeof countEvilPairs).toBe('function');
    });

    it('should export findDemon', () => {
      expect(typeof findDemon).toBe('function');
    });

    it('should export findMinions', () => {
      expect(typeof findMinions).toBe('function');
    });

    it('should export findRoleSeats', () => {
      expect(typeof findRoleSeats).toBe('function');
    });

    it('should export getRandomSeat', () => {
      expect(typeof getRandomSeat).toBe('function');
    });

    it('should export getRandomSeatByTeam', () => {
      expect(typeof getRandomSeatByTeam).toBe('function');
    });

    it('should export generateId', () => {
      expect(typeof generateId).toBe('function');
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should export applyStatusChange', () => {
      expect(typeof applyStatusChange).toBe('function');
    });

    it('should export clearNightStatuses', () => {
      expect(typeof clearNightStatuses).toBe('function');
    });

    it('should export formatSeatName', () => {
      expect(typeof formatSeatName).toBe('function');
    });

    it('should export formatRoleName', () => {
      expect(typeof formatRoleName).toBe('function');
    });

    it('should export isInfoRole', () => {
      expect(typeof isInfoRole).toBe('function');
    });

    it('should export hasNightAction', () => {
      expect(typeof hasNightAction).toBe('function');
    });
  });

  describe('Trouble Brewing processor exports', () => {
    it('should export processTroubleBrewingRole', () => {
      expect(typeof processTroubleBrewingRole).toBe('function');
    });

    it('should export TROUBLE_BREWING_PROCESSORS', () => {
      expect(TROUBLE_BREWING_PROCESSORS).toBeDefined();
      expect(typeof TROUBLE_BREWING_PROCESSORS).toBe('object');
    });

    it('should export TOWNSFOLK_PROCESSORS', () => {
      expect(TOWNSFOLK_PROCESSORS).toBeDefined();
      expect(typeof TOWNSFOLK_PROCESSORS).toBe('object');
      // Check some expected processors
      expect(TOWNSFOLK_PROCESSORS.washerwoman).toBeDefined();
      expect(TOWNSFOLK_PROCESSORS.librarian).toBeDefined();
      expect(TOWNSFOLK_PROCESSORS.chef).toBeDefined();
    });

    it('should export OUTSIDER_PROCESSORS', () => {
      expect(OUTSIDER_PROCESSORS).toBeDefined();
      expect(typeof OUTSIDER_PROCESSORS).toBe('object');
      // Check expected processors
      expect(OUTSIDER_PROCESSORS.butler).toBeDefined();
      expect(OUTSIDER_PROCESSORS.drunk).toBeDefined();
      expect(OUTSIDER_PROCESSORS.recluse).toBeDefined();
      expect(OUTSIDER_PROCESSORS.saint).toBeDefined();
    });

    it('should export MINION_PROCESSORS', () => {
      expect(MINION_PROCESSORS).toBeDefined();
      expect(typeof MINION_PROCESSORS).toBe('object');
      // Check expected processors
      expect(MINION_PROCESSORS.poisoner).toBeDefined();
      expect(MINION_PROCESSORS.spy).toBeDefined();
      expect(MINION_PROCESSORS.scarlet_woman).toBeDefined();
      expect(MINION_PROCESSORS.baron).toBeDefined();
    });

    it('should export DEMON_PROCESSORS', () => {
      expect(DEMON_PROCESSORS).toBeDefined();
      expect(typeof DEMON_PROCESSORS).toBe('object');
      // Check expected processors
      expect(DEMON_PROCESSORS.imp).toBeDefined();
    });

    it('should return error for unknown role in processTroubleBrewingRole', () => {
      // Create a minimal game state for testing
      const gameState = {
        roomId: 'test-room',
        currentScriptId: 'tb',
        phase: 'NIGHT' as const,
        setupPhase: 'READY' as const,
        rolesRevealed: false,
        allowWhispers: false,
        vibrationEnabled: true,
        seats: [{
          id: 0,
          userId: 'user1',
          userName: 'Player1',
          isDead: false,
          hasGhostVote: true,
          roleId: 'unknown_role',
          realRoleId: 'unknown_role',
          seenRoleId: null,
          reminders: [],
          isHandRaised: false,
          isNominated: false,
          hasUsedAbility: false,
          statuses: []
        }],
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
        skillDescriptionMode: 'simple' as const,
        aiMessages: [],
        nightActionRequests: [],
        candlelightEnabled: false,
        dailyExecutionCompleted: false,
        dailyNominations: [],
        interactionLog: []
      };

      const context: AbilityContext = {
        automationLevel: 'GUIDED',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      };

      const result = processTroubleBrewingRole('nonexistent_role', gameState, 0, context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('未知角色');
      expect(result.error).toContain('nonexistent_role');
    });
  });

  describe('Type exports (compile-time check)', () => {
    // These tests verify type exports at compile-time
    // If they compile successfully, the types are properly exported

    it('should have valid AutomationLevel type', () => {
      const level: AutomationLevel = 'GUIDED';
      expect(level).toBe('GUIDED');
    });

    it('should have valid AbilityContext type', () => {
      const context: AbilityContext = {
        automationLevel: 'GUIDED',
        isFirstNight: true,
        nightCount: 1,
        dayCount: 0
      };
      expect(context.automationLevel).toBe('GUIDED');
    });

    it('should have valid AbilityResult type', () => {
      const result: AbilityResult = {
        success: true,
        suggestions: []
      };
      expect(result.success).toBe(true);
    });

    it('should have valid StatusChange type', () => {
      const statusChange: StatusChange = {
        seatId: 0,
        status: 'POISONED',
        action: 'add',
        source: 'poisoner'
      };
      expect(statusChange.status).toBe('POISONED');
    });

    it('should have valid DeathEvent type', () => {
      const death: DeathEvent = {
        seatId: 0,
        cause: 'demon_kill',
        killerRoleId: 'imp',
        isPreventable: true,
        wasPrevented: false
      };
      expect(death.wasPrevented).toBe(false);
    });

    it('should have valid ChainReaction type', () => {
      const reaction: ChainReaction = {
        type: 'scarlet_woman_transform',
        description: 'test',
        targetSeatId: 0
      };
      expect(reaction.type).toBe('scarlet_woman_transform');
    });
  });
});
