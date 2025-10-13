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
import { AuthService, UserService, EntrenadoService, EntrenadorService, GimnasioService, Objetivo, Rol, Entrenado, Entrenador, Gimnasio } from 'gym-library';

// Configuración del onboarding
const ONBOARDING_CONFIG = {
  STEPS: {
    DATOS_PERSONALES: 1,
    OBJETIVO: 2
  },
  MAX_STEPS: {
    ENTRENADO: 2,
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
  totalSteps = signal<number>(ONBOARDING_CONFIG.MAX_STEPS.ENTRENADO);
  
  formData = signal({
    nombre: '',
    role: 'entrenado' as 'entrenado' | 'entrenador' | 'gimnasio',
    objetivo: 'MANTENER_PESO' as keyof typeof Objetivo | ''
  });

  errorMessage = signal('');
  isLoading = signal(false);

  // Computed properties
  progress = computed(() => (this.currentStep() / this.totalSteps()) * 100);
  isClient = computed(() => this.formData().role === 'entrenado');
  showStep2 = computed(() => this.currentStep() === ONBOARDING_CONFIG.STEPS.OBJETIVO && this.isClient());

  // Enum para el template
  objetivos = Objetivo;

  // Métodos helper para actualizar formData
  updateFormField<K extends keyof ReturnType<typeof this.formData>>(field: K, value: ReturnType<typeof this.formData>[K]) {
    this.formData.update(current => ({ ...current, [field]: value }));
  }

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private entrenadoService: EntrenadoService,
    private entrenadorService: EntrenadorService,
    private gimnasioService: GimnasioService,
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
  }

  /**
   * Avanza al siguiente paso
   */
  nextStep() {
    if (this.currentStep() === ONBOARDING_CONFIG.STEPS.DATOS_PERSONALES) {
      if (!this.validateStep1()) {
        return;
      }

      // Si no es entrenado, completar onboarding directamente
      if (this.formData().role !== 'entrenado') {
        this.totalSteps.set(ONBOARDING_CONFIG.MAX_STEPS.OTROS);
        this.completeOnboarding();
        return;
      }

      this.totalSteps.set(ONBOARDING_CONFIG.MAX_STEPS.ENTRENADO);
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
      if (role === 'entrenado' && !value) return 'Por favor, selecciona tu objetivo principal';
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
   * Valida el segundo paso (objetivo para entrenados)
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
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const uid = currentUser.uid;
      const formData = this.formData();

      // Validar que todos los campos requeridos estén completos
      if (!formData.nombre?.trim()) {
        throw new Error('El nombre es requerido');
      }
      if (!formData.role) {
        throw new Error('El rol es requerido');
      }
      if (formData.role === 'entrenado' && !formData.objetivo) {
        throw new Error('El objetivo es requerido para entrenados');
      }


      // Actualizar el documento de usuario
      const userUpdateData: any = {
        nombre: formData.nombre,
        role: this.mapRoleToEnum(formData.role),
        onboarded: true
      };

      await this.userService.updateUser(uid, userUpdateData);

      // Crear documento específico según el rol
      await this.createRoleSpecificDocument(uid, formData);

      // Redirigir según el rol
      this.redirectToRolePage();

    } catch (error: any) {
      console.error('Error en onboarding:', error);
      this.errorMessage.set(error.message || 'Error al completar el registro. Inténtalo de nuevo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Mapea el rol del formulario al enum Rol
   */
  private mapRoleToEnum(role: string): Rol {
    switch (role) {
      case 'entrenado':
        return Rol.ENTRENADO;
      case 'entrenador':
        return Rol.ENTRENADOR;
      case 'gimnasio':
        return Rol.GIMNASIO;
      default:
        return Rol.ENTRENADO;
    }
  }

  /**
   * Crea el documento específico según el rol
   */
  private async createRoleSpecificDocument(uid: string, formData: any): Promise<void> {
    const role = formData.role;

    switch (role) {
      case 'entrenado':
        const clienteData: Entrenado = {
          id: uid,
          gimnasioId: '', // Se asignará después cuando se una a un gimnasio
          activo: true,
          fechaRegistro: new Date(),
          objetivo: this.mapObjetivoToEnum(formData.objetivo)
        };
        
        await this.entrenadoService.save(clienteData);
        break;

      case 'entrenador':
        const entrenadorData: Omit<Entrenador, 'id'> = {
          gimnasioId: '', // Se asignará después
          activo: true,
          entrenados: [],
          rutinas: []
        };
        await this.entrenadorService.createWithId(uid, entrenadorData);
        break;

      case 'gimnasio':
        const gimnasioData: Gimnasio = {
          id: uid,
          nombre: formData.nombre || 'Gimnasio',
          direccion: '',
          activo: true
        };
        await this.gimnasioService.save(gimnasioData);
        break;

      default:
        throw new Error(`Rol no soportado: ${role}`);
    }
  }

  /**
   * Redirige según el rol del usuario
   */
  redirectToRolePage() {
    const role = this.formData().role;
    switch (role) {
      case 'entrenado':
        this.router.navigate(['/entrenado-tabs']);
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
      case 'entrenado':
        return 'Acceso a entrenamientos y seguimiento de progreso';
      case 'entrenador':
        return 'Gestión de entrenados y creación de rutinas';
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
   * Mapea la cadena del formulario al enum Objetivo
   */
  private mapObjetivoToEnum(objetivo: string | keyof typeof Objetivo | ''): Objetivo {
    switch (objetivo) {
      case 'BAJAR_PESO':
        return Objetivo.BAJAR_PESO;
      case 'AUMENTAR_MUSCULO':
        return Objetivo.AUMENTAR_MUSCULO;
      case 'MANTENER_PESO':
      default:
        return Objetivo.MANTENER_PESO;
    }
  }
}
