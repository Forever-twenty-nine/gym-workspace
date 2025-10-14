import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  lockClosedOutline,
  mailOutline,
  checkmarkCircleOutline,
  arrowBackOutline
} from 'ionicons/icons';
import { AuthService, UserService, Rol } from 'gym-library';

@Component({
  selector: 'app-register',
  templateUrl: 'register.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonIcon,
    ReactiveFormsModule
  ]
})
export class RegisterPage {
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitDisabled: boolean = true;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) {
    addIcons({
      lockClosedOutline,
      mailOutline,
      checkmarkCircleOutline,
      arrowBackOutline
    });

    // Crear el formulario reactivo
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Suscribirse a cambios del formulario para actualizar el estado del botón
    this.registerForm.statusChanges.subscribe(() => {
      this.updateSubmitButtonState();
    });

    this.registerForm.valueChanges.subscribe(() => {
      this.updateSubmitButtonState();
    });

    // Inicializar el estado del botón
    this.updateSubmitButtonState();
  }

  /**
   * Actualiza el estado del botón de envío
   */
  private updateSubmitButtonState(): void {
    this.isSubmitDisabled = !this.registerForm.valid || !!this.successMessage;
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
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

  /**
   * Getter para acceder fácilmente a los controles del formulario
   */
  get f() {
    return this.registerForm.controls;
  }

  /**
   * Verifica si un campo específico es válido y ha sido tocado o tiene contenido
   */
  isFieldValid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.valid && (field.touched || field.value));
  }

  /**
   * Verifica si un campo específico es inválido y ha sido tocado o tiene contenido
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.value));
  }

  /**
   * Valida el formulario de registro
   */
  validateForm(): boolean {
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      if (this.f['email'].errors) {
        if (this.f['email'].errors['required']) {
          this.errorMessage = 'El email es requerido';
        } else if (this.f['email'].errors['email']) {
          this.errorMessage = 'Por favor, ingresa un email válido';
        }
      } else if (this.f['password'].errors) {
        if (this.f['password'].errors['required']) {
          this.errorMessage = 'La contraseña es requerida';
        } else if (this.f['password'].errors['minlength']) {
          this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        }
      } else if (this.f['confirmPassword'].errors) {
        if (this.f['confirmPassword'].errors['required']) {
          this.errorMessage = 'La confirmación de contraseña es requerida';
        } else if (this.f['confirmPassword'].errors['passwordMismatch']) {
          this.errorMessage = 'Las contraseñas no coinciden';
        }
      }
      return false;
    }

    return true;
  }

  /**
   * Valida formato de email (ya no es necesario, Validators.email lo maneja)
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Genera un username automáticamente basado en el email
   */
  generateUsername(email: string): string {
    // Extraer la parte antes del @ y limpiarla
    const username = email.split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, '') // Remover caracteres especiales
      .toLowerCase();

    // Agregar timestamp para evitar duplicados
    const timestamp = Date.now().toString().slice(-4);
    return `${username}${timestamp}`;
  }

  /**
   * Registra un nuevo usuario
   */
  async register() {
    if (this.registerForm.invalid) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitDisabled = true;

    try {
      const { email, password } = this.registerForm.value;

      // Crear cuenta en Firebase Auth
      const result = await this.authService.registerWithEmail(email, password);
      
      if (result) {
        // Registro exitoso
        // Crear perfil de usuario en Firestore
        const userData = {
          nombre: '', // Se completará en onboarding
          email: email,
          emailVerified: false,
          role: Rol.ENTRENADO, // Por defecto, puede cambiarse después
          fechaCreacion: new Date(),
          activo: true
        };

        // Usar el UID del usuario actual (después del registro exitoso)
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          await this.userService.updateUser(currentUser.uid, userData);
        }

        this.successMessage = 'Cuenta creada exitosamente. Redirigiendo...';

        // Pequeño delay para mostrar el mensaje de éxito
        setTimeout(() => {
          this.router.navigate(['/onboarding']);
        }, 1500);
      } else {
        // Registro fallido - obtener el error específico del servicio
        const authError = this.authService.error();
        if (authError) {
          // Mejorar el mensaje de error para email ya registrado
          if (authError.includes('email-already-in-use') || authError.includes('ya está registrado')) {
            this.errorMessage = 'Este email ya está registrado. Intenta iniciar sesión en su lugar.';
          } else if (authError.includes('weak-password')) {
            this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          } else if (authError.includes('invalid-email')) {
            this.errorMessage = 'El email no tiene un formato válido.';
          } else if (authError.includes('network-request-failed')) {
            this.errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
          } else {
            this.errorMessage = authError;
          }
        } else {
          this.errorMessage = 'Error al crear la cuenta. Inténtalo de nuevo.';
        }
        
        this.isSubmitDisabled = false;
      }

    } catch (error: any) {
      console.error('Error inesperado al registrar usuario:', error);
      this.errorMessage = 'Error inesperado. Inténtalo de nuevo.';
      this.isSubmitDisabled = false;
    }
  }

  /**
   * Navega de vuelta al login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Navega de vuelta a la página de bienvenida
   */
  goToWelcome() {
    this.router.navigate(['/welcome']);
  }

  /**
   * Navega directamente al onboarding (solo para testing)
   */
  goToOnboarding() {
    this.router.navigate(['/onboarding']);
  }
}
