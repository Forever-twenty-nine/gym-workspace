import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage-angular';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { applyInitialTheme } from 'theme';
import { InjectionToken } from '@angular/core';
import { environment } from './environments/environment';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';

import { FIRESTORE, AUTH } from './app/core/firebase.tokens';

// Inicializar Firebase nativo
const firebaseApp = initializeApp(environment.firebase);
const firestore = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);


if ((environment as any).useEmulator) {
  connectFirestoreEmulator(firestore, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}
auth.useDeviceLanguage();

// config
import { appProviders } from './app/core/app.config';

applyInitialTheme();

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(IonicStorageModule.forRoot()),
    // Proveedores de Firebase nativo usando Tokens
    { provide: FIRESTORE, useValue: firestore },
    { provide: AUTH, useValue: auth },
    // app config
    ...appProviders
  ],
});

