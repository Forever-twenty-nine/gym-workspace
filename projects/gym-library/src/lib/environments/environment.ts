import { Environment } from '../models/environment.model';

// @ts-ignore
import { firebaseSecrets } from './environment.secrets';

export const developmentEnvironment: Environment = {
  production: false,
  useEmulator: true,
  firebase: firebaseSecrets || {
    apiKey: 'demo',
    authDomain: 'demo.firebaseapp.com',
    projectId: 'demo-project',
    storageBucket: 'demo-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:demo',
    measurementId: 'G-DEMO',
  },
};