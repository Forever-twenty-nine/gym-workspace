import { Component, inject, OnInit, effect, Injector } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AppConfigurationService } from './core/services/app-configuration.service';
import { AuthService } from 'gym-library';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private appConfig = inject(AppConfigurationService);
  private authService = inject(AuthService);
  private injector = inject(Injector);

  constructor() {}

  async ngOnInit() {
    try {
      await this.appConfig.initialize();
      
      // Si ya hay usuario autenticado, configurar servicios inmediatamente
      if (this.authService.currentUser()) {
        await this.appConfig.configureDataServices();
      }
      
      // Configurar servicios de datos cuando el usuario se autentique
      effect(() => {
        const user = this.authService.currentUser();
        if (user && !this.appConfig.areDataServicesConfigured()) {
          this.appConfig.configureDataServices();
        }
      }, { injector: this.injector });
      
    } catch (error) {
      console.error('❌ Error inicializando app:', error);
    }
  }
}
