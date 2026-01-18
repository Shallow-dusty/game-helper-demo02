import { describe, it, expect, vi } from 'vitest';
import { createGameHistorySlice } from './history';
import type { AppState } from '../../types';

describe('store/slices/game/history', () => {
  describe('createGameHistorySlice', () => {
    it('should create slice with fetchGameHistory and saveGameHistory', () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn(() => ({} as AppState));
      const mockApi = {} as any;

      const slice = createGameHistorySlice(mockSet, mockGet, mockApi);

      expect(slice.fetchGameHistory).toBeDefined();
      expect(slice.saveGameHistory).toBeDefined();
    });
  });

  describe('fetchGameHistory', () => {
    it('should return empty array', async () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn(() => ({} as AppState));
      const mockApi = {} as any;

      const slice = createGameHistorySlice(mockSet, mockGet, mockApi);

      const result = await slice.fetchGameHistory();

      expect(result).toEqual([]);
    });
  });

  describe('saveGameHistory', () => {
    it('should accept game parameter without error', async () => {
      const mockSet = vi.fn();
      const mockGet = vi.fn(() => ({} as AppState));
      const mockApi = {} as any;

      const slice = createGameHistorySlice(mockSet, mockGet, mockApi);

      // Should not throw
      await expect(slice.saveGameHistory({} as any)).resolves.toBeUndefined();
    });
  });
});
