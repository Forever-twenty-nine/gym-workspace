import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButton,
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
    CommonModule,
    IonContent,
    IonButton,
  ]
})
export class WelcomePage {

  constructor(private router: Router) {
    addIcons({fitnessOutline,personAddOutline,arrowForwardOutline,logInOutline});
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
