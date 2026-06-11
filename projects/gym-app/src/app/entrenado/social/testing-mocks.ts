import { signal } from '@angular/core';
import { Rol, TipoMensaje, Plan, Convocatoria, Desafio, DesafioParticipacion, SesionRutina } from 'gym-library';
import { TarjetaDescubrir } from '../../core/types/descubrir.types';

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
    entrenadoId: 'user-partner',
    nombreUsuario: 'Juan Pérez',
    fotoUsuario: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    fechaInicio: new Date(Date.now() - 3600000 * 4),
    duracion: 3600,
    completada: true,
    likes: ['user-current'],
    fechaCompartida: new Date(Date.now() - 3600000 * 4),
    fotoProgreso: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600',
    rutinaResumen: {
      id: 'rut-1',
      nombre: 'Hipertrofia de Pecho',
      ejercicios: [
        { id: 'ej-1', nombre: 'Press de Banca', series: 4, repeticiones: 12 },
        { id: 'ej-2', nombre: 'Aperturas con Mancuernas', series: 4, repeticiones: 12 },
        { id: 'ej-3', nombre: 'Fondos de Pecho', series: 3, repeticiones: 15 }
      ]
    }
  },
  {
    id: 'sesion-2',
    entrenadoId: 'user-3',
    nombreUsuario: 'María Gómez',
    fotoUsuario: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    fechaInicio: new Date(Date.now() - 3600000 * 20),
    duracion: 1200,
    completada: true,
    likes: ['user-partner', 'user-current'],
    fechaCompartida: new Date(Date.now() - 3600000 * 20),
    fotoProgreso: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=600',
    rutinaResumen: {
      id: 'rut-2',
      nombre: 'Cardio HIIT 20m',
      ejercicios: [
        { id: 'ej-4', nombre: 'Burpees', series: 3, repeticiones: 10 },
        { id: 'ej-5', nombre: 'Jump squats', series: 3, repeticiones: 15 }
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
import { ModalController, ToastController, AlertController, ActionSheetController } from '@ionic/angular/standalone';

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
  { provide: ModalController, useValue: mockModalController },
  { provide: ToastController, useValue: mockToastController },
  { provide: AlertController, useValue: mockAlertController },
  { provide: ActionSheetController, useValue: mockActionSheetController }
];
