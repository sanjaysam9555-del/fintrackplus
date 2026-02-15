import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { statusBarUtils } from './useStatusBar';

export type ThemeMode = 'light' | 'dark' | 'oled' | 'system';

interface ThemeState {
  mode: ThemeMode;
  resolved: 'light' | 'dark' | 'oled';
}

const THEME_STORAGE_KEY = 'fintrack-theme';

/**
 * Hook for managing theme with persistence to localStorage and cloud sync
 * Supports light, dark, OLED black, and system preference modes
 */
export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeState>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const mode: ThemeMode = (stored as ThemeMode) || 'dark';
    const resolved = resolveTheme(mode);
    return { mode, resolved };
  });

  // Resolve system preference
  function resolveTheme(mode: ThemeMode): 'light' | 'dark' | 'oled' {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }

  // Apply theme to document
  const applyTheme = useCallback((resolved: 'light' | 'dark' | 'oled') => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark', 'oled');
    
    if (resolved === 'oled') {
      // OLED mode uses dark class with additional oled class
      root.classList.add('dark', 'oled');
    } else {
      root.classList.add(resolved);
    }
    
    // Update status bar color for native apps
    if (resolved === 'light') {
      statusBarUtils.setLight();
      statusBarUtils.setBackgroundColor('#f8fafc');
    } else {
      statusBarUtils.setDark();
      statusBarUtils.setBackgroundColor(resolved === 'oled' ? '#000000' : '#0f172a');
    }
  }, []);

  // Set theme and persist
  const setTheme = useCallback(async (mode: ThemeMode) => {
    const resolved = resolveTheme(mode);
    
    // Update state
    setThemeState({ mode, resolved });
    
    // Persist to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    
    // Apply to document
    applyTheme(resolved);
    
    // Sync to cloud (fire and forget)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ theme: mode } as any)
          .eq('user_id', user.id);
      }
    } catch (e) {
      // Silently fail cloud sync
    }
  }, [applyTheme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme.mode === 'system') {
        const resolved = resolveTheme('system');
        setThemeState(prev => ({ ...prev, resolved }));
        applyTheme(resolved);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme.mode, applyTheme]);

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme.resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    const modes: ThemeMode[] = ['light', 'dark', 'oled', 'system'];
    const currentIndex = modes.indexOf(theme.mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setTheme(nextMode);
  }, [theme.mode, setTheme]);

  return {
    mode: theme.mode,
    resolved: theme.resolved,
    isDark: theme.resolved === 'dark' || theme.resolved === 'oled',
    isOled: theme.resolved === 'oled',
    setTheme,
    toggleTheme,
  };
};

// Export a simple function for components that just need to read theme
export const getStoredTheme = (): ThemeMode => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return (stored as ThemeMode) || 'dark';
};

/**
 * Load theme from cloud profile when user logs in on a new device.
 * Only applies if localStorage has no stored value yet.
 */
export const loadCloudTheme = async (userId: string) => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored) return; // User already has a local preference

  try {
    const { data } = await supabase
      .from('profiles')
      .select('theme')
      .eq('user_id', userId)
      .maybeSingle();

    const cloudTheme = (data as any)?.theme as ThemeMode | undefined;
    if (cloudTheme && ['light', 'dark', 'oled'].includes(cloudTheme)) {
      localStorage.setItem(THEME_STORAGE_KEY, cloudTheme);

      const root = document.documentElement;
      root.classList.remove('light', 'dark', 'oled');
      if (cloudTheme === 'oled') {
        root.classList.add('dark', 'oled');
      } else {
        root.classList.add(cloudTheme);
      }
    }
  } catch {
    // Silently fail
  }
};
