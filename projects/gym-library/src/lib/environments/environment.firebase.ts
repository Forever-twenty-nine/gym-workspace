import { Environment } from '../models/environment.model';

// @ts-ignore
import { firebaseSecrets } from './environment.secrets';

export const firebaseEnvironment: Environment = {
  production: false,
  useEmulator: false,
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