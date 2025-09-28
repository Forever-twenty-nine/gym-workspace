import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Rol } from '../../core/enums/rol.enum';
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
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

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
      await this.authService.login(this.email, this.password);
      const user = this.userService.getCurrentUser();
      if (!user) {
        this.errorMessage = 'Email o contraseña incorrectos';
      }
      // La redirección la maneja el AuthService
    } catch (error) {
      this.errorMessage = 'Error al iniciar sesión';
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const success = await this.authService.loginWithGoogle();
      if (!success) {
        this.errorMessage = 'Error al autenticar con Google';
      }
      // La redirección la maneja el AuthService
    } catch (error: any) {
      this.errorMessage = error?.message || 'Ocurrió un error inesperado';
      console.error('Google login error:', error);
    }
  }
}
