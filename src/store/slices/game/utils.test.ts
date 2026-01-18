import { describe, it, expect } from 'vitest';
import { getInitialState, applyRoleAssignment, fallbackTownsfolk } from './utils';
import { Seat, GameState, SeatStatus } from '../../../types';

describe('store/slices/game/utils', () => {
  describe('getInitialState', () => {
    it('should create initial state with given room id and seat count', () => {
      const state = getInitialState('ABC123', 5);
      
      expect(state.roomId).toBe('ABC123');
      expect(state.seats).toHaveLength(5);
      expect(state.phase).toBe('SETUP');
      expect(state.setupPhase).toBe('ASSIGNING');
    });

    it('should create seats with correct initial values', () => {
      const state = getInitialState('TEST', 3);
      
      expect(state.seats[0]).toEqual({
        id: 0,
        userId: null,
        userName: '座位 1',
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
        voteLocked: false,
        isVirtual: false,
      });
    });

    it('should use custom script id if provided', () => {
      const state = getInitialState('ROOM', 4, 'sects_and_violets');
      expect(state.currentScriptId).toBe('sects_and_violets');
    });

    it('should default to tb script', () => {
      const state = getInitialState('ROOM', 4);
      expect(state.currentScriptId).toBe('tb');
    });

    it('should initialize audio settings', () => {
      const state = getInitialState('ROOM', 4);
      expect(state.audio).toEqual({
        trackId: null,
        isPlaying: false,
        volume: 0.5,
      });
    });

    it('should initialize game over state', () => {
      const state = getInitialState('ROOM', 4);
      expect(state.gameOver).toEqual({
        isOver: false,
        winner: null,
        reason: '',
      });
    });

    it('should initialize round info', () => {
      const state = getInitialState('ROOM', 4);
      expect(state.roundInfo).toEqual({
        dayCount: 0,
        nightCount: 0,
        nominationCount: 0,
        totalRounds: 0,
      });
    });

    it('should initialize v2.0 fields', () => {
      const state = getInitialState('ROOM', 4);
      expect(state.candlelightEnabled).toBe(false);
      expect(state.dailyNominations).toEqual([]);
      expect(state.interactionLog).toEqual([]);
    });
  });

  describe('fallbackTownsfolk', () => {
    it('should contain standard townsfolk roles', () => {
      expect(fallbackTownsfolk).toContain('washerwoman');
      expect(fallbackTownsfolk).toContain('librarian');
      expect(fallbackTownsfolk).toContain('investigator');
      expect(fallbackTownsfolk).toContain('chef');
      expect(fallbackTownsfolk).toContain('empath');
      expect(fallbackTownsfolk).toContain('fortune_teller');
      expect(fallbackTownsfolk).toContain('undertaker');
      expect(fallbackTownsfolk).toContain('monk');
      expect(fallbackTownsfolk).toContain('ravenkeeper');
    });
  });

  describe('applyRoleAssignment', () => {
    const createMockGameState = (seatCount = 5): GameState =>
      getInitialState('TEST', seatCount, 'tb');

    it('should assign role to seat', () => {
      const state = createMockGameState();
      const seat = state.seats[0]!;

      applyRoleAssignment(state, seat, 'washerwoman');

      expect(seat.realRoleId).toBe('washerwoman');
      expect(seat.seenRoleId).toBe('washerwoman');
      expect(seat.roleId).toBe('washerwoman');
    });

    it('should reset hasUsedAbility when assigning role', () => {
      const state = createMockGameState();
      const seat = state.seats[0]!;
      seat.hasUsedAbility = true;

      applyRoleAssignment(state, seat, 'chef');

      expect(seat.hasUsedAbility).toBe(false);
    });

    it('should reset statuses when assigning role', () => {
      const state = createMockGameState();
      const seat = state.seats[0]!;
      seat.statuses = ['POISONED', 'DRUNK'] as SeatStatus[];

      applyRoleAssignment(state, seat, 'empath');

      expect(seat.statuses).toEqual([]);
    });

    it('should handle null role assignment', () => {
      const state = createMockGameState();
      const seat = state.seats[0]!;
      seat.realRoleId = 'washerwoman';
      seat.seenRoleId = 'washerwoman';

      applyRoleAssignment(state, seat, null);

      expect(seat.realRoleId).toBeNull();
      expect(seat.seenRoleId).toBeNull();
    });

    it('should assign fake townsfolk role to drunk', () => {
      const state = createMockGameState();
      const seat = state.seats[0]!;

      applyRoleAssignment(state, seat, 'drunk');

      expect(seat.realRoleId).toBe('drunk');
      // seenRoleId should be a townsfolk
      expect(seat.seenRoleId).not.toBe('drunk');
      expect(seat.seenRoleId).not.toBeNull();
    });

    it('should assign demon role to lunatic', () => {
      const state = createMockGameState();
      state.currentScriptId = 'tb';
      const seat = state.seats[0]!;

      applyRoleAssignment(state, seat, 'lunatic');

      expect(seat.realRoleId).toBe('lunatic');
      // seenRoleId should be a demon (imp for TB)
      expect(seat.seenRoleId).toBeDefined();
    });

    it('should assign fake townsfolk role to marionette', () => {
      const state = createMockGameState();
      const seat = state.seats[0]!;

      applyRoleAssignment(state, seat, 'marionette');

      expect(seat.realRoleId).toBe('marionette');
      // seenRoleId should be a townsfolk
      expect(seat.seenRoleId).not.toBe('marionette');
      expect(seat.seenRoleId).not.toBeNull();
    });

    it('should not reuse already assigned roles for fake assignments', () => {
      const state = createMockGameState(3);
      // Assign washerwoman to first seat
      state.seats[0]!.realRoleId = 'washerwoman';
      state.seats[0]!.seenRoleId = 'washerwoman';

      // Assign drunk to second seat
      applyRoleAssignment(state, state.seats[1]!, 'drunk');

      // The fake role should not be washerwoman
      expect(state.seats[1]!.seenRoleId).not.toBe('washerwoman');
    });

    it('should handle undefined seat gracefully', () => {
      const state = createMockGameState();
      // Should not throw
      applyRoleAssignment(state, undefined as unknown as Seat, 'washerwoman');
    });
  });
});
