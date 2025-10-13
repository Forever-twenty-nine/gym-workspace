import { APP_INITIALIZER } from '@angular/core';
import {
  EntrenadoService,
  UserService,
  RutinaService,
  EjercicioService,
  NotificacionService,
  EntrenadorService,
  GimnasioService,
  ENTRENADOR_FIRESTORE_ADAPTER,
  GIMNASIO_FIRESTORE_ADAPTER
} from 'gym-library';
import { EntrenadoFirestoreAdapter } from './adapters/entrenado-firestore.adapter';
import { UserFirestoreAdapter } from './adapters/user-firestore.adapter';
import { RutinaFirestoreAdapter } from './adapters/rutina-firestore.adapter';
import { EjercicioFirestoreAdapter } from './adapters/ejercicio-firestore.adapter';
import { NotificacionFirestoreAdapter } from './adapters/notificacion-firestore.adapter';
import { EntrenadorFirestoreAdapter } from './adapters/entrenador-firestore.adapter';
import { GimnasioFirestoreAdapter } from './adapters/gimnasio-firestore.adapter';

/**
 * Función para inicializar los adaptadores de servicios (llamar manualmente cuando sea necesario)
 */
function initializeServiceAdapters(
  entrenadoService: EntrenadoService,
  userService: UserService,
  rutinaService: RutinaService,
  ejercicioService: EjercicioService,
  notificacionService: NotificacionService,
  entrenadorService: EntrenadorService,
  gimnasioService: GimnasioService,
  entrenadoAdapter: EntrenadoFirestoreAdapter,
  userAdapter: UserFirestoreAdapter,
  rutinaAdapter: RutinaFirestoreAdapter,
  ejercicioAdapter: EjercicioFirestoreAdapter,
  notificacionAdapter: NotificacionFirestoreAdapter,
  entrenadorAdapter: EntrenadorFirestoreAdapter,
  gimnasioAdapter: GimnasioFirestoreAdapter
) {
  return () => {
    // Configurar adaptadores
    entrenadoService.setFirestoreAdapter(entrenadoAdapter);
    userService.setFirestoreAdapter(userAdapter);
    rutinaService.setFirestoreAdapter(rutinaAdapter);
    ejercicioService.setFirestoreAdapter(ejercicioAdapter);
    notificacionService.setFirestoreAdapter(notificacionAdapter);
    // NOTA: entrenadorService y gimnasioService usan injection tokens, no necesitan setFirestoreAdapter

    return Promise.resolve();
  };
}

/**
 * Proveedores para la configuración de la aplicación
 */
export const appProviders = [
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
  // Inicializar los adaptadores de servicios al arranque (solo los básicos)
  {
    provide: APP_INITIALIZER,
    useFactory: initializeServiceAdapters,
    deps: [
      EntrenadoService,
      UserService,
      RutinaService,
      EjercicioService,
      NotificacionService,
      EntrenadorService,
      GimnasioService,
      EntrenadoFirestoreAdapter,
      UserFirestoreAdapter,
      RutinaFirestoreAdapter,
      EjercicioFirestoreAdapter,
      NotificacionFirestoreAdapter,
      EntrenadorFirestoreAdapter,
      GimnasioFirestoreAdapter
    ],
    multi: true
  }
];