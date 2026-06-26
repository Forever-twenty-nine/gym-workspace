import { signal } from '@angular/core';
import { Rol, TipoMensaje, Plan, Convocatoria, Desafio, DesafioParticipacion, SesionRutina } from 'gym-library';
import { TarjetaDescubrir } from '../../core/types/descubrir.types';
import { Subject } from 'rxjs';

// --- MOCK DATA ---

export const mockCurrentUser = {
  uid: 'user-current',
  nombre: 'Mi Perfil',
  photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  gimnasioId: 'gym-123',
  plan: Plan.PREMIUM
};

export const mockUsers: Record<string, any> = {
  'user-current': mockCurrentUser,
  'user-partner': {
    uid: 'user-partner',
    nombre: 'Juan Pérez',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    gimnasioId: 'gym-123'
  },
  'user-3': {
    uid: 'user-3',
    nombre: 'María Gómez',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    gimnasioId: 'gym-123'
  },
  'user-4': {
    uid: 'user-4',
    nombre: 'Carlos López',
    photoURL: null,
    gimnasioId: 'gym-123'
  }
};

export const mockEntrenadoProfile = {
  id: 'user-current',
  seguidos: ['user-partner', 'user-3'],
  seguidores: ['user-partner']
};

export const mockMensajesList: any[] = [
  {
    id: 'msg-1',
    remitenteId: 'user-partner',
    remitenteTipo: Rol.ENTRENADO,
    destinatarioId: 'user-current',
    destinatarioTipo: Rol.ENTRENADO,
    contenido: '¡Hola! ¿Sale entrenar piernas hoy?',
    tipo: TipoMensaje.TEXTO,
    leido: false,
    entregado: true,
    fechaEnvio: new Date(Date.now() - 3600000 * 2)
  },
  {
    id: 'msg-2',
    remitenteId: 'user-current',
    remitenteTipo: Rol.ENTRENADO,
    destinatarioId: 'user-partner',
    destinatarioTipo: Rol.ENTRENADO,
    contenido: '¡Hola! Sí, me sumo. De 18 a 20 hs estoy libre.',
    tipo: TipoMensaje.TEXTO,
    leido: true,
    entregado: true,
    fechaEnvio: new Date(Date.now() - 3600000)
  },
  {
    id: 'msg-3',
    remitenteId: 'user-3',
    remitenteTipo: Rol.ENTRENADO,
    destinatarioId: 'user-current',
    destinatarioTipo: Rol.ENTRENADO,
    contenido: '¿Vamos a correr un rato?',
    tipo: TipoMensaje.TEXTO,
    leido: false,
    entregado: true,
    fechaEnvio: new Date(Date.now() - 1800000)
  }
];

export const mockConvocatorias: Convocatoria[] = [
  {
    id: 'convo-1',
    creadorId: 'user-partner',
    creadorNombre: 'Juan Pérez',
    gimnasioId: 'gym-123',
    fechaCreacion: new Date(),
    fechaEntrenamiento: new Date(Date.now() + 24 * 3600 * 1000),
    horaInicio: '18:00',
    horaFin: '19:30',
    mensaje: 'Entrenamiento de pecho a morir 💪 Traigan agua.',
    interesados: ['user-current', 'user-3'],
    activo: true,
    esOficial: false,
    esSemanal: false
  },
  {
    id: 'convo-2',
    creadorId: 'user-current',
    creadorNombre: 'Mi Perfil',
    gimnasioId: 'gym-123',
    fechaCreacion: new Date(),
    fechaEntrenamiento: new Date(),
    horaInicio: '19:00',
    horaFin: '21:00',
    mensaje: 'Funcional libre al aire libre',
    interesados: ['user-partner'],
    activo: true,
    esOficial: true,
    esSemanal: true
  }
];

