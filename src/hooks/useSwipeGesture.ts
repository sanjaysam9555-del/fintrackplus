import { useRef, useCallback, TouchEvent } from "react";

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  edgeThreshold?: number; // px from right edge to activate
  swipeThreshold?: number; // px of horizontal movement to trigger
  enabled?: boolean;
  requireRightEdge?: boolean; // only activate from right edge
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  edgeThreshold = 30,
  swipeThreshold = 80,
  enabled = true,
  requireRightEdge = false,
}: UseSwipeGestureOptions) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isTracking = useRef(false);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;

      if (requireRightEdge && touch.clientX < screenWidth - edgeThreshold) {
        isTracking.current = false;
        return;
      }

      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      isTracking.current = true;
    },
    [enabled, edgeThreshold, requireRightEdge]
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!isTracking.current || !enabled) return;
      isTracking.current = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);

      // Ignore if vertical movement is greater (scrolling)
      if (deltaY > Math.abs(deltaX)) return;

      if (deltaX < -swipeThreshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > swipeThreshold && onSwipeRight) {
        onSwipeRight();
      }
    },
    [enabled, swipeThreshold, onSwipeLeft, onSwipeRight]
  );

  return { onTouchStart, onTouchEnd };
}
