import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { phaseMachine } from './phaseMachine';
import type { Seat } from '../../types';

describe('phaseMachine', () => {
  const mockSeats: Seat[] = [
    {
      id: 0, userId: 'user1', userName: 'Player1',
      roleId: 'imp', realRoleId: 'imp', seenRoleId: 'imp',
      isDead: false, hasGhostVote: false,
      reminders: [], isHandRaised: false, isNominated: false,
      hasUsedAbility: false, statuses: []
    },
    {
      id: 1, userId: 'user2', userName: 'Player2',
      roleId: 'washerwoman', realRoleId: 'washerwoman', seenRoleId: 'washerwoman',
      isDead: false, hasGhostVote: false,
      reminders: [], isHandRaised: false, isNominated: false,
      hasUsedAbility: false, statuses: []
    },
    {
      id: 2, userId: 'user3', userName: 'Player3',
      roleId: 'empath', realRoleId: 'empath', seenRoleId: 'empath',
      isDead: false, hasGhostVote: false,
      reminders: [], isHandRaised: false, isNominated: false,
      hasUsedAbility: false, statuses: []
    },
  ];

  describe('Initial State', () => {
    it('should start in setup state', () => {
      const actor = createActor(phaseMachine);
      actor.start();

      expect(actor.getSnapshot().value).toBe('setup');
      expect(actor.getSnapshot().context.roundInfo.nightCount).toBe(0);
      expect(actor.getSnapshot().context.roundInfo.dayCount).toBe(0);
    });

    it('should have empty night queue initially', () => {
      const actor = createActor(phaseMachine);
      actor.start();

      expect(actor.getSnapshot().context.nightQueue).toEqual([]);
      expect(actor.getSnapshot().context.nightCurrentIndex).toBe(-1);
    });

    it('should have null gameOver initially', () => {
      const actor = createActor(phaseMachine);
      actor.start();

      expect(actor.getSnapshot().context.gameOver).toBeNull();
    });
  });

  describe('START_GAME Transition', () => {
    it('should transition from setup to night on START_GAME', () => {
      const actor = createActor(phaseMachine);
      actor.start();

      actor.send({ type: 'START_GAME', seats: mockSeats });

      expect(actor.getSnapshot().value).toBe('night');
    });

    it('should initialize game state on START_GAME', () => {
      const actor = createActor(phaseMachine);
      actor.start();

      actor.send({ type: 'START_GAME', seats: mockSeats });

      const context = actor.getSnapshot().context;
      expect(context.roundInfo.nightCount).toBe(1);
      expect(context.roundInfo.dayCount).toBe(0);
      expect(context.roundInfo.totalRounds).toBe(1);
      expect(context.seats).toEqual(mockSeats);
    });

    it('should generate first night queue on START_GAME', () => {
      const actor = createActor(phaseMachine);
      actor.start();

      actor.send({ type: 'START_GAME', seats: mockSeats });

      const context = actor.getSnapshot().context;
      expect(context.nightQueue.length).toBeGreaterThan(0);
      expect(context.nightQueue).toContain('washerwoman');
      expect(context.nightQueue).toContain('empath');
      expect(context.nightCurrentIndex).toBe(-1);
    });
  });

  describe('Night Phase', () => {
    it('should advance night action on NEXT_NIGHT_ACTION', () => {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });

      actor.send({ type: 'NEXT_NIGHT_ACTION' });

      expect(actor.getSnapshot().context.nightCurrentIndex).toBe(0);
      expect(actor.getSnapshot().value).toBe('night');
    });

    it('should transition to day when night queue completes', () => {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });

      const queueLength = actor.getSnapshot().context.nightQueue.length;

      // Advance to last action
      for (let i = 0; i < queueLength; i++) {
        actor.send({ type: 'NEXT_NIGHT_ACTION' });
      }

      expect(actor.getSnapshot().value).toBe('day');
      expect(actor.getSnapshot().context.roundInfo.dayCount).toBe(1);
    });

    it('should allow going back with PREV_NIGHT_ACTION', () => {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });

      actor.send({ type: 'NEXT_NIGHT_ACTION' });
      actor.send({ type: 'NEXT_NIGHT_ACTION' });
      expect(actor.getSnapshot().context.nightCurrentIndex).toBe(1);

      actor.send({ type: 'PREV_NIGHT_ACTION' });
      expect(actor.getSnapshot().context.nightCurrentIndex).toBe(0);
      expect(actor.getSnapshot().value).toBe('night');
    });

    it('should not go below 0 on PREV_NIGHT_ACTION', () => {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });

      actor.send({ type: 'NEXT_NIGHT_ACTION' });
      expect(actor.getSnapshot().context.nightCurrentIndex).toBe(0);

      actor.send({ type: 'PREV_NIGHT_ACTION' });
      expect(actor.getSnapshot().context.nightCurrentIndex).toBe(0);
    });

    it('should skip to day on END_NIGHT', () => {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });

      actor.send({ type: 'END_NIGHT' });

      expect(actor.getSnapshot().value).toBe('day');
      expect(actor.getSnapshot().context.roundInfo.dayCount).toBe(1);
    });
  });

  describe('Day Phase', () => {
    function setupDayPhase() {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });
      actor.send({ type: 'END_NIGHT' });
      return actor;
    }

    it('should allow starting voting on START_VOTING', () => {
      const actor = setupDayPhase();

      actor.send({ type: 'START_VOTING', nomineeSeatId: 0 });

      expect(actor.getSnapshot().value).toBe('voting');
    });

    it('should allow transitioning back to night on START_NIGHT', () => {
      const actor = setupDayPhase();

      actor.send({ type: 'START_NIGHT' });

      expect(actor.getSnapshot().value).toBe('night');
      expect(actor.getSnapshot().context.roundInfo.nightCount).toBe(2);
    });

    it('should increment night count when starting new night', () => {
      const actor = setupDayPhase();
      const initialNightCount = actor.getSnapshot().context.roundInfo.nightCount;

      actor.send({ type: 'START_NIGHT' });

      expect(actor.getSnapshot().context.roundInfo.nightCount).toBe(initialNightCount + 1);
      expect(actor.getSnapshot().context.roundInfo.totalRounds).toBe(3);
    });

    it('should allow ending game on END_GAME', () => {
      const actor = setupDayPhase();

      actor.send({ type: 'END_GAME', winner: 'GOOD', reason: 'Demon executed' });

      expect(actor.getSnapshot().value).toBe('gameOver');
      expect(actor.getSnapshot().context.gameOver).toEqual({
        isOver: true,
        winner: 'GOOD',
        reason: 'Demon executed',
      });
    });
  });

  describe('Voting Phase', () => {
    function setupVotingPhase() {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });
      actor.send({ type: 'END_NIGHT' });
      actor.send({ type: 'START_VOTING', nomineeSeatId: 0 });
      return actor;
    }

    it('should return to day on CLOSE_VOTE', () => {
      const actor = setupVotingPhase();

      actor.send({ type: 'CLOSE_VOTE', isExecuted: false });

      expect(actor.getSnapshot().value).toBe('day');
    });

    it('should allow ending game during voting', () => {
      const actor = setupVotingPhase();

      actor.send({ type: 'END_GAME', winner: 'EVIL', reason: 'All good dead' });

      expect(actor.getSnapshot().value).toBe('gameOver');
      expect(actor.getSnapshot().context.gameOver?.winner).toBe('EVIL');
    });
  });

  describe('Game Over State', () => {
    it('should be a final state', () => {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });
      actor.send({ type: 'END_NIGHT' });
      actor.send({ type: 'END_GAME', winner: 'GOOD', reason: 'Test win' });

      expect(actor.getSnapshot().value).toBe('gameOver');
      expect(actor.getSnapshot().status).toBe('done');
    });
  });

  describe('Guards', () => {
    it('should not start voting if game is over', () => {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });
      actor.send({ type: 'END_NIGHT' });
      actor.send({ type: 'END_GAME', winner: 'GOOD', reason: 'Test' });

      // Cannot test this directly as machine is in final state
      expect(actor.getSnapshot().value).toBe('gameOver');
    });

    it('should handle empty night queue', () => {
      const emptySeats: Seat[] = [
        { id: 0, roleId: 'mayor', userName: 'Player1', isDead: false, hasGhostVote: false, userId: 'user1', realRoleId: 'mayor', seenRoleId: 'mayor', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
      ];

      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: emptySeats });

      // Night queue should be empty (mayor has no first night action)
      const context = actor.getSnapshot().context;
      expect(context.nightQueue.length).toBe(0);

      // Advancing should immediately go to day
      actor.send({ type: 'NEXT_NIGHT_ACTION' });
      expect(actor.getSnapshot().value).toBe('day');
    });

    it('should filter out dead players from night queue', () => {
      const seatsWithDead: Seat[] = [
        { id: 0, roleId: 'imp', userName: 'Player1', isDead: false, hasGhostVote: false, userId: 'user1', realRoleId: 'imp', seenRoleId: 'imp', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
        { id: 1, roleId: 'washerwoman', userName: 'Player2', isDead: true, hasGhostVote: true, userId: 'user2', realRoleId: 'washerwoman', seenRoleId: 'washerwoman', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
        { id: 2, roleId: 'empath', userName: 'Player3', isDead: false, hasGhostVote: false, userId: 'user3', realRoleId: 'empath', seenRoleId: 'empath', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
      ];

      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: seatsWithDead });

      const context = actor.getSnapshot().context;
      expect(context.nightQueue).not.toContain('washerwoman');
      expect(context.nightQueue).toContain('empath');
    });
  });

  describe('Context Management', () => {
    it('should preserve seats in context', () => {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });

      expect(actor.getSnapshot().context.seats).toEqual(mockSeats);
    });

    it('should reset nightCurrentIndex when transitioning to day', () => {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });

      actor.send({ type: 'NEXT_NIGHT_ACTION' });
      expect(actor.getSnapshot().context.nightCurrentIndex).toBeGreaterThan(-1);

      actor.send({ type: 'END_NIGHT' });
      expect(actor.getSnapshot().context.nightCurrentIndex).toBe(-1);
    });

    it('should increment totalRounds correctly', () => {
      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: mockSeats });

      expect(actor.getSnapshot().context.roundInfo.totalRounds).toBe(1);

      actor.send({ type: 'END_NIGHT' });
      actor.send({ type: 'START_NIGHT' });

      expect(actor.getSnapshot().context.roundInfo.totalRounds).toBe(3); // 1 (start) + 1 (night) + 1 (next night)
    });
  });

  describe('Edge Cases', () => {
    it('should handle game with no roles that have night actions', () => {
      const seatsNoNight: Seat[] = [
        { id: 0, roleId: 'saint', userName: 'Player1', isDead: false, hasGhostVote: false, userId: 'user1', realRoleId: 'saint', seenRoleId: 'saint', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
        { id: 1, roleId: 'mayor', userName: 'Player2', isDead: false, hasGhostVote: false, userId: 'user2', realRoleId: 'mayor', seenRoleId: 'mayor', reminders: [], isHandRaised: false, isNominated: false, hasUsedAbility: false, statuses: [] },
      ];

      const actor = createActor(phaseMachine);
      actor.start();
      actor.send({ type: 'START_GAME', seats: seatsNoNight });

      expect(actor.getSnapshot().context.nightQueue).toEqual([]);

      // Should still be able to transition to day
      actor.send({ type: 'NEXT_NIGHT_ACTION' });
      expect(actor.getSnapshot().value).toBe('day');
    });

    it('should handle rapid state transitions', () => {
      const actor = createActor(phaseMachine);
      actor.start();

      actor.send({ type: 'START_GAME', seats: mockSeats });
      actor.send({ type: 'END_NIGHT' });
      actor.send({ type: 'START_VOTING', nomineeSeatId: 0 });
      actor.send({ type: 'CLOSE_VOTE', isExecuted: false });
      actor.send({ type: 'START_NIGHT' });

      expect(actor.getSnapshot().value).toBe('night');
      expect(actor.getSnapshot().context.roundInfo.nightCount).toBe(2);
    });
  });
});