export const mockDesafios: Desafio[] = [
  {
    id: 'des-1',
    creadorId: 'user-partner',
    creadorNombre: 'Juan Pérez',
    gimnasioId: 'gym-123',
    titulo: '100 Flexiones en 2 min',
    fechaCreacion: new Date(),
    fechaVencimiento: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    activo: true
  },
  {
    id: 'des-2',
    creadorId: 'user-current',
    creadorNombre: 'Mi Perfil',
    gimnasioId: 'gym-123',
    titulo: 'Sentadilla 100kg x12 reps',
    logroRelacionado: 'PR de 12 repeticiones',
    fechaCreacion: new Date(),
    fechaVencimiento: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    activo: true
  }
  ,
  {
    id: 'des-3',
    creadorId: 'user-3',
    creadorNombre: 'María Gómez',
    gimnasioId: 'gym-123',
    titulo: 'Correr 5km en menos de 25 min',
    fechaCreacion: new Date(),
    fechaVencimiento: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    activo: true
  },
  {
    id: 'des-4',
    creadorId: 'user-partner',
    creadorNombre: 'Juan Pérez',
    gimnasioId: 'gym-123',
    titulo: 'Plancha abdominal 5 minutos',
    fechaCreacion: new Date(),
    fechaVencimiento: new Date(Date.now() + 10 * 24 * 3600 * 1000),
    activo: true
  },
  {
    id: 'des-5',
    creadorId: 'user-3',
    creadorNombre: 'María Gómez',
    gimnasioId: 'gym-123',
    titulo: 'Burpees x 50 en 3 min',
    fechaCreacion: new Date(),
    fechaVencimiento: new Date(Date.now() + 4 * 24 * 3600 * 1000),
    activo: true
  }
];

export const mockParticipaciones: DesafioParticipacion[] = [
  {
    id: 'part-1',
    desafioId: 'des-1',
    participanteId: 'user-current',
    participanteNombre: 'Mi Perfil',
    participanteFoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    estado: 'aceptado',
    fechaAceptacion: new Date()
  },
  {
    id: 'part-2',
    desafioId: 'des-1',
    participanteId: 'user-partner',
    participanteNombre: 'Juan Pérez',
    participanteFoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    estado: 'superado',
    fechaAceptacion: new Date(),
    fechaRespuesta: new Date()
  },
  {
    id: 'part-3',
    desafioId: 'des-3',
    participanteId: 'user-current',
    participanteNombre: 'Mi Perfil',
    participanteFoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    estado: 'aceptado',
    fechaAceptacion: new Date()
  },
  {
    id: 'part-5',
    desafioId: 'des-5',
    participanteId: 'user-current',
    participanteNombre: 'Mi Perfil',
    participanteFoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    estado: 'superado',
    fechaAceptacion: new Date(),
    fechaRespuesta: new Date()
  }
];

export const mockSesionesCompartidas: any[] = [
  {
    id: 'sesion-1',
    entrenadoId: 'user-current',
    nombreUsuario: 'Mi Perfil',
    fotoUsuario: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    fechaInicio: new Date(Date.now() - 3600000 * 4),
    duracion: 3600,
    completada: true,
    likes: ['user-partner'],
    fechaCompartida: new Date(Date.now() - 3600000 * 4),
    fotoProgreso: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
    rutinaResumen: {
      id: 'rut-1',
      nombre: 'Hipertrofia de Pecho',
      ejercicios: [
        { id: 'ej-1', nombre: 'Press de Banca', series: 4, repeticiones: 12 },
        { id: 'ej-2', nombre: 'Aperturas con Mancuernas', series: 4, repeticiones: 12 }
      ]
    }
  },
  {
    id: 'sesion-2',
    entrenadoId: 'user-current',
    nombreUsuario: 'Mi Perfil',
    fotoUsuario: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    fechaInicio: new Date(Date.now() - 3600000 * 24 * 2), // hace 2 días
    duracion: 2400,
    completada: true,
    likes: [],
    fechaCompartida: new Date(Date.now() - 3600000 * 24 * 2),
    rutinaResumen: {
      id: 'rut-2',
      nombre: 'Día de Piernas Pesado',
      ejercicios: [
        { id: 'ej-3', nombre: 'Sentadillas', series: 4, repeticiones: 8 },
        { id: 'ej-4', nombre: 'Prensa', series: 3, repeticiones: 12 }
      ]
    }
  },
  {
    id: 'sesion-3',
    entrenadoId: 'user-current',
    nombreUsuario: 'Mi Perfil',
    fotoUsuario: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    fechaInicio: new Date(Date.now() - 3600000 * 24 * 5), // hace 5 días
    duracion: 1800,
    completada: true,
    likes: ['user-3'],
    fechaCompartida: new Date(Date.now() - 3600000 * 24 * 5),
    fotoProgreso: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=600',
    rutinaResumen: {
      id: 'rut-3',
      nombre: 'Cardio y Abs',
      ejercicios: [
        { id: 'ej-5', nombre: 'Cinta', series: 1, repeticiones: 20 },
        { id: 'ej-6', nombre: 'Plancha', series: 3, repeticiones: 60 }
      ]
    }
  }
];

