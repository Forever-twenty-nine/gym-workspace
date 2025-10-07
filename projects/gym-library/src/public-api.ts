/** 
 * enums
 */
export * from './lib/enums/objetivo.enum';
export * from './lib/enums/permiso.enum';
export * from './lib/enums/rol.enum';
export * from './lib/enums/gimnasio-tabs.enum';
export * from './lib/enums/entrenado-tabs.enum';
export * from './lib/enums/tipo-notificacion.enum';
export * from './lib/enums/tipo-mensaje.enum';
/*
 * modelos
 */
export * from './lib/models/user.model';
export * from './lib/models/entrenado.model';
export * from './lib/models/entrenador.model';
export * from './lib/models/gimnasio.model';
export * from './lib/models/ejercicio.model';
export * from './lib/models/rutina.model';
export * from './lib/models/invitacion.model';
export * from './lib/models/notificacion.model';
export * from './lib/models/mensaje.model';
export * from './lib/models/conversacion.model';
export * from './lib/models/environment.model';
/*
 * environments
 */
export * from './lib/environments/environment';
export * from './lib/environments/environment.prod';
/*
 * servicios centralizados
 */
export * from './lib/services/entrenado.service';
export * from './lib/services/user.service';
export * from './lib/services/rutina.service';
export * from './lib/services/ejercicio.service';
export * from './lib/services/entrenador.service';
export * from './lib/services/gimnasio.service';
export * from './lib/services/auth.service';
export * from './lib/services/storage.service';
export * from './lib/services/notificacion.service';
export * from './lib/services/mensaje.service';
export * from './lib/services/conversacion.service';
export * from './lib/services/invitacion.service';
/*
 * interfaces para adaptadores
 */
export type { IEntrenadoFirestoreAdapter } from './lib/services/entrenado.service';
export type { IUserFirestoreAdapter } from './lib/services/user.service';
export type { IRutinaFirestoreAdapter } from './lib/services/rutina.service';
export type { IEjercicioFirestoreAdapter } from './lib/services/ejercicio.service';
export type { IEntrenadorFirestoreAdapter } from './lib/services/entrenador.service';
export { ENTRENADOR_FIRESTORE_ADAPTER } from './lib/services/entrenador.service';
export type { IGimnasioFirestoreAdapter } from './lib/services/gimnasio.service';
export { GIMNASIO_FIRESTORE_ADAPTER } from './lib/services/gimnasio.service';
export type { IAuthAdapter } from './lib/services/auth.service';
export type { IStorageAdapter } from './lib/services/storage.service';
export type { INotificacionFirestoreAdapter } from './lib/services/notificacion.service';
export type { IMensajeFirestoreAdapter } from './lib/services/mensaje.service';
export type { IConversacionFirestoreAdapter } from './lib/services/conversacion.service';
export type { IInvitacionFirestoreAdapter } from './lib/services/invitacion.service';

export * from './lib/gym-library';
