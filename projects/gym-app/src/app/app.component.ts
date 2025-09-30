import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AppConfigurationService } from './core/services/app-configuration.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private appConfig = inject(AppConfigurationService);

  constructor() {}

  async ngOnInit() {
    try {
      await this.appConfig.initialize();
      console.log('✅ App inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando app:', error);
    }
  }
}
