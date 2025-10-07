import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, arrowBackOutline } from 'ionicons/icons';
import { AuthService, UserService, Rol } from 'gym-library';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    FormsModule
  ]
})
export class LoginPage {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) {
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
    this.errorMessage = '';
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, ingresa email y contraseña';
      return;
    }
    try {
      const success = await this.authService.loginWithEmail(this.email, this.password);
      if (success) {
        const user = this.authService.currentUser();
        if (user) {
          this.redirectToRolePage(user.role);
        }
      } else {
        this.errorMessage = 'Email o contraseña incorrectos';
      }
    } catch (error) {
      this.errorMessage = 'Error al iniciar sesión';
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
        this.errorMessage = 'Error al autenticar con Google';
      }
    } catch (error: any) {
      this.errorMessage = error?.message || 'Ocurrió un error inesperado';
      console.error('Google login error:', error);
    }
  }

  /**
   * Redirige al usuario según su rol
   */
  private redirectToRolePage(role?: string): void {
    switch (role) {
      case Rol.CLIENTE:
        this.router.navigate(['/cliente-tabs']);
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
