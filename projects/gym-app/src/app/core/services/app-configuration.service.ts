import { Injectable, inject } from '@angular/core';
import { 
  EntrenadoService, 
  RutinaService,
  EjercicioService,
  AuthService, 
  StorageService,
  UserService,
  NotificacionService
} from 'gym-library';
import { EntrenadoFirestoreAdapter } from '../adapters/entrenado-firestore.adapter';
import { RutinaFirestoreAdapter } from '../adapters/rutina-firestore.adapter';
import { EjercicioFirestoreAdapter } from '../adapters/ejercicio-firestore.adapter';
import { FirebaseAuthAdapter } from '../adapters/firebase-auth.adapter';
import { IonicStorageAdapter } from '../adapters/ionic-storage.adapter';
import { UserFirestoreAdapter } from '../adapters/user-firestore.adapter';
import { NotificacionFirestoreAdapter } from '../adapters/notificacion-firestore.adapter';

@Injectable({
  providedIn: 'root'
})
export class AppConfigurationService {
  private entrenadoService = inject(EntrenadoService);
  private rutinaService = inject(RutinaService);
  private ejercicioService = inject(EjercicioService);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private userService = inject(UserService);
  private notificacionService = inject(NotificacionService);

  private entrenadoAdapter = inject(EntrenadoFirestoreAdapter);
  private rutinaAdapter = inject(RutinaFirestoreAdapter);
  private ejercicioAdapter = inject(EjercicioFirestoreAdapter);
  private authAdapter = inject(FirebaseAuthAdapter);
  private storageAdapter = inject(IonicStorageAdapter);
  private userAdapter = inject(UserFirestoreAdapter);
  private notificacionAdapter = inject(NotificacionFirestoreAdapter);

  private dataServicesConfigured = false;

  async initialize(): Promise<void> {
    try {
      // Solo configurar auth inicialmente para evitar conexiones a Firestore sin autenticación
      this.authService.setAuthAdapter(this.authAdapter);
      
      // Verificar el usuario actual
      await this.authService.refreshAuth();
      
      // Si hay usuario autenticado, configurar los servicios de datos
      if (this.authService.currentUser()) {
        await this.configureDataServices();
      }
      
      this.storageService.setStorageAdapter(this.storageAdapter);
    } catch (error) {
      console.error('❌ Error configurando adaptadores:', error);
      throw error;
    }
  }

  /**
   * Configura los servicios de datos después de la autenticación
   */
  async configureDataServices(): Promise<void> {
    if (this.dataServicesConfigured) return;
    
    try {
      this.entrenadoService.setFirestoreAdapter(this.entrenadoAdapter);
      this.rutinaService.setFirestoreAdapter(this.rutinaAdapter);
      this.ejercicioService.setFirestoreAdapter(this.ejercicioAdapter);
      this.userService.setFirestoreAdapter(this.userAdapter);
      this.notificacionService.setFirestoreAdapter(this.notificacionAdapter);
      this.dataServicesConfigured = true;
      console.log('✅ Servicios de datos configurados');
    } catch (error) {
      console.error('❌ Error configurando servicios de datos:', error);
      throw error;
    }
  }

  /**
   * Verifica si los servicios de datos ya están configurados
   */
  areDataServicesConfigured(): boolean {
    return this.dataServicesConfigured;
  }
}