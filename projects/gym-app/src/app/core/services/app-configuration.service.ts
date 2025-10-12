import { Injectable, inject } from '@angular/core';
import { 
  EntrenadoService, 
  RutinaService,
  EjercicioService,
  AuthService, 
  StorageService,
  UserService
} from 'gym-library';
import { EntrenadoFirestoreAdapter } from '../adapters/entrenado-firestore.adapter';
import { RutinaFirestoreAdapter } from '../adapters/rutina-firestore.adapter';
import { EjercicioFirestoreAdapter } from '../adapters/ejercicio-firestore.adapter';
import { FirebaseAuthAdapter } from '../adapters/firebase-auth.adapter';
import { IonicStorageAdapter } from '../adapters/ionic-storage.adapter';
import { UserFirestoreAdapter } from '../adapters/user-firestore.adapter';

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

  private entrenadoAdapter = inject(EntrenadoFirestoreAdapter);
  private rutinaAdapter = inject(RutinaFirestoreAdapter);
  private ejercicioAdapter = inject(EjercicioFirestoreAdapter);
  private authAdapter = inject(FirebaseAuthAdapter);
  private storageAdapter = inject(IonicStorageAdapter);
  private userAdapter = inject(UserFirestoreAdapter);

  async initialize(): Promise<void> {
    try {
      // Configurar adaptadores (sin llamar a checkCurrentUser automáticamente)
      this.entrenadoService.setFirestoreAdapter(this.entrenadoAdapter);
      this.rutinaService.setFirestoreAdapter(this.rutinaAdapter);
      this.ejercicioService.setFirestoreAdapter(this.ejercicioAdapter);
      this.userService.setFirestoreAdapter(this.userAdapter);
      
      // Para auth, configurar el adaptador sin verificar usuario todavía
      // (evita llamadas a Firebase fuera del contexto de inyección)
      this.authService.setAuthAdapter(this.authAdapter);
      
      // Ahora sí verificar el usuario actual de forma explícita
      await this.authService.refreshAuth();
      
      this.storageService.setStorageAdapter(this.storageAdapter);
    } catch (error) {
      console.error('❌ Error configurando adaptadores:', error);
      throw error;
    }
  }
}