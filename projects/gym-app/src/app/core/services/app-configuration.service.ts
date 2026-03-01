import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppConfigurationService {
  private authService = inject(AuthService);
  private dataServicesConfigured = false;

  async initialize(): Promise<void> {
    try {
      // Verificar el usuario actual
      await this.authService.refreshAuth();

      // Si hay usuario autenticado, configurar los servicios de datos
      if (this.authService.currentUser()) {
        await this.configureDataServices();
      }
    } catch (error) {
      console.error('❌ Error configurando la aplicación:', error);
      throw error;
    }
  }

  /**
   * Configura los servicios de datos después de la autenticación
   * En la arquitectura simplificada, esto asegura que el estado inicial se cargue
   */
  async configureDataServices(): Promise<void> {
    if (this.dataServicesConfigured) return;

    try {
      // Los servicios ahora manejan su propia inicialización lazy o directa
      this.dataServicesConfigured = true;
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
