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

  describe('basic mouse interactions', () => {
    it('should call onClick when pressed for a short time', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      act(() => {
        result.current?.onMouseDown?.({ evt: { clientX: 0, clientY: 0 } } as any);
      });

      act(() => {
        vi.advanceTimersByTime(100);
        result.current?.onMouseUp?.({} as any);
      });

      expect(onClick).toHaveBeenCalled();
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('should call onLongPress when pressed for a long time', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      act(() => {
        result.current?.onMouseDown?.({ evt: { clientX: 0, clientY: 0 } } as any);
      });

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(result.current?.isPressing).toBe(true);

      act(() => {
        vi.advanceTimersByTime(150); // Total 550
      });

      expect(onLongPress).toHaveBeenCalled();
      expect(result.current?.isPressing).toBe(false);

      act(() => {
        result.current?.onMouseUp?.({} as any);
      });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should cancel long press when mouse leaves (line 111)', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      act(() => {
        result.current?.onMouseDown?.({ evt: { clientX: 0, clientY: 0 } } as any);
      });

      expect(result.current?.isPressing).toBe(true);

      act(() => {
        vi.advanceTimersByTime(200);
        result.current?.onMouseLeave?.({} as any);
      });

      expect(result.current?.isPressing).toBe(false);

      act(() => {
        vi.advanceTimersByTime(400); // Total would be 600ms
      });

      // Neither callback should be called - long press was cancelled and click shouldn't fire on leave
      expect(onLongPress).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('touch interactions', () => {
    it('should call onClick on short touch (line 116 - onTouchEnd)', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      act(() => {
        result.current.onTouchStart({ evt: { touches: [{ clientX: 0, clientY: 0 }] as any, clientX: 0, clientY: 0 } } as any);
      });

      expect(result.current?.isPressing).toBe(true);

      act(() => {
        vi.advanceTimersByTime(100);
        result.current.onTouchEnd({} as any);
      });

      expect(onClick).toHaveBeenCalled();
      expect(onLongPress).not.toHaveBeenCalled();
      expect(result.current?.isPressing).toBe(false);
    });

    it('should call onLongPress on long touch', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      act(() => {
        result.current.onTouchStart({ evt: { touches: [{ clientX: 0, clientY: 0 }] as any } } as any);
      });

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onLongPress).toHaveBeenCalled();

      act(() => {
        result.current.onTouchEnd({} as any);
      });

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should cancel on multi-touch (pinch zoom)', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      // Start with single touch
      act(() => {
        result.current.onTouchStart({
          evt: { touches: [{ clientX: 0, clientY: 0 }] as any }
        } as any);
      });

      expect(result.current?.isPressing).toBe(true);

      // Second touch added (pinch zoom gesture)
      act(() => {
        result.current.onTouchStart({
          evt: { touches: [{ clientX: 0, clientY: 0 }, { clientX: 50, clientY: 50 }] as any }
        } as any);
      });

      expect(result.current?.isPressing).toBe(false);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onLongPress).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should cancel on move during touch when multi-touch detected', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      act(() => {
        result.current.onTouchStart({ evt: { touches: [{ clientX: 0, clientY: 0 }] as any } } as any);
      });

      // Multi-touch detected during move
      act(() => {
        result.current.onTouchMove({
          evt: { touches: [{ clientX: 0, clientY: 0 }, { clientX: 50, clientY: 50 }] as any }
        } as any);
      });

      expect(result.current?.isPressing).toBe(false);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('should cancel long press when touch moves more than 10px', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      act(() => {
        result.current.onTouchStart({ evt: { touches: [{ clientX: 0, clientY: 0 }] as any } } as any);
      });

      act(() => {
        vi.advanceTimersByTime(100);
        result.current.onTouchMove({ evt: { touches: [{ clientX: 15, clientY: 0 }] as any } } as any);
      });

      expect(result.current?.isPressing).toBe(false);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('disabled option (lines 102-104)', () => {
    it('should not start long press when disabled', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() =>
        useLongPress(onLongPress, onClick, { delay: 500, disabled: true })
      );

      act(() => {
        result.current?.onMouseDown?.({ evt: { clientX: 0, clientY: 0 } } as any);
      });

      expect(result.current?.isPressing).toBe(false);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('should clear timer when disabled changes from false to true during press (lines 102-104)', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      let disabled = false;

      const { result, rerender } = renderHook(() =>
        useLongPress(onLongPress, onClick, { delay: 500, disabled })
      );

      // Start pressing
      act(() => {
        result.current?.onMouseDown?.({ evt: { clientX: 0, clientY: 0 } } as any);
      });

      expect(result.current?.isPressing).toBe(true);

      // Change disabled to true while pressing
      disabled = true;
      rerender();

      // The effect should have cleared the timer and isPressing
      expect(result.current?.isPressing).toBe(false);

      // Even after the delay, long press should not fire
      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('detectMouse option', () => {
    it('should not include mouse handlers when detectMouse is false', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() =>
        useLongPress(onLongPress, onClick, { delay: 500, detectMouse: false })
      );

      // Mouse handlers should not exist
      expect(result.current.onMouseDown).toBeUndefined();
      expect(result.current.onMouseUp).toBeUndefined();
      expect(result.current.onMouseLeave).toBeUndefined();

      // Touch handlers should still exist
      expect(result.current.onTouchStart).toBeDefined();
      expect(result.current.onTouchEnd).toBeDefined();
      expect(result.current.onTouchMove).toBeDefined();
    });

    it('should include mouse handlers when detectMouse is true (default)', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() =>
        useLongPress(onLongPress, onClick, { delay: 500 })
      );

      expect(result.current.onMouseDown).toBeDefined();
      expect(result.current.onMouseUp).toBeDefined();
      expect(result.current.onMouseLeave).toBeDefined();
    });
  });

  describe('options handling', () => {
    it('should handle number as options (backward compatibility)', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 300));

      act(() => {
        result.current?.onMouseDown?.({ evt: { clientX: 0, clientY: 0 } } as any);
      });

      act(() => {
        vi.advanceTimersByTime(350);
      });

      expect(onLongPress).toHaveBeenCalled();
    });

    it('should use default delay when options is empty object', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, {}));

      act(() => {
        result.current?.onMouseDown?.({ evt: { clientX: 0, clientY: 0 } } as any);
      });

      // Default delay is 500ms, so at 400ms it should not have fired
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(onLongPress).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(onLongPress).toHaveBeenCalled();
    });

    it('should use custom delay from options object', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() =>
        useLongPress(onLongPress, onClick, { delay: 1000 })
      );

      act(() => {
        result.current?.onMouseDown?.({ evt: { clientX: 0, clientY: 0 } } as any);
      });

      act(() => {
        vi.advanceTimersByTime(900);
      });

      expect(onLongPress).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(onLongPress).toHaveBeenCalled();
    });
  });

  describe('movement cancellation', () => {
    it('should not cancel if movement is within 10px threshold', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      act(() => {
        result.current?.onMouseDown?.({ evt: { clientX: 0, clientY: 0 } } as any);
      });

      // Move within threshold
      act(() => {
        result.current.onTouchMove({ evt: { clientX: 5, clientY: 5 } } as any);
      });

      expect(result.current?.isPressing).toBe(true);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onLongPress).toHaveBeenCalled();
    });

    it('should cancel if movement exceeds 10px in Y direction', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      act(() => {
        result.current?.onMouseDown?.({ evt: { clientX: 0, clientY: 0 } } as any);
      });

      act(() => {
        result.current.onTouchMove({ evt: { clientX: 0, clientY: 15 } } as any);
      });

      expect(result.current?.isPressing).toBe(false);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('should handle move without startPos set', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      // Move without starting - should not throw
      act(() => {
        result.current.onTouchMove({ evt: { clientX: 15, clientY: 15 } } as any);
      });

      // No error should occur
      expect(result.current?.isPressing).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should cancel immediately when start is called with multiple touches (lines 38-39)', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      // Start with multiple touches directly (not adding touch during gesture)
      // This tests the direct call to start() via onMouseDown with multi-touch
      act(() => {
        result.current?.onMouseDown?.({
          evt: { touches: [{ clientX: 0, clientY: 0 }, { clientX: 50, clientY: 50 }] as any }
        } as any);
      });

      // Should not be pressing since multi-touch was detected at start
      expect(result.current?.isPressing).toBe(false);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onLongPress).not.toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should handle event without evt property', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      act(() => {
        result.current?.onMouseDown?.({} as any);
      });

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onLongPress).toHaveBeenCalled();
    });

    it('should handle touch event with clientX/clientY directly on evt', () => {
      const onLongPress = vi.fn();
      const onClick = vi.fn();
      const { result } = renderHook(() => useLongPress(onLongPress, onClick, 500));

      act(() => {
        result.current.onTouchStart({ evt: { clientX: 100, clientY: 100 } } as any);
      });

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onLongPress).toHaveBeenCalled();
    });
  });
});
