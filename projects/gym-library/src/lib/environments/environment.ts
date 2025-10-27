import { Environment } from '../models/environment.model';

// @ts-ignore
import { firebaseSecrets } from './environment.secrets';

/**
 * Configuración base de Firebase
 * Usa las claves reales si existen, o valores demo como fallback
 */
const getFirebaseConfig = () => {
  return firebaseSecrets || {
    apiKey: 'demo',
    authDomain: 'demo.firebaseapp.com',
    projectId: 'default-project',
    storageBucket: 'default-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:demo',
    measurementId: 'G-DEMO',
  };
};

/**
 * Entorno de desarrollo con emuladores
 * Usa Firebase Emulator Suite para desarrollo local
 */
export const developmentEnvironment: Environment = {
  production: false,
  useEmulator: true,
  firebase: {
    ...getFirebaseConfig(),
    // Cuando usamos emuladores, forzamos el projectId para que coincida con los emuladores
    projectId: 'default-project',
    storageBucket: 'default-project.appspot.com',
  },
};

/**
 * Entorno de desarrollo con Firebase real
 * Usa Firebase en la nube sin emuladores
 */
export const firebaseEnvironment: Environment = {
  production: false,
  useEmulator: false,
  firebase: getFirebaseConfig(),
};

/**
 * Entorno de producción
 * Usa Firebase en la nube con configuración de producción
 */
export const productionEnvironment: Environment = {
  production: true,
  useEmulator: false,
  firebase: getFirebaseConfig(),
};