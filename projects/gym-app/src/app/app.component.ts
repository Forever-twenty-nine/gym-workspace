import { Component, inject, OnInit, effect, Injector } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AppConfigurationService } from './core/services/app-configuration.service';
import { AuthService } from './core/services/auth.service';
import { ProfileComponent } from './shared/components/header-tabs/components/profile/profile.component';
import { NotificationsComponent } from './shared/components/header-tabs/components/notifications/notifications.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, ProfileComponent, NotificationsComponent],
})
export class AppComponent implements OnInit {
  private appConfig = inject(AppConfigurationService);
  public authService = inject(AuthService);
  private injector = inject(Injector);

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

    } catch (error) {
      console.error('❌ Error inicializando app:', error);
    }
  }
}
