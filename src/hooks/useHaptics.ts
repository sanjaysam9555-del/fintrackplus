import { useCallback } from 'react';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

/**
 * Hook for triggering haptic feedback on supported devices
 * Uses the Vibration API as a fallback for devices without native haptics
 */
export const useHaptics = () => {
  const trigger = useCallback((style: HapticStyle = 'light') => {
    // Check if the device supports vibration
    if (!navigator.vibrate) return;

    // Define vibration patterns for different haptic styles
    const patterns: Record<HapticStyle, number | number[]> = {
      light: 10,
      medium: 25,
      heavy: 50,
      selection: 5,
      success: [10, 50, 10],
      warning: [25, 50, 25],
      error: [50, 100, 50],
    };

    try {
      navigator.vibrate(patterns[style]);
    } catch (e) {
      // Silently fail if vibration is not supported
    }
  }, []);

  const lightTap = useCallback(() => trigger('light'), [trigger]);
  const mediumTap = useCallback(() => trigger('medium'), [trigger]);
  const heavyTap = useCallback(() => trigger('heavy'), [trigger]);
  const selection = useCallback(() => trigger('selection'), [trigger]);
  const success = useCallback(() => trigger('success'), [trigger]);
  const warning = useCallback(() => trigger('warning'), [trigger]);
  const error = useCallback(() => trigger('error'), [trigger]);

  return {
    trigger,
    lightTap,
    mediumTap,
    heavyTap,
    selection,
    success,
    warning,
    error,
  };
};