export const mockTarjetasDescubrirList: TarjetaDescubrir[] = [
  {
    id: 'user-partner',
    tipo: 'afinidad',
    data: {
      id: 'user-partner',
      nombre: 'Juan Pérez',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      matchReasons: ['Entrena Pecho y Espalda como tú', 'Va de 18:00 a 20:00 hs']
    }
  },
  {
    id: 'user-3',
    tipo: 'horario',
    data: {
      id: 'user-3',
      nombre: 'María Gómez',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      matchReasons: ['Entrena a la mañana de 08:00 a 10:00 hs']
    }
  },
  {
    id: 'user-4',
    tipo: 'general',
    data: {
      id: 'user-4',
      nombre: 'Carlos López',
      photoURL: null,
      matchReasons: ['Nuevo atleta en tu gimnasio']
    }
  }
];

// --- MOCK SERVICES ---

export const mockAuthService = {
  currentUser: signal(mockCurrentUser)
};

export const mockUserService = {
  getUserByUid: (uid: string) => {
    return signal(mockUsers[uid] || { uid, nombre: 'Atleta', photoURL: null, gimnasioId: 'gym-123' });
  }
};

export const mockMensajeService = {
  mensajes: signal(mockMensajesList),
  marcarComoLeido: () => Promise.resolve(),
  save: () => Promise.resolve()
};

export const mockConvocatoriaService = {
  getConvocatoriasForGym: () => signal(mockConvocatorias),
  toggleInteres: () => Promise.resolve(),
  delete: () => Promise.resolve()
};

export const mockDesafioService = {
  getDesafiosForGym: () => signal(mockDesafios),
  delete: () => Promise.resolve()
};

export const mockEntrenadoService = {
  getEntrenado: () => signal(mockEntrenadoProfile),
  followUser: () => Promise.resolve(),
  unfollowUser: () => Promise.resolve()
};

export const mockMatchService = {
  getTarjetasDescubrir: () => signal(mockTarjetasDescubrirList),
  registrarInteres: () => Promise.resolve(true),
  buildMatchPopupMessage: (tipo: string, active: any, partnerName: string) => {
    return `¡Coincides con ${partnerName}!`;
  }
};

export const mockSesionRutinaService = {
  getSesionesCompartidas: () => signal(mockSesionesCompartidas),
  getSesionesPorEntrenado: () => signal(mockSesionesCompartidas),
  addLike: () => Promise.resolve(),
  removeLike: () => Promise.resolve(),
  setCompartida: () => Promise.resolve(),
  eliminarSesion: () => Promise.resolve()
};

export const mockDesafioParticipacionService = {
  getParticipacionesByDesafio: () => signal(mockParticipaciones),
  getMisParticipaciones: () => signal(mockParticipaciones.filter(p => p.participanteId === 'user-current')),
  aceptarDesafio: () => Promise.resolve(),
  declararResultado: () => Promise.resolve()
};

// --- MOCK CONTROLLERS ---

export const mockModalController = {
  create: () => Promise.resolve({
    present: () => Promise.resolve(),
    onDidDismiss: () => Promise.resolve()
  }),
  dismiss: () => Promise.resolve()
};

export const mockToastController = {
  create: () => Promise.resolve({
    present: () => Promise.resolve()
  })
};

export const mockAlertController = {
  create: () => Promise.resolve({
    present: () => Promise.resolve()
  })
};

export const mockActionSheetController = {
  create: () => Promise.resolve({
    present: () => Promise.resolve()
  })
};

export const mockRutinaService = {
  rutinas: () => signal([
    { id: 'rut-1', nombre: 'Hipertrofia Pecho', ejerciciosIds: ['ej-1', 'ej-2'] },
    { id: 'rut-2', nombre: 'Día de Piernas Pesado', ejerciciosIds: ['ej-3', 'ej-4'] },
    { id: 'rut-3', nombre: 'Cardio y Abs', ejerciciosIds: ['ej-5', 'ej-6'] },
    { id: 'rut-4', nombre: 'Espalda y Bíceps', ejerciciosIds: ['ej-7', 'ej-8'] }
  ]),
  getCreatedByUser: () => signal([]),
  getRutinasForGym: () => signal([
    { id: 'rut-1', nombre: 'Hipertrofia Pecho', ejerciciosIds: ['ej-1', 'ej-2'] },
    { id: 'rut-2', nombre: 'Día de Piernas Pesado', ejerciciosIds: ['ej-3', 'ej-4'] },
    { id: 'rut-3', nombre: 'Cardio y Abs', ejerciciosIds: ['ej-5', 'ej-6'] },
    { id: 'rut-4', nombre: 'Espalda y Bíceps', ejerciciosIds: ['ej-7', 'ej-8'] }
  ]),
  save: () => Promise.resolve()
};

