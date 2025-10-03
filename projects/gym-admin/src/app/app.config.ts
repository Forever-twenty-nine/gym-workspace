import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';

import { environment } from '../environments/environment';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { ClienteService, UserService, RutinaService, EjercicioService, EntrenadorService, GimnasioService, ENTRENADOR_FIRESTORE_ADAPTER, GIMNASIO_FIRESTORE_ADAPTER } from 'gym-library';
import { ClienteFirestoreAdapter } from './adapters/cliente-firestore.adapter';
import { UserFirestoreAdapter } from './adapters/user-firestore.adapter';
import { RutinaFirestoreAdapter } from './adapters/rutina-firestore.adapter';
import { EjercicioFirestoreAdapter } from './adapters/ejercicio-firestore.adapter';
import { EntrenadorFirestoreAdapter } from './adapters/entrenador-firestore.adapter';
import { GimnasioFirestoreAdapter } from './adapters/gimnasio-firestore.adapter';

import { routes } from './app.routes';

// Función para inicializar los adaptadores de servicios
function initializeServiceAdapters(
  clienteService: ClienteService,
  userService: UserService,
  rutinaService: RutinaService,
  ejercicioService: EjercicioService,
  gimnasioService: GimnasioService,
  clienteAdapter: ClienteFirestoreAdapter,
  userAdapter: UserFirestoreAdapter,
  rutinaAdapter: RutinaFirestoreAdapter,
  ejercicioAdapter: EjercicioFirestoreAdapter,
  gimnasioAdapter: GimnasioFirestoreAdapter
) {
  return () => {
    console.log('🔧 Inicializando adaptadores de servicios para gym-admin...');
    
    // Configurar adaptadores
    clienteService.setFirestoreAdapter(clienteAdapter);
    userService.setFirestoreAdapter(userAdapter);
    rutinaService.setFirestoreAdapter(rutinaAdapter);
    ejercicioService.setFirestoreAdapter(ejercicioAdapter);
    gimnasioService.setFirestoreAdapter(gimnasioAdapter);
    
    console.log('✅ Adaptadores configurados correctamente');
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    provideAuth(() => {
      const auth = getAuth();
      auth.useDeviceLanguage();
      return auth;
    }),
    // Proveer el adaptador de entrenadores
    {
      provide: ENTRENADOR_FIRESTORE_ADAPTER,
      useClass: EntrenadorFirestoreAdapter
    },
    // Proveer el adaptador de gimnasios
    {
      provide: GIMNASIO_FIRESTORE_ADAPTER,
      useClass: GimnasioFirestoreAdapter
    },
    // Inicializar los adaptadores de servicios al arranque
    {
      provide: APP_INITIALIZER,
      useFactory: initializeServiceAdapters,
      deps: [
        ClienteService, 
        UserService, 
        RutinaService, 
        EjercicioService,
        GimnasioService,
        ClienteFirestoreAdapter, 
        UserFirestoreAdapter,
        RutinaFirestoreAdapter,
        EjercicioFirestoreAdapter,
        GimnasioFirestoreAdapter
      ],
      multi: true
    }
  ]
};
