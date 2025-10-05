import { Injectable, inject } from '@angular/core';
import { 
  ClienteService, 
  UserService, 
  RutinaService, 
  EjercicioService, 
  AuthService, 
  StorageService 
} from 'gym-library';
import { ClienteFirestoreAdapter } from '../../adapters/cliente-firestore.adapter';
import { RutinaFirestoreAdapter } from '../../adapters/rutina-firestore.adapter';
import { FirebaseAuthAdapter } from '../../adapters/firebase-auth.adapter';
import { IonicStorageAdapter } from '../../adapters/ionic-storage.adapter';

@Injectable({
  providedIn: 'root'
})
export class AppConfigurationService {
  private clienteService = inject(ClienteService);
  private userService = inject(UserService);
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);

  private clienteAdapter = inject(ClienteFirestoreAdapter);
  private rutinaAdapter = inject(RutinaFirestoreAdapter);
  private authAdapter = inject(FirebaseAuthAdapter);
  private storageAdapter = inject(IonicStorageAdapter);

  async initialize(): Promise<void> {
    console.log('🔧 Configurando adaptadores para gym-app...');

    try {
      // Configurar adaptadores
      this.clienteService.setFirestoreAdapter(this.clienteAdapter);
      this.rutinaService.setFirestoreAdapter(this.rutinaAdapter);
      this.authService.setAuthAdapter(this.authAdapter);
      this.storageService.setStorageAdapter(this.storageAdapter);

      console.log('✅ Adaptadores configurados correctamente');
    } catch (error) {
      console.error('❌ Error configurando adaptadores:', error);
      throw error;
    }
  }
}