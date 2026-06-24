import { Component, inject, OnInit, computed, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonCheckbox,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  NavController, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, arrowBackOutline } from 'ionicons/icons';
import { Rol } from 'gym-library';
import { AuthService } from '../../core/services/auth.service';
import { StorageService } from '../../core/services/storage.service';
import { AuthBackgroundComponent } from '../../shared/components/auth-background/auth-background.component';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  standalone: true,
  imports: [IonText, 
    IonHeader,
    IonToolbar,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    IonCheckbox,
    ReactiveFormsModule,
    AuthBackgroundComponent
  ]
})
export class LoginPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly storageService = inject(StorageService);
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly formBuilder = inject(FormBuilder);

  readonly loginForm: FormGroup;
  private formStatus!: Signal<string | undefined>;

  readonly isSubmitDisabled = computed(() => {
    const status = this.formStatus ? this.formStatus() : 'INVALID';
    return status === 'INVALID' || this.authService.isLoading();
  });

  constructor() {
    addIcons({ arrowBackOutline, personOutline, lockClosedOutline });

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });

    this.formStatus = toSignal(this.loginForm.statusChanges, {
      initialValue: this.loginForm.status
    });
  }

  get emailError(): string {
    const control = this.loginForm.get('email');
    if (control?.hasError('required')) return 'El email es requerido';
    if (control?.hasError('email')) return 'Formato de email inválido';
    return 'Dato inválido';
  }

  get passwordError(): string {
    const control = this.loginForm.get('password');
    if (control?.hasError('required')) return 'La contraseña es requerida';
    return 'Dato inválido';
  }

  async ngOnInit() {
    const saved = await this.storageService.get('remembered_credentials') as any;
    if (saved) {
      this.loginForm.patchValue({
        email: saved.email,
        password: saved.password,
        rememberMe: true
      });
    }
  }

  goToWelcome() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    this.navCtrl.navigateBack('/welcome');
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  async login() {
    if (this.loginForm.invalid) return;

    try {
      const { email, password, rememberMe } = this.loginForm.value;
      const success = await this.authService.loginWithEmail(email, password);
      
      if (success) {
        if (rememberMe) {
          await this.storageService.set('remembered_credentials', { email, password });
        } else {
          await this.storageService.remove('remembered_credentials');
        }

        const user = this.authService.currentUser();
        if (user) {
          this.redirectToRolePage(user);
        }
      }
    } catch (error) {
      console.error('Error al iniciar sesión', error);
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const success = await this.authService.loginWithGoogle();
      if (success) {
        const user = this.authService.currentUser();
        if (user) {
          this.redirectToRolePage(user);
        }
      }
    } catch (error: any) {
      console.error('Google login error:', error);
    }
  }

  private redirectToRolePage(user: any): void {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (!user.onboarded) {
      this.navCtrl.navigateRoot('/onboarding');
      return;
    }

    switch (user.role) {
      case Rol.ENTRENADO:
        this.navCtrl.navigateRoot('/entrenado-tabs');
        break;
      case Rol.ENTRENADOR:
      case Rol.PERSONAL_TRAINER:
        this.navCtrl.navigateRoot('/entrenador-tabs');
        break;
      case Rol.GIMNASIO:
        this.navCtrl.navigateRoot('/gimnasio-tabs');
        break;
      default:
        this.navCtrl.navigateRoot('/onboarding');
    }
  }
}
