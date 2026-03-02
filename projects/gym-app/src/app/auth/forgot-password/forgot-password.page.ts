import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, arrowBackOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: 'forgot-password.page.html',
  styleUrls: ['forgot-password.page.css'],
  standalone: true,
  imports: [
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    FormsModule
  ]
})
export class ForgotPasswordPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly emailError = signal('');
  readonly successMessage = signal('');
  readonly isLoading = signal(false);

  constructor() {
    addIcons({ arrowBackOutline, mailOutline });
  }

  /**
   * Navega de vuelta a la página de login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Valida el formato del email
   */
  validateEmail() {
    this.emailError.set('');
    this.successMessage.set('');

    if (this.email() && !this.isValidEmail(this.email())) {
      this.emailError.set('Por favor, ingresa un email válido');
    }
  }

  /**
   * Verifica si el email tiene un formato válido
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Verifica si el email es válido y no está vacío
   */
  isEmailValid(): boolean {
    return this.email().length > 0 && this.isValidEmail(this.email()) && !this.emailError();
  }

  /**
   * Verifica si el email es inválido
   */
  isEmailInvalid(): boolean {
    return this.email().length > 0 && (!this.isValidEmail(this.email()) || !!this.emailError());
  }

  /**
   * Envía el enlace de recuperación de contraseña
   */
  async resetPassword() {
    //solo de mock
    this.successMessage.set('Se ha enviado un enlace de recuperación a tu email');
  }
}
