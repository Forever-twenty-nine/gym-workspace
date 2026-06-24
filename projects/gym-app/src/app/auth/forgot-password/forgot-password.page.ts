import { Component, inject, computed, Signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, arrowBackOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { AuthBackgroundComponent } from '../../shared/components/auth-background/auth-background.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: 'forgot-password.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    ReactiveFormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    AuthBackgroundComponent,
    IonCardContent,
    IonHeader,
    IonToolbar,
    IonButtons
]
})
export class ForgotPasswordPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly forgotForm: FormGroup;
  private formStatus!: Signal<string | undefined>;

  readonly isSubmitDisabled = computed(() => {
    const status = this.formStatus ? this.formStatus() : 'INVALID';
    return status === 'INVALID' || this.authService.isLoading();
  });

  constructor() {
    addIcons({ arrowBackOutline, mailOutline });

    this.forgotForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.formStatus = toSignal(this.forgotForm.statusChanges, {
      initialValue: this.forgotForm.status
    });
  }

  get emailError(): string {
    const control = this.forgotForm.get('email');
    if (control?.hasError('required')) return 'El email es requerido';
    if (control?.hasError('email')) return 'Formato de email inválido';
    return 'Dato inválido';
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  async resetPassword() {
    if (this.forgotForm.invalid) return;

    const { email } = this.forgotForm.value;
    
    // AuthService will show the success or error toast automatically
    const success = await this.authService.sendPasswordResetEmail(email);
    if (success) {
      setTimeout(() => {
        this.goToLogin();
      }, 2000);
    }
  }
}
