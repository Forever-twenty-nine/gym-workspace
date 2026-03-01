import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { initializeApp } from 'firebase/app';

import { getFirestore, connectFirestoreEmulator, Firestore as FirebaseFirestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth as FirebaseAuth } from 'firebase/auth';
import { FIRESTORE, AUTH } from './services/firebase.tokens';

// Inicializar Firebase nativo
const firebaseApp = initializeApp(environment.firebase);
const firestore = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

if ((environment as any).useEmulator) {
  connectFirestoreEmulator(firestore, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}
auth.useDeviceLanguage();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Proveedores de Firebase nativo usando Tokens
    { provide: FIRESTORE, useValue: firestore },
    { provide: AUTH, useValue: auth },
  ]
};

