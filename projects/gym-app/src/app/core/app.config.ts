import { APP_INITIALIZER } from '@angular/core';
import {
  EntrenadoService,
  UserService,
  RutinaService,
  EjercicioService,
  NotificacionService
} from 'gym-library';
import { EntrenadoFirestoreAdapter } from './adapters/entrenado-firestore.adapter';
import { UserFirestoreAdapter } from './adapters/user-firestore.adapter';
import { RutinaFirestoreAdapter } from './adapters/rutina-firestore.adapter';
import { EjercicioFirestoreAdapter } from './adapters/ejercicio-firestore.adapter';
import { NotificacionFirestoreAdapter } from './adapters/notificacion-firestore.adapter';

/**
 * Función para inicializar los adaptadores de servicios
 */
function initializeServiceAdapters(
  entrenadoService: EntrenadoService,
  userService: UserService,
  rutinaService: RutinaService,
  ejercicioService: EjercicioService,
  notificacionService: NotificacionService,
  entrenadoAdapter: EntrenadoFirestoreAdapter,
  userAdapter: UserFirestoreAdapter,
  rutinaAdapter: RutinaFirestoreAdapter,
  ejercicioAdapter: EjercicioFirestoreAdapter,
  notificacionAdapter: NotificacionFirestoreAdapter
) {
  return () => {
    // Configurar adaptadores
    entrenadoService.setFirestoreAdapter(entrenadoAdapter);
    userService.setFirestoreAdapter(userAdapter);
    rutinaService.setFirestoreAdapter(rutinaAdapter);
    ejercicioService.setFirestoreAdapter(ejercicioAdapter);
    notificacionService.setFirestoreAdapter(notificacionAdapter);

    return Promise.resolve();
  };
}

/**
 * Proveedores para la configuración de la aplicación
 */
export const appProviders = [
  // Inicializar los adaptadores de servicios al arranque
  {
    provide: APP_INITIALIZER,
    useFactory: initializeServiceAdapters,
    deps: [
      EntrenadoService,
      UserService,
      RutinaService,
      EjercicioService,
      NotificacionService,
      EntrenadoFirestoreAdapter,
      UserFirestoreAdapter,
      RutinaFirestoreAdapter,
      EjercicioFirestoreAdapter,
      NotificacionFirestoreAdapter
    ],
    multi: true
  }
];