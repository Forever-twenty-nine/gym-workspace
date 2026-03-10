import { Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonCheckbox
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, arrowBackOutline } from 'ionicons/icons';
import { Rol } from 'gym-library';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    IonCheckbox,
    FormsModule
  ]
})
export class LoginPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly storageService = inject(StorageService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly rememberMe = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    addIcons({ arrowBackOutline, personOutline, lockClosedOutline });
  }

  async ngOnInit() {
    const saved = await this.storageService.get('remembered_credentials') as any;
    if (saved) {
      this.email.set(saved.email);
      this.password.set(saved.password);
      this.rememberMe.set(true);
    }
  }

  toggleRememberMe(checked: boolean) {
    this.rememberMe.set(checked);
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
        if (this.rememberMe()) {
          await this.storageService.set('remembered_credentials', {
            email: this.email(),
            password: this.password()
          });
        } else {
          await this.storageService.remove('remembered_credentials');
        }

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
        const error = this.authService.error();
        this.errorMessage.set(error || 'Error al autenticar con Google');
      }
    } catch (error: any) {
      this.errorMessage.set(error?.message || 'Error inesperado');
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
