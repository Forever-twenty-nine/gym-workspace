import { APP_INITIALIZER } from '@angular/core';
import { EntrenadoService } from '../services/entrenado.service';
import { UserService } from '../services/user.service';
import { RutinaService } from '../services/rutina.service';
import { EjercicioService } from '../services/ejercicio.service';
import { NotificacionService } from '../services/notificacion.service';
import { EntrenadorService, ENTRENADOR_FIRESTORE_ADAPTER } from '../services/entrenador.service';
import { GimnasioService, GIMNASIO_FIRESTORE_ADAPTER } from '../services/gimnasio.service';
import { InvitacionService } from '../services/invitacion.service';
import { EntrenadoFirestoreAdapter } from './adapters/entrenado-firestore.adapter';


import { UserFirestoreAdapter } from './adapters/user-firestore.adapter';
import { RutinaFirestoreAdapter } from './adapters/rutina-firestore.adapter';
import { EjercicioFirestoreAdapter } from './adapters/ejercicio-firestore.adapter';
import { NotificacionFirestoreAdapter } from './adapters/notificacion-firestore.adapter';
import { EntrenadorFirestoreAdapter } from './adapters/entrenador-firestore.adapter';
import { GimnasioFirestoreAdapter } from './adapters/gimnasio-firestore.adapter';
import { InvitacionFirestoreAdapter } from './adapters/invitacion-firestore.adapter';

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
  invitacionService: InvitacionService,
  entrenadoAdapter: EntrenadoFirestoreAdapter,
  userAdapter: UserFirestoreAdapter,
  rutinaAdapter: RutinaFirestoreAdapter,
  ejercicioAdapter: EjercicioFirestoreAdapter,
  notificacionAdapter: NotificacionFirestoreAdapter,
  entrenadorAdapter: EntrenadorFirestoreAdapter,
  gimnasioAdapter: GimnasioFirestoreAdapter,
  invitacionAdapter: InvitacionFirestoreAdapter
) {
  return () => {
    // Configurar adaptadores
    entrenadoService.setFirestoreAdapter(entrenadoAdapter);
    userService.setFirestoreAdapter(userAdapter);
    rutinaService.setFirestoreAdapter(rutinaAdapter);
    ejercicioService.setFirestoreAdapter(ejercicioAdapter);
    notificacionService.setFirestoreAdapter(notificacionAdapter);
    invitacionService.setFirestoreAdapter(invitacionAdapter);
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
      InvitacionService,
      EntrenadoFirestoreAdapter,
      UserFirestoreAdapter,
      RutinaFirestoreAdapter,
      EjercicioFirestoreAdapter,
      NotificacionFirestoreAdapter,
      EntrenadorFirestoreAdapter,
      GimnasioFirestoreAdapter,
      InvitacionFirestoreAdapter
    ],
    multi: true
  }
];