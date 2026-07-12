import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fintrackplus',
  appName: 'FinTrack+',
  webDir: 'dist',
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