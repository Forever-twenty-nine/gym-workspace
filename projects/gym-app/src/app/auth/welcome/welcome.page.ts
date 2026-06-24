import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personAddOutline,
  logInOutline,
  fitnessOutline,
  arrowForwardOutline
} from 'ionicons/icons';
import { AuthBackgroundComponent } from '../../shared/components/auth-background/auth-background.component';

@Component({
  selector: 'app-welcome',
  templateUrl: 'welcome.page.html',
  standalone: true,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonContent,
    IonButton,
    AuthBackgroundComponent
  ]
})
export class WelcomePage {
  private readonly navCtrl = inject(NavController);
  private readonly router = inject(Router);

  constructor() {
    addIcons({ fitnessOutline, personAddOutline, arrowForwardOutline, logInOutline });
  }

  goToRegister() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.navCtrl.navigateForward('/register');
  }

  goToLogin() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.navCtrl.navigateForward('/login');
  }
}
