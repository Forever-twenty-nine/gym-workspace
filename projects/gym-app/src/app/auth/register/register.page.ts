import { Component, computed, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonInput, IonButton, IonText, IonIcon, IonHeader, IonToolbar, IonButtons, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  lockClosedOutline,
  mailOutline,
  checkmarkCircleOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { AuthBackgroundComponent } from '../../shared/components/auth-background/auth-background.component';

@Component({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  standalone: true,
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButtons, IonToolbar,
    IonContent,
    IonInput,
    IonButton,
    IonText,
    IonIcon,
    ReactiveFormsModule,
    AuthBackgroundComponent,
    IonHeader]
})
export class RegisterPage {
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly registerForm: FormGroup;
  private formStatus!: Signal<string | undefined>;

  readonly isSubmitDisabled = computed(() => {
    const status = this.formStatus ? this.formStatus() : 'INVALID';
    return status === 'INVALID' || this.authService.isLoading();
  });

  constructor() {
    addIcons({
      lockClosedOutline,
      mailOutline,
      checkmarkCircleOutline,
      arrowBackOutline
    });

    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    this.formStatus = toSignal(this.registerForm.statusChanges, {
      initialValue: this.registerForm.status
    });
  }

  get emailError(): string {
    const control = this.registerForm.get('email');
    if (control?.hasError('required')) return 'El email es requerido';
    if (control?.hasError('email')) return 'Formato de email inválido';
    return 'Dato inválido';
  }

  get passwordError(): string {
    const control = this.registerForm.get('password');
    if (control?.hasError('required')) return 'La contraseña es requerida';
    if (control?.hasError('minlength')) return 'Debe tener al menos 6 caracteres';
    return 'Dato inválido';
  }

  get confirmPasswordError(): string {
    const control = this.registerForm.get('confirmPassword');
    if (control?.hasError('required')) return 'Debes confirmar la contraseña';
    if (this.registerForm.hasError('passwordMismatch')) return 'Las contraseñas no coinciden';
    return 'Dato inválido';
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value && confirmPassword.value) {
      if (password.value !== confirmPassword.value) {
        return { passwordMismatch: true };
      }
    }
    return null;
  }

  get f() { return this.registerForm.controls; }

  isFieldValid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.valid && (field.touched || field.value));
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.value));
  }

  async register() {
    if (this.registerForm.invalid) return;

    try {
      const { email, password } = this.registerForm.value;
      const result = await this.authService.registerWithEmail(email, password);

      if (result) {
        const user = this.authService.currentUser();
        if (user && user.onboarded) {
          this.redirectToRolePage(user);
        } else {
          this.router.navigate(['/onboarding']);
        }
      }
    } catch (error: any) {
      console.error('Error inesperado al registrar usuario:', error);
    }
  }

  async loginWithGoogle() {
    try {
      const success = await this.authService.loginWithGoogle();
      if (success) {
        const user = this.authService.currentUser();
        if (user && user.onboarded) {
          this.redirectToRolePage(user);
        } else {
          this.router.navigate(['/onboarding']);
        }
      }
    } catch (error: any) {
      console.error('Error in Google login:', error);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToWelcome() {
    this.router.navigate(['/welcome']);
  }

  private redirectToRolePage(user: any): void {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (!user.onboarded) {
      this.router.navigate(['/onboarding']);
      return;
    }

    switch (user.role) {
      case 'ENTRENADO':
        this.router.navigate(['/entrenado-tabs']);
        break;
      case 'ENTRENADOR':
      case 'PERSONAL_TRAINER':
        this.router.navigate(['/entrenador-tabs']);
        break;
      case 'GIMNASIO':
        this.router.navigate(['/gimnasio-tabs']);
        break;
      default:
        this.router.navigate(['/onboarding']);
    }
  }
}
