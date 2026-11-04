import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.indiancommodities.stack',
  appName: 'Stack Inspection',
  webDir: 'dist/stack-mobile/browser',
  plugins: {
    // Routes Angular HttpClient calls through native HTTP on the device,
    // so the API does not need CORS rules for the app's https://localhost origin.
    CapacitorHttp: { enabled: true },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
