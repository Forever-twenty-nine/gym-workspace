/** 
 * enums
 */
export * from './lib/enums/objetivo.enum';
export * from './lib/enums/permiso.enum';
export * from './lib/enums/rol.enum';
export * from './lib/enums/gimnasio-tabs.enum';
export * from './lib/enums/cliente-tabs.enum';
/*
 * modelos
 */
export * from './lib/models/user.model';
export * from './lib/models/cliente.model';
export * from './lib/models/entrenador.model';
export * from './lib/models/ejercicio.model';
export * from './lib/models/rutina.model';
export * from './lib/models/invitacion.model';
export * from './lib/models/environment.model';
/*
 * environments
 */
export * from './lib/environments/environment';
export * from './lib/environments/environment.prod';
/*
 * servicios centralizados
 */
export * from './lib/services/cliente.service';
export * from './lib/services/user.service';
export * from './lib/services/rutina.service';
export * from './lib/services/ejercicio.service';
export * from './lib/services/auth.service';
export * from './lib/services/storage.service';
/*
 * interfaces para adaptadores
 */
export type { IClienteFirestoreAdapter } from './lib/services/cliente.service';
export type { IUserFirestoreAdapter } from './lib/services/user.service';
export type { IRutinaFirestoreAdapter } from './lib/services/rutina.service';
export type { IEjercicioFirestoreAdapter } from './lib/services/ejercicio.service';
export type { IAuthAdapter } from './lib/services/auth.service';
export type { IStorageAdapter } from './lib/services/storage.service';

export * from './lib/gym-library';
