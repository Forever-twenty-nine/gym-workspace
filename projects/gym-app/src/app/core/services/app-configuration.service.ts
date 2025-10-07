import { Injectable, inject } from '@angular/core';
import { 
  ClienteService, 
  RutinaService, 
  AuthService, 
  StorageService 
} from 'gym-library';
import { ClienteFirestoreAdapter } from '../adapters/cliente-firestore.adapter';
import { RutinaFirestoreAdapter } from '../adapters/rutina-firestore.adapter';
import { FirebaseAuthAdapter } from '../adapters/firebase-auth.adapter';
import { IonicStorageAdapter } from '../adapters/ionic-storage.adapter';

@Injectable({
  providedIn: 'root'
})
export class AppConfigurationService {
  private clienteService = inject(ClienteService);
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);

  private clienteAdapter = inject(ClienteFirestoreAdapter);
  private rutinaAdapter = inject(RutinaFirestoreAdapter);
  private authAdapter = inject(FirebaseAuthAdapter);
  private storageAdapter = inject(IonicStorageAdapter);

  async initialize(): Promise<void> {
    try {
      // Configurar adaptadores
      this.clienteService.setFirestoreAdapter(this.clienteAdapter);
      this.rutinaService.setFirestoreAdapter(this.rutinaAdapter);
      this.authService.setAuthAdapter(this.authAdapter);
      this.storageService.setStorageAdapter(this.storageAdapter);
    } catch (error) {
      console.error('❌ Error configurando adaptadores:', error);
      throw error;
    }
  }
}