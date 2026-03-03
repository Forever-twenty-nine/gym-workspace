import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage-angular';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { applyInitialTheme } from 'theme';
import { InjectionToken } from '@angular/core';
import { environment } from './environments/environment';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

import { FIRESTORE, AUTH, STORAGE } from './app/core/firebase.tokens';

// Inicializar Firebase nativo
const firebaseApp = initializeApp(environment.firebase);
const firestore = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);


if ((environment as any).useEmulator) {
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}
auth.useDeviceLanguage();



applyInitialTheme();

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(), { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(IonicStorageModule.forRoot()),
    // Proveedores de Firebase nativo usando Tokens
    { provide: FIRESTORE, useValue: firestore },
    { provide: AUTH, useValue: auth },
    { provide: STORAGE, useValue: storage },

  ],
});

