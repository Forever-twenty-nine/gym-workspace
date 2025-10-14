import { Environment } from '../models/environment.model';

// @ts-ignore
import { firebaseSecrets } from './environment.secrets';

export const productionEnvironment: Environment = {
  production: true,
  firebase: firebaseSecrets || {
    apiKey: 'TU_API_KEY_PROD',
    authDomain: 'TU_AUTH_DOMAIN_PROD',
    projectId: 'TU_PROJECT_ID_PROD',
    storageBucket: 'TU_STORAGE_BUCKET_PROD',
    messagingSenderId: 'TU_MESSAGING_SENDER_ID_PROD',
    appId: 'TU_APP_ID_PROD',
    measurementId: 'TU_MEASUREMENT_ID_PROD',
  },
};