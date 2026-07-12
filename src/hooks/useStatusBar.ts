import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Hook to configure the native status bar on iOS/Android
 * Only runs when the app is running as a native app (not in browser)
 */
export const useStatusBar = () => {
  useEffect(() => {
    const configureStatusBar = async () => {
      // Only run on native platforms
      if (!Capacitor.isNativePlatform()) return;

      try {
        // Set status bar style (LIGHT = dark text, DARK = light text)
        await StatusBar.setStyle({ style: Style.Light });
        
        // Set background color (Android only - iOS uses app background)
        if (Capacitor.getPlatform() === 'android') {
          await StatusBar.setBackgroundColor({ color: '#f8fafc' });
        }
        
        // Make sure status bar is visible
        await StatusBar.show();
      } catch (error) {
        console.log('StatusBar plugin not available:', error);
      }
    };

    configureStatusBar();
  }, []);
};

/**
 * Utility functions for status bar control
 */
export const statusBarUtils = {
  setLight: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await StatusBar.setStyle({ style: Style.Light });
    } catch (e) {
      // Already confirmed native platform above — a failure here means the
      // StatusBar plugin itself is unavailable/misconfigured. Log for visibility.
      console.warn('[useStatusBar] setLight failed:', e);
    }
  },

  setDark: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (e) {
      // Already confirmed native platform above — a failure here means the
      // StatusBar plugin itself is unavailable/misconfigured. Log for visibility.
      console.warn('[useStatusBar] setDark failed:', e);
    }
  },

  hide: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await StatusBar.hide();
    } catch (e) {
      // Already confirmed native platform above — a failure here means the
      // StatusBar plugin itself is unavailable/misconfigured. Log for visibility.
      console.warn('[useStatusBar] hide failed:', e);
    }
  },

  show: async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await StatusBar.show();
    } catch (e) {
      // Already confirmed native platform above — a failure here means the
      // StatusBar plugin itself is unavailable/misconfigured. Log for visibility.
      console.warn('[useStatusBar] show failed:', e);
    }
  },

  setBackgroundColor: async (color: string) => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (e) {
      // Already confirmed native Android platform above — a failure here means the
      // StatusBar plugin itself is unavailable/misconfigured. Log for visibility.
      console.warn('[useStatusBar] setBackgroundColor failed:', e);
    }
  }
};