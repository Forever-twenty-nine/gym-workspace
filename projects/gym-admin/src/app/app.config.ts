import { SesionRutinaFirestoreAdapter } from './adapters/sesion-rutina-firestore.adapter';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';

import { environment } from '../environments/environment';
import { provideFirestore, getFirestore, connectFirestoreEmulator } from '@angular/fire/firestore';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth, connectAuthEmulator } from '@angular/fire/auth';
import { 
  EntrenadoService, 
  UserService, 
  RutinaService, 
  EjercicioService, 
  EntrenadorService, 
  GimnasioService,
  NotificacionService,
  MensajeService,
  ConversacionService,
  InvitacionService,
  SesionRutinaService,
  ENTRENADOR_FIRESTORE_ADAPTER, 
  GIMNASIO_FIRESTORE_ADAPTER,
  ESTADISTICAS_ENTRENADO_FIRESTORE_ADAPTER
} from 'gym-library';
import { EntrenadoFirestoreAdapter } from './adapters/entrenado-firestore.adapter';
import { UserFirestoreAdapter } from './adapters/user-firestore.adapter';
import { RutinaFirestoreAdapter } from './adapters/rutina-firestore.adapter';
import { EjercicioFirestoreAdapter } from './adapters/ejercicio-firestore.adapter';
import { EntrenadorFirestoreAdapter } from './adapters/entrenador-firestore.adapter';
import { GimnasioFirestoreAdapter } from './adapters/gimnasio-firestore.adapter';
import { NotificacionFirestoreAdapter } from './adapters/notificacion-firestore.adapter';
import { MensajeFirestoreAdapter } from './adapters/mensaje-firestore.adapter';
import { ConversacionFirestoreAdapter } from './adapters/conversacion-firestore.adapter';
import { InvitacionFirestoreAdapter } from './adapters/invitacion-firestore.adapter';
import { EstadisticasEntrenadoFirestoreAdapter } from './adapters/estadisticas-entrenado-firestore.adapter';

import { routes } from './app.routes';

// Función para inicializar los adaptadores de servicios
function initializeServiceAdapters(
  entrenadoService: EntrenadoService,
  userService: UserService,
  rutinaService: RutinaService,
  ejercicioService: EjercicioService,
  entrenadorService: EntrenadorService,
  gimnasioService: GimnasioService,
  notificacionService: NotificacionService,
  mensajeService: MensajeService,
  conversacionService: ConversacionService,
  invitacionService: InvitacionService,
  sesionRutinaService: SesionRutinaService,
  entrenadoAdapter: EntrenadoFirestoreAdapter,
  userAdapter: UserFirestoreAdapter,
  rutinaAdapter: RutinaFirestoreAdapter,
  ejercicioAdapter: EjercicioFirestoreAdapter,
  entrenadorAdapter: EntrenadorFirestoreAdapter,
  gimnasioAdapter: GimnasioFirestoreAdapter,
  notificacionAdapter: NotificacionFirestoreAdapter,
  mensajeAdapter: MensajeFirestoreAdapter,
  conversacionAdapter: ConversacionFirestoreAdapter,
  invitacionAdapter: InvitacionFirestoreAdapter,
  sesionRutinaAdapter: SesionRutinaFirestoreAdapter
) {
  return () => {
    // Configurar adaptadores
    entrenadoService.setFirestoreAdapter(entrenadoAdapter);
    userService.setFirestoreAdapter(userAdapter);
    rutinaService.setFirestoreAdapter(rutinaAdapter);
    ejercicioService.setFirestoreAdapter(ejercicioAdapter);
    // NOTA: entrenadorService usa injection token, no necesita setFirestoreAdapter
    gimnasioService.setFirestoreAdapter(gimnasioAdapter);
    notificacionService.setFirestoreAdapter(notificacionAdapter);
    mensajeService.setFirestoreAdapter(mensajeAdapter);
    conversacionService.setFirestoreAdapter(conversacionAdapter);
    invitacionService.setFirestoreAdapter(invitacionAdapter);
    sesionRutinaService.setFirestoreAdapter(sesionRutinaAdapter);
    
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = getFirestore();
      if ((environment as any).useEmulator) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      }
      return firestore;
    }),
    provideAuth(() => {
      const auth = getAuth();
      auth.useDeviceLanguage();
      if ((environment as any).useEmulator) {
        connectAuthEmulator(auth, 'http://localhost:9099', {disableWarnings: true});
      }
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
    // Proveer el adaptador de estadísticas de entrenados
    {
      provide: ESTADISTICAS_ENTRENADO_FIRESTORE_ADAPTER,
      useClass: EstadisticasEntrenadoFirestoreAdapter
    },
    // Proveer el adaptador de sesiones de rutina
    SesionRutinaFirestoreAdapter,
    // Inicializar los adaptadores de servicios al arranque
    {
      provide: APP_INITIALIZER,
      useFactory: initializeServiceAdapters,
      deps: [
        EntrenadoService, 
        UserService, 
        RutinaService, 
        EjercicioService,
        EntrenadorService,
        GimnasioService,
        NotificacionService,
        MensajeService,
        ConversacionService,
        InvitacionService,
        SesionRutinaService,
        EntrenadoFirestoreAdapter, 
        UserFirestoreAdapter,
        RutinaFirestoreAdapter,
        EjercicioFirestoreAdapter,
        EntrenadorFirestoreAdapter,
        GimnasioFirestoreAdapter,
        NotificacionFirestoreAdapter,
        MensajeFirestoreAdapter,
        ConversacionFirestoreAdapter,
        InvitacionFirestoreAdapter,
        SesionRutinaFirestoreAdapter
      ],
      multi: true
    }
  ]
};