export const mockEjercicioService = {
  ejercicios: () => signal([
    { id: 'ej-1', nombre: 'Press Banca', descripcion: 'Pecho' },
    { id: 'ej-2', nombre: 'Aperturas', descripcion: 'Pecho' },
    { id: 'ej-3', nombre: 'Sentadillas', descripcion: 'Piernas' },
    { id: 'ej-4', nombre: 'Prensa', descripcion: 'Piernas' },
    { id: 'ej-5', nombre: 'Cinta', descripcion: 'Cardio' },
    { id: 'ej-6', nombre: 'Plancha', descripcion: 'Abs' },
    { id: 'ej-7', nombre: 'Dominadas', descripcion: 'Espalda' },
    { id: 'ej-8', nombre: 'Curl Bíceps', descripcion: 'Brazos' }
  ]),
  getCreatedByUser: () => signal([]),
  getEjerciciosForGym: () => signal([
    { id: 'ej-1', nombre: 'Press Banca', descripcion: 'Pecho' },
    { id: 'ej-2', nombre: 'Aperturas', descripcion: 'Pecho' },
    { id: 'ej-3', nombre: 'Sentadillas', descripcion: 'Piernas' },
    { id: 'ej-4', nombre: 'Prensa', descripcion: 'Piernas' },
    { id: 'ej-5', nombre: 'Cinta', descripcion: 'Cardio' },
    { id: 'ej-6', nombre: 'Plancha', descripcion: 'Abs' },
    { id: 'ej-7', nombre: 'Dominadas', descripcion: 'Espalda' },
    { id: 'ej-8', nombre: 'Curl Bíceps', descripcion: 'Brazos' }
  ]),
  save: () => Promise.resolve()
};

export const mockRutinaAsignadaService = {
  getRutinasAsignadasByEntrenado: () => signal([
    { id: 'asig-1', rutinaId: 'rut-1', diaSemana: 1 },
    { id: 'asig-2', rutinaId: 'rut-2', diaSemana: 3 },
    { id: 'asig-3', rutinaId: 'rut-3', diaSemana: 5 },
    { id: 'asig-4', rutinaId: 'rut-4', diaSemana: 0 } // Domingo
  ]),
  getProximasRutinasDashboard: () => signal([]),
  getRutinasAsignadasByEntrenador: () => signal([]),
  getRutinasAsignadas: () => signal([]),
  organizarRutinasSemanales: () => {
    const base = new Date();
    base.setHours(0,0,0,0);
    const day = base.getDay() === 0 ? 6 : base.getDay() - 1; // Ajuste si la semana empieza el lunes
    const startOfWeek = new Date(base);
    startOfWeek.setDate(base.getDate() - day);
    
    return [
      { fecha: new Date(startOfWeek.getTime() + 0*24*3600*1000), rutinas: [{ id: 'rut-1', nombre: 'Hipertrofia Pecho', ejerciciosIds: ['ej-1'] }] },
      { fecha: new Date(startOfWeek.getTime() + 1*24*3600*1000), rutinas: [] },
      { fecha: new Date(startOfWeek.getTime() + 2*24*3600*1000), rutinas: [{ id: 'rut-2', nombre: 'Día de Piernas Pesado', ejerciciosIds: ['ej-3'] }] },
      { fecha: new Date(startOfWeek.getTime() + 3*24*3600*1000), rutinas: [] },
      { fecha: new Date(startOfWeek.getTime() + 4*24*3600*1000), rutinas: [{ id: 'rut-3', nombre: 'Cardio y Abs', ejerciciosIds: ['ej-5'] }] },
      { fecha: new Date(startOfWeek.getTime() + 5*24*3600*1000), rutinas: [] },
      { fecha: new Date(startOfWeek.getTime() + 6*24*3600*1000), rutinas: [{ id: 'rut-4', nombre: 'Espalda y Bíceps', ejerciciosIds: ['ej-7'] }] }
    ];
  },
  save: () => Promise.resolve()
};

export const mockInvitacionService = {
  getInvitacionesForGym: () => signal([]),
  invitaciones: () => signal([])
};

export const mockNavController = {
  navigateRoot: () => {},
  navigateForward: () => {},
  navigateBack: () => {}
};

export const mockRouter = {
  navigate: () => {},
  events: new Subject<any>()
};

export const mockEntrenadorService = {
  getEntrenadorById: () => signal({
    uid: 'coach-123',
    nombre: 'Entrenador de Prueba',
    gimnasioId: 'gym-123',
    rutinasCreadasIds: [],
    ejerciciosCreadasIds: [],
    entrenadosAsignadosIds: []
  }),
  initializeListener: () => {},
  getEjerciciosByEntrenador: () => signal([]),
  getLimits: () => ({
    maxClients: 5,
    maxExercises: 10,
    maxWorkouts: 5
  }),
  addEjercicioCreado: () => Promise.resolve()
};

