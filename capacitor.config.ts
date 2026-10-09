import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thrishank.meditation',
  appName: 'Meditation',
  webDir: 'dist-native',
  backgroundColor: '#FAFAF9',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_meditation',
      iconColor: '#78716C',
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#FAFAF9',
    },
  },
};

export default config;
