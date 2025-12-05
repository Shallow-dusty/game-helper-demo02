/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGhostlyVision } from './useGhostlyVision';
import * as storeModule from '../store';

vi.mock('../store', () => ({
  useStore: vi.fn(),
}));

describe('useGhostlyVision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Create a mock root element
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
  });

  it('returns isActive false when mySeatId is null', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        mySeatId: null,
        gameState: {
          seats: [{ seatId: 0, isDead: false }]
        }
      };
      return selector(state);
    });

    const { result } = renderHook(() => useGhostlyVision());
    expect(result.current.isActive).toBe(false);
    expect(result.current.isDead).toBe(false);
  });

  it('returns isActive false when user seat is alive', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        mySeatId: 0,
        gameState: {
          seats: [{ seatId: 0, isDead: false }]
        }
      };
      return selector(state);
    });

    const { result } = renderHook(() => useGhostlyVision());
    expect(result.current.isActive).toBe(false);
    expect(result.current.isDead).toBe(false);
  });

  it('returns isActive true when user seat is dead', () => {
    vi.mocked(storeModule.useStore).mockImplementation((selector: (state: unknown) => unknown) => {
      const state = {
        mySeatId: 0,
        gameState: {
          seats: [{ seatId: 0, isDead: true }]
        }
      };
      return selector(state);
    });

    const { result } = renderHook(() => useGhostlyVision());
    expect(result.current.isActive).toBe(true);
    expect(result.current.isDead).toBe(true);
  });
});
