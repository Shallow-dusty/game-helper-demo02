import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeathEcho } from './useDeathEcho';

describe('useDeathEcho', () => {
  it('returns null initially', () => {
    const { result } = renderHook(() => useDeathEcho());
    expect(result.current.deathSeatId).toBeNull();
    expect(result.current.playerName).toBeUndefined();
  });

  it('triggerDeathEcho sets seatId and playerName', () => {
    const { result } = renderHook(() => useDeathEcho());

    act(() => {
      result.current.triggerDeathEcho(3, 'Alice');
    });

    expect(result.current.deathSeatId).toBe(3);
    expect(result.current.playerName).toBe('Alice');
  });

  it('clearDeathEcho resets state', () => {
    const { result } = renderHook(() => useDeathEcho());

    act(() => {
      result.current.triggerDeathEcho(5, 'Bob');
    });
    expect(result.current.deathSeatId).toBe(5);

    act(() => {
      result.current.clearDeathEcho();
    });
    expect(result.current.deathSeatId).toBeNull();
    expect(result.current.playerName).toBeUndefined();
  });
});
