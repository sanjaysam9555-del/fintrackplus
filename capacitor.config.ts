import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.79a3e63ba41d4b9cbf1d9935381d7325',
  appName: 'FinTrack Pro',
  webDir: 'dist',
  server: {
    url: 'https://79a3e63b-a41d-4b9c-bf1d-9935381d7325.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#f8fafc',
    preferredContentMode: 'mobile'
  },
  android: {
    backgroundColor: '#f8fafc'
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f8fafc'
    }
  }
};

export default config;