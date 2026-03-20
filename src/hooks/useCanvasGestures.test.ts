import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import Konva from 'konva';
import { useCanvasGestures } from './useCanvasGestures';

// --- Mock factories ---

const createWheelEvent = (deltaY: number) =>
  ({
    evt: {
      preventDefault: vi.fn(),
      deltaY,
    },
  }) as unknown as Konva.KonvaEventObject<WheelEvent>;

const createTouchEvent = (
  touches: { clientX: number; clientY: number }[]
) =>
  ({
    evt: {
      preventDefault: vi.fn(),
      touches,
    },
  }) as unknown as Konva.KonvaEventObject<TouchEvent>;

const mockStage = (pointer: { x: number; y: number } | null = { x: 400, y: 300 }) =>
  ({
    getPointerPosition: () => pointer,
  }) as unknown as Konva.Stage;

// --- Tests ---

describe('useCanvasGestures', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Initial state
  describe('initial state', () => {
    it('should return scale=1, pos={0,0}, isGestureActive=false', () => {
      const { result } = renderHook(() => useCanvasGestures());

      expect(result.current.stageScale).toBe(1);
      expect(result.current.stagePos).toEqual({ x: 0, y: 0 });
      expect(result.current.isGestureActive).toBe(false);
      expect(result.current.draggingRef.current).toBe(false);
      expect(result.current.lastGestureTime.current).toBe(0);
      expect(result.current.stageRef.current).toBeNull();
    });
  });

  // 2. handleWheel zoom in
  describe('handleWheel zoom in', () => {
    it('should increase scale when deltaY < 0', () => {
      const { result } = renderHook(() => useCanvasGestures());

      // Set up stageRef with mock
      act(() => {
        (result.current.stageRef as React.MutableRefObject<Konva.Stage | null>).current = mockStage();
      });

      act(() => {
        result.current.handleWheel(createWheelEvent(-100));
      });

      expect(result.current.stageScale).toBeGreaterThan(1);
    });

    it('should cap scale at MAX_SCALE (3)', () => {
      const { result } = renderHook(() => useCanvasGestures());

      act(() => {
        (result.current.stageRef as React.MutableRefObject<Konva.Stage | null>).current = mockStage();
      });

      // Zoom in many times to hit the cap
      for (let i = 0; i < 30; i++) {
        act(() => {
          result.current.handleWheel(createWheelEvent(-100));
        });
      }

      expect(result.current.stageScale).toBe(3);
    });

    it('should not change state when stageRef is null', () => {
      const { result } = renderHook(() => useCanvasGestures());

      act(() => {
        result.current.handleWheel(createWheelEvent(-100));
      });

      expect(result.current.stageScale).toBe(1);
      expect(result.current.stagePos).toEqual({ x: 0, y: 0 });
    });

    it('should not change state when pointer position is null', () => {
      const { result } = renderHook(() => useCanvasGestures());

      act(() => {
        (result.current.stageRef as React.MutableRefObject<Konva.Stage | null>).current = mockStage(null);
      });

      act(() => {
        result.current.handleWheel(createWheelEvent(-100));
      });

      expect(result.current.stageScale).toBe(1);
    });
  });

  // 3. handleWheel zoom out
  describe('handleWheel zoom out', () => {
    it('should decrease scale when deltaY > 0', () => {
      const { result } = renderHook(() => useCanvasGestures());

      act(() => {
        (result.current.stageRef as React.MutableRefObject<Konva.Stage | null>).current = mockStage();
      });

      act(() => {
        result.current.handleWheel(createWheelEvent(100));
      });

      expect(result.current.stageScale).toBeLessThan(1);
    });

    it('should cap scale at MIN_SCALE (0.5)', () => {
      const { result } = renderHook(() => useCanvasGestures());

      act(() => {
        (result.current.stageRef as React.MutableRefObject<Konva.Stage | null>).current = mockStage();
      });

      // Zoom out many times to hit the floor
      for (let i = 0; i < 30; i++) {
        act(() => {
          result.current.handleWheel(createWheelEvent(100));
        });
      }

      expect(result.current.stageScale).toBe(0.5);
    });
  });

  // 4. handleTouchStart with 2 fingers
  describe('handleTouchStart with 2 fingers', () => {
    it('should set isPinching and isGestureActive when 2 fingers touch', () => {
      const { result } = renderHook(() => useCanvasGestures());

      const touchEvt = createTouchEvent([
        { clientX: 100, clientY: 100 },
        { clientX: 200, clientY: 200 },
      ]);

      act(() => {
        result.current.handleTouchStart(touchEvt);
      });

      expect(result.current.isGestureActive).toBe(true);
      expect(touchEvt.evt.preventDefault).toHaveBeenCalled();
    });

    it('should not activate gesture with 1 finger', () => {
      const { result } = renderHook(() => useCanvasGestures());

      const touchEvt = createTouchEvent([{ clientX: 100, clientY: 100 }]);

      act(() => {
        result.current.handleTouchStart(touchEvt);
      });

      expect(result.current.isGestureActive).toBe(false);
    });
  });

  // 5. handleTouchMove with pinch
  describe('handleTouchMove with pinch', () => {
    it('should change scale and position during pinch zoom', () => {
      const { result } = renderHook(() => useCanvasGestures());

      // Set up stageRef
      act(() => {
        (result.current.stageRef as React.MutableRefObject<Konva.Stage | null>).current = mockStage();
      });

      // Start pinch with two fingers at known positions
      act(() => {
        result.current.handleTouchStart(
          createTouchEvent([
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 },
          ])
        );
      });

      // Move fingers apart (zoom in) - increase distance
      act(() => {
        result.current.handleTouchMove(
          createTouchEvent([
            { clientX: 50, clientY: 50 },
            { clientX: 250, clientY: 250 },
          ])
        );
      });

      // Scale should have increased (fingers moved apart)
      expect(result.current.stageScale).toBeGreaterThan(1);
      // Position should have changed
      expect(result.current.stagePos).not.toEqual({ x: 0, y: 0 });
    });

    it('should decrease scale when fingers pinch closer', () => {
      const { result } = renderHook(() => useCanvasGestures());

      act(() => {
        (result.current.stageRef as React.MutableRefObject<Konva.Stage | null>).current = mockStage();
      });

      // Start pinch with fingers far apart
      act(() => {
        result.current.handleTouchStart(
          createTouchEvent([
            { clientX: 50, clientY: 50 },
            { clientX: 250, clientY: 250 },
          ])
        );
      });

      // Move fingers closer together (zoom out)
      act(() => {
        result.current.handleTouchMove(
          createTouchEvent([
            { clientX: 120, clientY: 120 },
            { clientX: 180, clientY: 180 },
          ])
        );
      });

      expect(result.current.stageScale).toBeLessThan(1);
    });

    it('should not move without prior touchStart (no lastCenter)', () => {
      const { result } = renderHook(() => useCanvasGestures());

      act(() => {
        (result.current.stageRef as React.MutableRefObject<Konva.Stage | null>).current = mockStage();
      });

      // Move without starting - should not change anything
      act(() => {
        result.current.handleTouchMove(
          createTouchEvent([
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 },
          ])
        );
      });

      expect(result.current.stageScale).toBe(1);
      expect(result.current.stagePos).toEqual({ x: 0, y: 0 });
    });
  });

  // 6. handleTouchEnd
  describe('handleTouchEnd', () => {
    it('should reset pinch state and set lastGestureTime', () => {
      const { result } = renderHook(() => useCanvasGestures());

      const now = 1700000000000;
      vi.spyOn(Date, 'now').mockReturnValue(now);

      // Start a pinch
      act(() => {
        result.current.handleTouchStart(
          createTouchEvent([
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 200 },
          ])
        );
      });

      expect(result.current.isGestureActive).toBe(true);

      // End the pinch
      act(() => {
        result.current.handleTouchEnd();
      });

      expect(result.current.isGestureActive).toBe(false);
      expect(result.current.lastGestureTime.current).toBe(now);
    });
  });

  // 7. draggingRef + updateGestureState
  describe('draggingRef and updateGestureState', () => {
    it('should set isGestureActive=true when draggingRef.current=true', () => {
      const { result } = renderHook(() => useCanvasGestures());

      expect(result.current.isGestureActive).toBe(false);

      act(() => {
        result.current.draggingRef.current = true;
        result.current.updateGestureState();
      });

      expect(result.current.isGestureActive).toBe(true);
    });

    it('should set isGestureActive=false when draggingRef.current=false', () => {
      const { result } = renderHook(() => useCanvasGestures());

      // First set to true
      act(() => {
        result.current.draggingRef.current = true;
        result.current.updateGestureState();
      });

      expect(result.current.isGestureActive).toBe(true);

      // Then set back to false
      act(() => {
        result.current.draggingRef.current = false;
        result.current.updateGestureState();
      });

      expect(result.current.isGestureActive).toBe(false);
    });
  });

  // Additional: setStagePos direct usage
  describe('setStagePos', () => {
    it('should allow direct position updates', () => {
      const { result } = renderHook(() => useCanvasGestures());

      act(() => {
        result.current.setStagePos({ x: 100, y: 200 });
      });

      expect(result.current.stagePos).toEqual({ x: 100, y: 200 });
    });
  });

  // Additional: wheel event calls preventDefault
  describe('wheel event preventDefault', () => {
    it('should call preventDefault on wheel events', () => {
      const { result } = renderHook(() => useCanvasGestures());

      act(() => {
        (result.current.stageRef as React.MutableRefObject<Konva.Stage | null>).current = mockStage();
      });

      const evt = createWheelEvent(-100);
      act(() => {
        result.current.handleWheel(evt);
      });

      expect(evt.evt.preventDefault).toHaveBeenCalled();
    });
  });
});
