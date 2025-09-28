import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonProgressBar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  peopleOutline,
  bookmarkOutline,
  checkmarkCircleOutline,
  arrowForwardOutline,
  fitnessOutline,
  rocketOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { Objetivo } from '../../core/enums/objetivo.enum';

// Configuración del onboarding
const ONBOARDING_CONFIG = {
  STEPS: {
    DATOS_PERSONALES: 1,
    OBJETIVO: 2
  },
  MAX_STEPS: {
    CLIENTE: 2,
    OTROS: 1
  }
} as const;

@Component({
  selector: 'app-onboarding',
  templateUrl: 'onboarding.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonProgressBar,
    FormsModule
  ]
})
export class OnboardingPage {
  // Signals para mejor reactividad
  currentStep = signal<number>(ONBOARDING_CONFIG.STEPS.DATOS_PERSONALES);
  totalSteps = signal<number>(ONBOARDING_CONFIG.MAX_STEPS.CLIENTE);
  
  formData = signal({
    nombre: '',
    role: 'cliente' as 'cliente' | 'entrenador' | 'gimnasio',
    objetivo: '' as keyof typeof Objetivo | ''
  });

  errorMessage = signal('');
  isLoading = signal(false);

  // Computed properties
  progress = computed(() => (this.currentStep() / this.totalSteps()) * 100);
  isClient = computed(() => this.formData().role === 'cliente');
  showStep2 = computed(() => this.currentStep() === ONBOARDING_CONFIG.STEPS.OBJETIVO && this.isClient());

  // Enum para el template
  objetivos = Objetivo;

  // Métodos helper para actualizar formData
  updateFormField<K extends keyof ReturnType<typeof this.formData>>(field: K, value: ReturnType<typeof this.formData>[K]) {
    this.formData.update(current => ({ ...current, [field]: value }));
  }

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({
      personOutline,
      peopleOutline,
      bookmarkOutline,
      checkmarkCircleOutline,
      arrowForwardOutline,
      fitnessOutline,
      rocketOutline
    });

    // Para testing: simular usuario autenticado si no hay uno
    this.initializeForTesting();
  }

  /**
   * Inicializa el componente para testing
   */
  async initializeForTesting() {
    // solo mock
    console.log('Inicializando Onboarding para testing');
  }

  /**
   * Avanza al siguiente paso
   */
  nextStep() {
    if (this.currentStep() === ONBOARDING_CONFIG.STEPS.DATOS_PERSONALES) {
      if (!this.validateStep1()) {
        return;
      }

      // Si no es cliente, completar onboarding directamente
      if (this.formData().role !== 'cliente') {
        this.totalSteps.set(ONBOARDING_CONFIG.MAX_STEPS.OTROS);
        this.completeOnboarding();
        return;
      }

      this.totalSteps.set(ONBOARDING_CONFIG.MAX_STEPS.CLIENTE);
      this.currentStep.set(ONBOARDING_CONFIG.STEPS.OBJETIVO);
    } else if (this.currentStep() === ONBOARDING_CONFIG.STEPS.OBJETIVO) {
      if (!this.validateStep2()) {
        return;
      }
      this.completeOnboarding();
    }
  }

  // Validaciones mejoradas
  private validationRules = {
    nombre: (value: string) => {
      if (!value.trim()) return 'Por favor, ingresa tu nombre completo';
      if (value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
      return null;
    },
    role: (value: string) => {
      if (!value) return 'Por favor, selecciona tu tipo de usuario';
      return null;
    },
    objetivo: (value: string, role: string) => {
      if (role === 'cliente' && !value) return 'Por favor, selecciona tu objetivo principal';
      return null;
    }
  };

  private validateField(field: 'nombre' | 'role', value: string): string | null;
  private validateField(field: 'objetivo', value: string, role: string): string | null;
  private validateField(field: keyof typeof this.validationRules, value: string, role?: string): string | null {
    if (field === 'objetivo' && role) {
      return this.validationRules.objetivo(value, role);
    }
    if (field === 'nombre') {
      return this.validationRules.nombre(value);
    }
    if (field === 'role') {
      return this.validationRules.role(value);
    }
    return null;
  }

  /**
   * Valida el primer paso (nombre y rol)
   */
  validateStep1(): boolean {
    const data = this.formData();
    
    const nombreError = this.validateField('nombre', data.nombre);
    if (nombreError) {
      this.errorMessage.set(nombreError);
      return false;
    }

    const roleError = this.validateField('role', data.role);
    if (roleError) {
      this.errorMessage.set(roleError);
      return false;
    }

    this.errorMessage.set('');
    return true;
  }

  /**
   * Valida el segundo paso (objetivo para clientes)
   */
  validateStep2(): boolean {
    const data = this.formData();
    
    const objetivoError = this.validateField('objetivo', data.objetivo, data.role);
    if (objetivoError) {
      this.errorMessage.set(objetivoError);
      return false;
    }

    this.errorMessage.set('');
    return true;
  }

  /**
   * Completa el proceso de onboarding
   */
  async completeOnboarding() {
    //solo mock
    this.router.navigate(['/welcome']);
  }

  /**
   * Redirige según el rol del usuario
   */
  redirectToRolePage() {
    const role = this.formData().role;
    switch (role) {
      case 'cliente':
        this.router.navigate(['/cliente-tabs']);
        break;
      case 'entrenador':
        this.router.navigate(['/entrenador-tabs']);
        break;
      case 'gimnasio':
        this.router.navigate(['/gimnasio-tabs']);
        break;
      default:
        this.router.navigate(['/welcome']);
    }
  }

  /**
   * Obtiene el texto descriptivo del rol seleccionado
   */
  getRoleDescription(role: string): string {
    switch (role) {
      case 'cliente':
        return 'Acceso a entrenamientos y seguimiento de progreso';
      case 'entrenador':
        return 'Gestión de clientes y creación de rutinas';
      case 'gimnasio':
        return 'Administración completa del gimnasio';
      default:
        return '';
    }
  }

  /**
   * Obtiene el texto descriptivo del objetivo seleccionado
   */
  getObjetivoDescription(objetivo: string): string {
    switch (objetivo) {
      case 'BAJAR_PESO':
        return 'Te ayudaremos a alcanzar tu peso ideal de forma saludable';
      case 'AUMENTAR_MUSCULO':
        return 'Rutinas específicas para ganar masa muscular';
      case 'MANTENER_PESO':
        return 'Mantén tu peso actual con ejercicios de mantenimiento';
      default:
        return '';
    }
  }

  /**
   * Calcula el progreso del onboarding
   */
  getProgress(): number {
    return this.progress();
  }
}
