import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thrishank.meditation',
  appName: 'Meditation',
  webDir: 'dist-native',
  backgroundColor: '#FAFAF9',
  android: {
    // Bells use Web Audio inside the WebView; keep it running when the screen dims
    allowMixedContent: false,
  },
};

export default config;
