import { describe, it, expect } from 'vitest';
import { generateRoleAssignment, getStandardComposition, checkGameOver, checkGoodWin, checkEvilWin } from './gameLogic';
import type { Seat, SeatStatus } from '../types';

// Helper to create a mock seat
const createMockSeat = (
  id: number,
  realRoleId: string | null,
  isDead = false,
  statuses: SeatStatus[] = []
): Seat => ({
  id,
  userId: `user-${id}`,
  userName: `Player ${id}`,
  isDead,
  hasGhostVote: isDead,
  roleId: realRoleId,
  realRoleId,
  seenRoleId: realRoleId,
  reminders: [],
  isHandRaised: false,
  isNominated: false,
  hasUsedAbility: false,
  statuses,
});

describe('gameLogic', () => {
  describe('getStandardComposition', () => {
    it('should return correct setup numbers for 5 players', () => {
      const rules = getStandardComposition(5);
      expect(rules).toEqual({ townsfolk: 3, outsider: 0, minion: 1, demon: 1 });
    });

    it('should return correct setup numbers for 12 players', () => {
      const rules = getStandardComposition(12);
      expect(rules).toEqual({ townsfolk: 7, outsider: 2, minion: 2, demon: 1 });
    });

    it('should return correct setup numbers for 15 players', () => {
      const rules = getStandardComposition(15);
      expect(rules).toEqual({ townsfolk: 9, outsider: 2, minion: 3, demon: 1 });
    });
  });

  describe('generateRoleAssignment', () => {
    it('should generate correct number of roles for 5 players', () => {
      const roles = generateRoleAssignment('tb', 5);
      expect(roles).toHaveLength(5);
      // Basic check for composition could be added here if we mock the randomizer or check types
    });

  });

  describe('checkGoodWin', () => {
    it('should return true when all demons are dead', () => {
      const seats = [
        createMockSeat(0, 'washerwoman'),
        createMockSeat(1, 'imp', true), // Demon is dead
        createMockSeat(2, 'poisoner'),
      ];
      expect(checkGoodWin(seats)).toBe(true);
    });

    it('should return false when demon is still alive', () => {
      const seats = [
        createMockSeat(0, 'washerwoman'),
        createMockSeat(1, 'imp', false), // Demon is alive
        createMockSeat(2, 'poisoner', true),
      ];
      expect(checkGoodWin(seats)).toBe(false);
    });
  });

  describe('checkEvilWin', () => {
    it('should return true when 2 or fewer players are alive', () => {
      const seats = [
        createMockSeat(0, 'washerwoman', true),
        createMockSeat(1, 'imp', false),
        createMockSeat(2, 'poisoner', false),
        createMockSeat(3, 'chef', true),
        createMockSeat(4, 'empath', true),
      ];
      expect(checkEvilWin(seats)).toBe(true);
    });

    it('should return false when more than 2 players are alive', () => {
      const seats = [
        createMockSeat(0, 'washerwoman', false),
        createMockSeat(1, 'imp', false),
        createMockSeat(2, 'poisoner', false),
      ];
      expect(checkEvilWin(seats)).toBe(false);
    });
  });

  describe('checkGameOver', () => {
    describe('Saint execution rule', () => {
      it('should return evil win when Saint is executed', () => {
        const seats = [
          createMockSeat(0, 'saint', true), // Saint executed
          createMockSeat(1, 'imp', false),
          createMockSeat(2, 'washerwoman', false),
          createMockSeat(3, 'chef', false),
        ];
        const result = checkGameOver(seats, { executedSeatId: 0, executionOccurred: true }); // executedSeatId = 0 (saint)
        expect(result).not.toBeNull();
        expect(result?.winner).toBe('EVIL');
        expect(result?.reason).toContain('圣徒被处决');
      });

      it('should NOT trigger evil win when Saint dies at night (not executed)', () => {
        const seats = [
          createMockSeat(0, 'saint', true), // Saint killed at night
          createMockSeat(1, 'imp', false),
          createMockSeat(2, 'washerwoman', false),
          createMockSeat(3, 'chef', false),
        ];
        // executionOccurred=false means it was a night kill, not execution
        const result = checkGameOver(seats, { executedSeatId: 0, executionOccurred: false });
        expect(result).toBeNull();
      });
    });

    describe('Mayor special victory rule (Bug#11)', () => {
      it('should return good win when Mayor is alive, 3 players remain, and no one is executed', () => {
        const seats = [
          createMockSeat(0, 'mayor', false), // Mayor alive
          createMockSeat(1, 'imp', false),   // Demon alive
          createMockSeat(2, 'poisoner', false), // Minion alive
          createMockSeat(3, 'washerwoman', true), // Dead (executed this turn)
          createMockSeat(4, 'chef', true),   // Dead
        ];
        // 3 alive: mayor, imp, poisoner; no execution occurred
        const result = checkGameOver(seats, { executionOccurred: false });
        expect(result).not.toBeNull();
        expect(result?.winner).toBe('GOOD');
        expect(result?.reason).toContain('市长特殊胜利');
      });

      it('should NOT trigger Mayor victory if Mayor is poisoned', () => {
        const seats = [
          createMockSeat(0, 'mayor', false, ['POISONED']), // Mayor poisoned
          createMockSeat(1, 'imp', false),
          createMockSeat(2, 'poisoner', false),
          createMockSeat(3, 'washerwoman', true),
          createMockSeat(4, 'chef', true),
        ];
        const result = checkGameOver(seats, { executionOccurred: false });
        // Mayor is poisoned, so Mayor ability should not trigger
        // Game should not end (demon still alive, more than 2 players)
        expect(result).toBeNull();
      });

      it('should NOT trigger Mayor victory if Mayor is drunk', () => {
        const seats = [
          createMockSeat(0, 'mayor', false, ['DRUNK']), // Mayor drunk
          createMockSeat(1, 'imp', false),
          createMockSeat(2, 'poisoner', false),
          createMockSeat(3, 'washerwoman', true),
          createMockSeat(4, 'chef', true),
        ];
        const result = checkGameOver(seats, { executionOccurred: false });
        expect(result).toBeNull();
      });

      it('should NOT trigger Mayor victory if more than 3 players remain', () => {
        const seats = [
          createMockSeat(0, 'mayor', false),
          createMockSeat(1, 'imp', false),
          createMockSeat(2, 'poisoner', false),
          createMockSeat(3, 'washerwoman', false), // 4 players alive
          createMockSeat(4, 'chef', true), // This one was executed
        ];
        const result = checkGameOver(seats, { executionOccurred: false });
        expect(result).toBeNull();
      });

      it('should NOT trigger Mayor victory if Mayor is dead', () => {
        const seats = [
          createMockSeat(0, 'mayor', true), // Mayor dead
          createMockSeat(1, 'imp', false),
          createMockSeat(2, 'poisoner', false),
          createMockSeat(3, 'washerwoman', false),
          createMockSeat(4, 'chef', true), // Executed
        ];
        const result = checkGameOver(seats, { executionOccurred: false });
        expect(result).toBeNull();
      });
    });

    describe('Standard win conditions', () => {
      it('should return good win when demon is killed', () => {
        const seats = [
          createMockSeat(0, 'washerwoman', false),
          createMockSeat(1, 'imp', true), // Demon dead
          createMockSeat(2, 'poisoner', false),
        ];
        const result = checkGameOver(seats);
        expect(result?.winner).toBe('GOOD');
      });

      it('should return evil win when only 2 players remain', () => {
        const seats = [
          createMockSeat(0, 'washerwoman', true),
          createMockSeat(1, 'imp', false),
          createMockSeat(2, 'poisoner', false),
          createMockSeat(3, 'chef', true),
          createMockSeat(4, 'empath', true),
        ];
        const result = checkGameOver(seats);
        expect(result?.winner).toBe('EVIL');
      });
    });
  });
});
