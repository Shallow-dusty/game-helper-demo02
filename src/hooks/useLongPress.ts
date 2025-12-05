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

type PressEvent = React.MouseEvent | React.TouchEvent;

export const useLongPress = (
  onLongPress: (e: PressEvent) => void,
  onClick: (e: PressEvent) => void,
  options: LongPressOptions | number = {}
) => {
  const { delay = 500, disabled = false, detectMouse = true } = 
    typeof options === 'number' ? { delay: options } : options;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const touchCountRef = useRef(0);
  const [isPressing, setIsPressing] = useState(false);

  const start = useCallback((e: PressEvent) => {
    if (disabled) return;
    
    // Track touch count for multi-touch detection
    if ('touches' in e) {
      touchCountRef.current = e.touches.length;
      // Cancel if multiple touches (pinch zoom)
      if (e.touches.length > 1) {
        clear(e, false);
        return;
      }
    }

    isLongPressRef.current = false;
    
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }

    startPosRef.current = { x: clientX, y: clientY };
    
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsPressing(false);
      onLongPress(e);
    }, delay);
    setIsPressing(true);
  }, [onLongPress, delay, disabled]);

  const clear = useCallback((e: PressEvent, shouldClick = false) => {
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

  const move = useCallback((e: PressEvent) => {
    // If multi-touch detected during move, cancel immediately
    if ('touches' in e && e.touches.length > 1) {
      clear(e, false);
      return;
    }
    
    if (startPosRef.current && timerRef.current) {
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e) {
         clientX = e.touches[0].clientX;
         clientY = e.touches[0].clientY;
      } else {
         clientX = (e as React.MouseEvent).clientX;
         clientY = (e as React.MouseEvent).clientY;
      }

      const dx = Math.abs(clientX - startPosRef.current.x);
      const dy = Math.abs(clientY - startPosRef.current.y);
      
      // Cancel long press if moved more than 10px
      if (dx > 10 || dy > 10) {
        clear(e, false);
      }
    }
  }, [clear]);

  // Handle additional touch detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // If new touch added during existing gesture, cancel
    if (e.touches.length > touchCountRef.current && timerRef.current) {
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
    onMouseUp: (e: React.MouseEvent) => clear(e, true),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
  } : {};

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: (e: React.TouchEvent) => clear(e, true),
    onTouchMove: move,
    ...mouseHandlers,
    isPressing
  };
};
