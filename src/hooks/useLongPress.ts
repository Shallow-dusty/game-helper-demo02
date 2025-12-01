import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Hook for detecting long press on both touch and mouse events
 * @param onLongPress Callback when long press is detected
 * @param onClick Callback for regular click
 * @param delay Long press delay in ms (default: 500)
 * @param disabled Whether the hook is disabled
 */
export interface LongPressOptions {
  delay?: number;
  disabled?: boolean;
  detectMouse?: boolean;
}

export const useLongPress = (
  onLongPress: (e: unknown) => void,
  onClick: (e: unknown) => void,
  options: LongPressOptions | number = {}
) => {
  const { delay = 500, disabled = false, detectMouse = true } = 
    typeof options === 'number' ? { delay: options } : options;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchCountRef = useRef(0);
  const [isPressing, setIsPressing] = useState(false);

  const start = useCallback((e: { evt?: { touches?: TouchList; clientX?: number; clientY?: number } }) => {
    if (disabled) return;
    
    // Track touch count for multi-touch detection
    if (e.evt?.touches) {
      touchCountRef.current = e.evt.touches.length;
      // Cancel if multiple touches (pinch zoom)
      if (e.evt.touches.length > 1) {
        clear(e, false);
        return;
      }
    }

    isLongPressRef.current = false;
    startPosRef.current = { 
      x: e.evt?.clientX ?? (e.evt?.touches?.[0]?.clientX ?? 0), 
      y: e.evt?.clientY ?? (e.evt?.touches?.[0]?.clientY ?? 0) 
    };
    
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsPressing(false);
      onLongPress(e);
    }, delay);
    setIsPressing(true);
  }, [onLongPress, delay, disabled]);

  const clear = useCallback((e: unknown, shouldClick = false) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    touchCountRef.current = 0;
    setIsPressing(false);
    
    if (shouldClick && !isLongPressRef.current) {
      onClick(e);
    }
  }, [onClick]);

  const move = useCallback((e: { evt?: { touches?: TouchList; clientX?: number; clientY?: number } }) => {
    // If multi-touch detected during move, cancel immediately
    if (e.evt?.touches && e.evt.touches.length > 1) {
      clear(e, false);
      return;
    }
    
    if (startPosRef.current && timerRef.current) {
      const clientX = e.evt?.clientX ?? (e.evt?.touches?.[0]?.clientX ?? 0);
      const clientY = e.evt?.clientY ?? (e.evt?.touches?.[0]?.clientY ?? 0);
      const dx = Math.abs(clientX - startPosRef.current.x);
      const dy = Math.abs(clientY - startPosRef.current.y);
      
      // Cancel long press if moved more than 10px
      if (dx > 10 || dy > 10) {
        clear(e, false);
      }
    }
  }, [clear]);

  // Handle additional touch detection
  const handleTouchStart = useCallback((e: { evt?: { touches?: TouchList; clientX?: number; clientY?: number } }) => {
    // If new touch added during existing gesture, cancel
    if (e.evt?.touches && e.evt.touches.length > touchCountRef.current && timerRef.current) {
      clear(e, false);
      return;
    }
    start(e);
  }, [start, clear]);

  useEffect(() => {
    if (disabled && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setIsPressing(false);
    }
  }, [disabled]);

  const mouseHandlers = detectMouse ? {
    onMouseDown: start,
    onMouseUp: (e: unknown) => clear(e, true),
    onMouseLeave: (e: unknown) => clear(e, false),
  } : {};

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: (e: unknown) => clear(e, true),
    onTouchMove: move,
    ...mouseHandlers,
    isPressing
  };
};
