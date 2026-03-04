import { Environment } from '../models/environment.model';

// @ts-ignore
import { firebaseSecrets } from './environment.secrets';

const defaultFirebase = {
  apiKey: 'demo',
  authDomain: 'demo.firebaseapp.com',
  projectId: 'default-project',
  storageBucket: 'default-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:demo',
  measurementId: 'G-DEMO',
};

const chosenFirebase = (firebaseSecrets && firebaseSecrets.apiKey && firebaseSecrets.apiKey.length > 0)
  ? firebaseSecrets
  : defaultFirebase;

export const developmentEnvironment: Environment = {
  production: false,
  useEmulator: true,
  firebase: {
    ...chosenFirebase,
    // Cuando usamos emuladores, forzamos el projectId para que coincida con los emuladores
    projectId: 'default-project',
    storageBucket: 'default-project.appspot.com',
  },
};