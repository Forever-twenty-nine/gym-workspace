interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    url?: string;
    cleartext?: boolean;
  };
  android?: any;
  ios?: any;
}

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'gym-app',
  webDir: 'www'
};

export default config;
