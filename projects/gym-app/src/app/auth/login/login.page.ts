import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, arrowBackOutline } from 'ionicons/icons';
import { Rol } from 'gym-library';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    FormsModule
  ]
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly errorMessage = signal('');

  constructor() {
    addIcons({ arrowBackOutline, personOutline, lockClosedOutline });
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  goToWelcome() {
    this.router.navigate(['/welcome']);
  }

  async login() {
    this.errorMessage.set('');
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Por favor, ingresa email y contraseña');
      return;
    }
    try {
      const success = await this.authService.loginWithEmail(this.email(), this.password());
      if (success) {
        const user = this.authService.currentUser();
        if (user) {
          this.redirectToRolePage(user.role);
        }
      } else {
        this.errorMessage.set('Email o contraseña incorrectos');
      }
    } catch (error) {
      this.errorMessage.set('Error al iniciar sesión');
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const success = await this.authService.loginWithGoogle();
      if (success) {
        const user = this.authService.currentUser();
        if (user) {
          this.redirectToRolePage(user.role);
        }
      } else {
        this.errorMessage.set('Error al autenticar con Google');
      }
    } catch (error: any) {
      this.errorMessage.set(error?.message || 'Ocurrió un error inesperado');
      console.error('Google login error:', error);
    }
  }

  /**
   * Redirige al usuario según su rol
   */
  private redirectToRolePage(role?: string): void {
    switch (role) {
      case Rol.ENTRENADO:
        this.router.navigate(['/entrenado-tabs']);
        break;
      case Rol.ENTRENADOR:
      case Rol.PERSONAL_TRAINER:
        this.router.navigate(['/entrenador-tabs']);
        break;
      case Rol.GIMNASIO:
        this.router.navigate(['/gimnasio-tabs']);
        break;
      default:
        // Si no tiene rol definido, enviar a onboarding
        this.router.navigate(['/onboarding']);
    }
  }
}
