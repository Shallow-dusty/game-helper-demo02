import { describe, it, expect } from 'vitest';
import { generateRoleAssignment, getStandardComposition } from './gameLogic';

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
});