export const mockNotificacionService = {
  notificaciones: () => signal([]),
  initializeListener: () => {}
};

// Helper array to supply all providers in a single decorator
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { MensajeService } from '../../core/services/mensaje.service';
import { ConvocatoriaService } from '../../core/services/convocatoria.service';
import { DesafioService } from '../../core/services/desafio.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { MatchService } from '../../core/services/match.service';
import { SesionRutinaService } from '../../core/services/sesion-rutina.service';
import { DesafioParticipacionService } from '../../core/services/desafio-participacion.service';
import { RutinaService } from '../../core/services/rutina.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';
import { InvitacionService } from '../../core/services/invitacion.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { EstadisticasEntrenadoService } from '../../core/services/estadisticas-entrenado.service';
import { ProgresoService } from '../../core/services/progreso.service';
import { SocialShareService } from '../../core/services/social-share.service';
import { FirebaseStorageService } from '../../core/services/firebase-storage.service';
import { ComentarioSocialService } from '../../core/services/comentario-social.service';
import { NavController, ToastController, AlertController, ActionSheetController, ModalController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

export const mockEstadisticasEntrenadoService = {
  getEstadisticas: (uid: string) => signal({
    totalRutinasCompletadas: 42,
    rachaActual: 5,
    mejorRacha: 12,
    ultimaFechaEntrenamiento: new Date(),
    nivel: 5,
    experiencia: 450,
    experienciaProximoNivel: 500
  }),
  loading: signal(false),
  error: signal(null),
  initializeListener: () => {},
  stopListener: () => {},
  crearEstadisticasIniciales: () => ({})
};

export const mockComentarioSocialService = {
  getComentarios: (sesionId: string, callback: (comentarios: any[]) => void) => {
    callback([
      {
        id: 'com-1',
        sesionId,
        entrenadoId: 'user-partner',
        nombreUsuario: 'Juan Pérez',
        fotoUsuario: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        contenido: 'Buen entrenamiento. Sigue asi.',
        fecha: new Date(),
        likes: ['user-3']
      },
      {
        id: 'com-2',
        sesionId,
        entrenadoId: 'user-3',
        nombreUsuario: 'María Gómez',
        fotoUsuario: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
        contenido: 'Excelente constancia, te felicito.',
        fecha: new Date(),
        likes: [],
        respuesta: {
          id: 'resp-1',
          entrenadoId: 'user-current',
          nombreUsuario: 'Mi Perfil',
          fotoUsuario: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
          contenido: 'Muchas gracias, costo terminar hoy.',
          fecha: new Date()
        }
      }
    ]);
    return () => {};
  },
  agregarComentario: async () => {},
  responderComentario: async () => {},
  addLike: async () => {},
  removeLike: async () => {},
  eliminarComentario: async () => {}
};

export const mockProviders = [
  { provide: AuthService, useValue: mockAuthService },
  { provide: UserService, useValue: mockUserService },
  { provide: MensajeService, useValue: mockMensajeService },
  { provide: ConvocatoriaService, useValue: mockConvocatoriaService },
  { provide: DesafioService, useValue: mockDesafioService },
  { provide: EntrenadoService, useValue: mockEntrenadoService },
  { provide: MatchService, useValue: mockMatchService },
  { provide: SesionRutinaService, useValue: mockSesionRutinaService },
  { provide: DesafioParticipacionService, useValue: mockDesafioParticipacionService },
  { provide: RutinaService, useValue: mockRutinaService },
  { provide: EjercicioService, useValue: mockEjercicioService },
  { provide: RutinaAsignadaService, useValue: mockRutinaAsignadaService },
  { provide: InvitacionService, useValue: mockInvitacionService },
  { provide: EntrenadorService, useValue: mockEntrenadorService },
  { provide: NotificacionService, useValue: mockNotificacionService },
  { provide: EstadisticasEntrenadoService, useValue: mockEstadisticasEntrenadoService },
  { provide: ComentarioSocialService, useValue: mockComentarioSocialService },
  { provide: ProgresoService, useValue: {} },
  { provide: SocialShareService, useValue: {} },
  { provide: FirebaseStorageService, useValue: {} },
  { provide: NavController, useValue: mockNavController },
  { provide: Router, useValue: mockRouter },
  { provide: ModalController, useValue: mockModalController },
  { provide: ToastController, useValue: mockToastController },
  { provide: AlertController, useValue: mockAlertController },
  { provide: ActionSheetController, useValue: mockActionSheetController }
];

