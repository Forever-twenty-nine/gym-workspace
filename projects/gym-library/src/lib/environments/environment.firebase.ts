import { Environment } from '../models/environment.model';

// @ts-ignore
import { firebaseSecrets } from './environment.secrets';

const defaultFirebase = {
  apiKey: 'demo',
  authDomain: 'demo.firebaseapp.com',
  projectId: 'demo-project',
  storageBucket: 'demo-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:demo',
  measurementId: 'G-DEMO',
};

const firebaseConfig = (firebaseSecrets && firebaseSecrets.apiKey && firebaseSecrets.apiKey.length > 0)
  ? firebaseSecrets
  : defaultFirebase;

export const firebaseEnvironment: Environment = {
  production: false,
  useEmulator: false,
  firebase: firebaseConfig,
};