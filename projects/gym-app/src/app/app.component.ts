import { Component, inject, OnInit, effect, Injector } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AppConfigurationService } from './core/services/app-configuration.service';
import { AuthService } from './core/services/auth.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { checkAndFixHiddenFocus } from './core/utils/modal.utils';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private appConfig = inject(AppConfigurationService);
  public authService = inject(AuthService);
  private injector = inject(Injector);
  private router = inject(Router);

  constructor() { }

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

      // Escuchar cambios de ruta para corregir posibles elementos enfocados dentro de páginas inactivas/ocultas
      this.router.events.pipe(
        filter(event => event instanceof NavigationEnd)
      ).subscribe(() => {
        checkAndFixHiddenFocus();
        // Verificar también después de breves delays para esperar animaciones y cierre de modales de Ionic
        setTimeout(() => checkAndFixHiddenFocus(), 150);
        setTimeout(() => checkAndFixHiddenFocus(), 300);
      });

    } catch (error) {
      console.error('❌ Error inicializando app:', error);
    }
  }
}

