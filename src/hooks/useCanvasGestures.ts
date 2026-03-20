/**
 * useCanvasGestures - Canvas (Konva) pinch-zoom, scroll-zoom, and pan gestures.
 *
 * Extracted from Grimoire.tsx to reduce component complexity.
 */

import { useState, useRef, useCallback } from 'react';
import Konva from 'konva';

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCROLL_SCALE_FACTOR = 1.1;

// --- Geometry helpers ---

const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) =>
  Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

const getCenter = (p1: { x: number; y: number }, p2: { x: number; y: number }) => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2,
});

// --- Hook ---

export interface CanvasGestureState {
  stageScale: number;
  stagePos: { x: number; y: number };
  setStagePos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  isGestureActive: boolean;
  lastGestureTime: React.MutableRefObject<number>;
  draggingRef: React.MutableRefObject<boolean>;
  updateGestureState: () => void;
  stageRef: React.RefObject<Konva.Stage>;
  handleTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchEnd: () => void;
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
}

export function useCanvasGestures(): CanvasGestureState {
  const stageRef = useRef<Konva.Stage>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef(0);
  const lastGestureTime = useRef(0);
  const isPinching = useRef(false);
  const draggingRef = useRef(false);
  const [isGestureActive, setIsGestureActive] = useState(false);

  const updateGestureState = useCallback(() => {
    setIsGestureActive(isPinching.current || draggingRef.current);
  }, []);

  const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const touch = e.evt.touches;
    if (touch.length === 2 && touch[0] && touch[1]) {
      isPinching.current = true;
      updateGestureState();
      e.evt.preventDefault();
      const p1 = { x: touch[0].clientX, y: touch[0].clientY };
      const p2 = { x: touch[1].clientX, y: touch[1].clientY };
      lastCenter.current = getCenter(p1, p2);
      lastDist.current = getDistance(p1, p2);
    }
  }, [updateGestureState]);

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const touch = e.evt.touches;
      const stage = stageRef.current;
      if (touch.length === 2 && stage && lastCenter.current && touch[0] && touch[1]) {
        e.evt.preventDefault();
        const p1 = { x: touch[0].clientX, y: touch[0].clientY };
        const p2 = { x: touch[1].clientX, y: touch[1].clientY };
        const newCenter = getCenter(p1, p2);
        const newDist = getDistance(p1, p2);
        if (lastDist.current === 0) {
          lastDist.current = newDist;
          return;
        }
        const scaleBy = newDist / lastDist.current;
        const oldScale = stageScale;
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, oldScale * scaleBy));
        const mousePointTo = {
          x: (newCenter.x - stagePos.x) / oldScale,
          y: (newCenter.y - stagePos.y) / oldScale,
        };
        const newPos = {
          x: newCenter.x - mousePointTo.x * newScale + (newCenter.x - lastCenter.current.x),
          y: newCenter.y - mousePointTo.y * newScale + (newCenter.y - lastCenter.current.y),
        };
        setStageScale(newScale);
        setStagePos(newPos);
        lastDist.current = newDist;
        lastCenter.current = newCenter;
      }
    },
    [stageScale, stagePos]
  );

  const handleTouchEnd = useCallback(() => {
    lastCenter.current = null;
    lastDist.current = 0;
    isPinching.current = false;
    lastGestureTime.current = Date.now();
    updateGestureState();
  }, [updateGestureState]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, direction > 0 ? oldScale * SCROLL_SCALE_FACTOR : oldScale / SCROLL_SCALE_FACTOR)
      );
      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };
      setStageScale(newScale);
      setStagePos(newPos);
    },
    [stageScale, stagePos]
  );

  return {
    stageScale,
    stagePos,
    setStagePos,
    isGestureActive,
    lastGestureTime,
    draggingRef,
    updateGestureState,
    stageRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWheel,
  };
}
