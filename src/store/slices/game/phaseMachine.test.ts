import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPhaseMachineSlice } from './phaseMachine';
import type { Seat } from '../../../types';

describe('PhaseMachine Slice Integration', () => {
  const mockSet = vi.fn();
  const mockGet = vi.fn();
  let slice: ReturnType<typeof createPhaseMachineSlice>;

  const mockSeats: Seat[] = [
    { id: 0, roleId: 'imp', userName: 'Player1', isDead: false, isGhost: false, votes: 1, userId: 'user1' },
    { id: 1, roleId: 'washerwoman', userName: 'Player2', isDead: false, isGhost: false, votes: 1, userId: 'user2' },
    { id: 2, roleId: 'empath', userName: 'Player3', isDead: false, isGhost: false, votes: 1, userId: 'user3' },
  ];

  beforeEach(() => {
    mockSet.mockClear();
    mockGet.mockClear();

    // Make mockSet actually update the slice object
    mockSet.mockImplementation((updates: any) => {
      if (typeof updates === 'function') {
        // If updates is a function (Immer style), we'd need full Immer support
        // For now just assign directly
        return;
      }
      Object.assign(slice, updates);
    });

    slice = createPhaseMachineSlice(mockSet, mockGet as any);
    mockGet.mockReturnValue(slice);
  });

  describe('Initialization', () => {
    it('should start with null actor and setup state', () => {
      expect(slice.phaseActor).toBeNull();
      expect(slice.phaseState).toBe('setup');
      expect(slice.phaseContext.roundInfo.nightCount).toBe(0);
      expect(slice.phaseContext.roundInfo.dayCount).toBe(0);
    });

    it('should initialize phase machine actor', () => {
      slice.initializePhaseMachine();

      expect(slice.phaseActor).not.toBeNull();
      expect(mockSet).toHaveBeenCalled();
    });

    it('should subscribe to actor state changes', () => {
      slice.initializePhaseMachine();

      // mockSet should have been called to update phaseState and phaseContext
      expect(mockSet).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      slice.initializePhaseMachine();
      mockSet.mockClear();
    });

    it('should send START_GAME event', () => {
      slice.phaseMachine.startGame(mockSeats);

      // Check that state was updated
      expect(slice.phaseState).toBe('night');
      expect(slice.phaseContext.seats).toEqual(mockSeats);
      expect(slice.phaseContext.roundInfo.nightCount).toBe(1);
    });

    it('should send NEXT_NIGHT_ACTION event', () => {
      slice.phaseMachine.startGame(mockSeats);
      slice.phaseMachine.nextNightAction();

      expect(slice.phaseContext.nightCurrentIndex).toBe(0);
    });

    it('should send END_NIGHT event', () => {
      slice.phaseMachine.startGame(mockSeats);
      slice.phaseMachine.endNight();

      expect(slice.phaseState).toBe('day');
      expect(slice.phaseContext.roundInfo.dayCount).toBe(1);
    });

    it('should send START_VOTING event', () => {
      slice.phaseMachine.startGame(mockSeats);
      slice.phaseMachine.endNight();
      slice.phaseMachine.startVoting(0);

      expect(slice.phaseState).toBe('voting');
    });

    it('should send CLOSE_VOTE event', () => {
      slice.phaseMachine.startGame(mockSeats);
      slice.phaseMachine.endNight();
      slice.phaseMachine.startVoting(0);
      slice.phaseMachine.closeVote(false);

      expect(slice.phaseState).toBe('day');
    });

    it('should send END_GAME event', () => {
      slice.phaseMachine.startGame(mockSeats);
      slice.phaseMachine.endNight();
      slice.phaseMachine.endGame('GOOD', 'Demon executed');

      expect(slice.phaseState).toBe('gameOver');
      expect(slice.phaseContext.gameOver).toEqual({
        isOver: true,
        winner: 'GOOD',
        reason: 'Demon executed',
      });
    });
  });

  describe('Cleanup', () => {
    beforeEach(() => {
      slice.initializePhaseMachine();
    });

    it('should stop phase machine actor', () => {
      slice.stopPhaseMachine();

      expect(slice.phaseActor).toBeNull();
      expect(slice.phaseState).toBe('setup');
    });

    it('should handle stopping when no actor exists', () => {
      slice.stopPhaseMachine();

      // Call again with no actor
      slice.stopPhaseMachine();

      // Should not throw
      expect(slice.phaseActor).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle events when actor is null', () => {
      // Don't initialize actor
      slice.phaseMachine.startGame(mockSeats);

      // Should not throw
      expect(slice.phaseActor).toBeNull();
    });

    it('should restart actor if initialized twice', () => {
      slice.initializePhaseMachine();
      const firstActor = slice.phaseActor;

      slice.initializePhaseMachine();
      const secondActor = slice.phaseActor;

      expect(secondActor).not.toBeNull();
      expect(secondActor).not.toBe(firstActor);
    });
  });
});
