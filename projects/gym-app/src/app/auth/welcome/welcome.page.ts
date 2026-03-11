import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personAddOutline,
  logInOutline,
  fitnessOutline,
  arrowForwardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-welcome',
  templateUrl: 'welcome.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonButton
]
})
export class WelcomePage {
  private navCtrl = inject(NavController);

  constructor(private router: Router) {
    addIcons({fitnessOutline,personAddOutline,arrowForwardOutline,logInOutline});
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
