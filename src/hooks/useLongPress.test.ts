import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLongPress } from './useLongPress';

describe('useLongPress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call onClick when pressed for a short time', () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

    act(() => {
      result.current.onMouseDown({ evt: { clientX: 0, clientY: 0 } } as any);
    });

    act(() => {
      vi.advanceTimersByTime(100);
      result.current.onMouseUp({} as any);
    });

    expect(onClick).toHaveBeenCalled();
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('should call onLongPress when pressed for a long time', () => {
    const onLongPress = vi.fn();
    const onClick = vi.fn();
    const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

    act(() => {
      result.current.onMouseDown({ evt: { clientX: 0, clientY: 0 } } as any);
    });

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current.isPressing).toBe(true);

    act(() => {
      vi.advanceTimersByTime(150); // Total 550
    });

    expect(onLongPress).toHaveBeenCalled();
    expect(result.current.isPressing).toBe(false);

    act(() => {
        result.current.onMouseUp({} as any);
    });
    
    expect(onClick).not.toHaveBeenCalled();
  });
});
