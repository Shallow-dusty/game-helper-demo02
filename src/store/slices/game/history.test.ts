import { describe, it, expect, vi } from 'vitest';
import { createGameHistorySlice } from './history';

describe('store/slices/game/history', () => {
  const mockSet = vi.fn();
  const mockGet = vi.fn();

  describe('createGameHistorySlice', () => {
    it('should create slice with fetchGameHistory and saveGameHistory', () => {
      const slice = createGameHistorySlice(mockSet, mockGet);
      
      expect(slice.fetchGameHistory).toBeDefined();
      expect(slice.saveGameHistory).toBeDefined();
    });
  });

  describe('fetchGameHistory', () => {
    it('should return empty array', async () => {
      const slice = createGameHistorySlice(mockSet, mockGet);
      
      const result = await slice.fetchGameHistory();
      
      expect(result).toEqual([]);
    });
  });

  describe('saveGameHistory', () => {
    it('should accept game parameter without error', async () => {
      const slice = createGameHistorySlice(mockSet, mockGet);
      
      // Should not throw
      await expect(slice.saveGameHistory({} as any)).resolves.toBeUndefined();
    });
  });
});
