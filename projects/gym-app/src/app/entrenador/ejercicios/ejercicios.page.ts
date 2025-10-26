import { Component, OnInit, inject, computed, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonButtons,
  IonInput,
  IonTextarea,
  IonText,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbellOutline, close, add, pencil, trash ,barbell, informationCircleOutline, lockClosed, star} from 'ionicons/icons';
import { AuthService, EjercicioService, EntrenadorService, UserService } from 'gym-library';

@Component({
  selector: 'app-ejercicios',
  templateUrl: './ejercicios.page.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonButtons,
    IonInput,
    IonTextarea,
    IonText
  ],
  styles: [`
    .ejercicio-modal {
      --width: 95%;
      --max-width: 600px;
      --border-radius: 16px;
      --backdrop-opacity: 0.3;
    }
  `]
})
export class EjerciciosPage implements OnInit {
  private authService = inject(AuthService);
  private ejercicioService = inject(EjercicioService);
  private entrenadorService = inject(EntrenadorService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private toastController = inject(ToastController);

  ejerciciosCreados: Signal<any[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadorService.getEjerciciosByEntrenador(entrenadorId)() : [];
  });

  // Computed signals para límites de plan
  readonly hasReachedEjercicioLimit = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return false;
    const limits = this.entrenadorService.getLimits(entrenadorId);
    const currentCount = this.ejerciciosCreados().length;
    return currentCount >= limits.maxExercises;
  });

  readonly ejercicioLimitMessage = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return '';
    const limits = this.entrenadorService.getLimits(entrenadorId);
    const currentCount = this.ejerciciosCreados().length;
    return `Ejercicios creados: ${currentCount}/${limits.maxExercises}`;
  });

  readonly isFreePlan = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return false;
    const user = this.userService.users().find(u => u.uid === entrenadorId);
    return user?.plan === 'free';
  });
  readonly isEjercicioModalOpen = signal(false);
  readonly ejercicioModalData = signal<any>(null);
  readonly ejercicioEditForm = signal<FormGroup | null>(null);
  readonly isEjercicioCreating = signal(false);

  constructor() {
    addIcons({ barbellOutline, close, add, pencil, trash, barbell, informationCircleOutline, lockClosed, star });
  }

  ngOnInit() {
    // Inicializar si es necesario
  }

  verEjercicio(ejercicio: any) {
    this.openEjercicioModal(ejercicio);
  }

  crearEjercicio() {
    this.openCreateEjercicioModal();
  }

  // ========================================
  // MÉTODOS PARA EJERCICIOS
  // ========================================
  
  async deleteEjercicio(id: string) {
    await this.ejercicioService.delete(id);
    // Mostrar toast o algo
  }

  openEjercicioModal(item: any) {
    this.ejercicioModalData.set(item);
    this.isEjercicioModalOpen.set(true);
    this.isEjercicioCreating.set(false);
    this.createEjercicioEditForm(item);
  }

  openCreateEjercicioModal() {
    const newItem = this.createEmptyEjercicio();
    this.ejercicioModalData.set(newItem);
    this.isEjercicioModalOpen.set(true);
    this.isEjercicioCreating.set(true);
    this.createEjercicioEditForm(newItem);
  }

  closeEjercicioModal() {
    this.isEjercicioModalOpen.set(false);
    this.ejercicioModalData.set(null);
    this.ejercicioEditForm.set(null);
    this.isEjercicioCreating.set(false);
  }

  private createEmptyEjercicio(): any {
    const timestamp = Date.now();
    const entrenadorId = this.authService.currentUser()?.uid;
    
    return {
      id: 'e' + timestamp,
      nombre: '',
      series: 1,
      repeticiones: 1,
      peso: 0,
      serieSegundos: 0,
      descansoSegundos: 0,
      descripcion: '',
      creadorId: entrenadorId,
      creadorTipo: 'entrenador'
    };
  }

  private createEjercicioEditForm(item: any) {
    const formConfig: any = {
      nombre: [item.nombre || ''],
      descripcion: [item.descripcion || ''],
      series: [item.series || 1],
      repeticiones: [item.repeticiones || 1],
      peso: [item.peso || 0],
      creadorId: [item.creadorId || ''],
      creadorTipo: [item.creadorTipo || 'entrenador']
    };

    // Solo incluir campos premium si no es plan free
    if (!this.isFreePlan()) {
      formConfig.serieSegundos = [item.serieSegundos || 0];
      formConfig.descansoSegundos = [item.descansoSegundos || 60];
    }

    this.ejercicioEditForm.set(this.fb.group(formConfig));
  }

  async saveEjercicioChanges() {
    const form = this.ejercicioEditForm();
    const originalData = this.ejercicioModalData();

    if (!form || !originalData) return;

    form.markAllAsTouched();

    if (!form.valid) return;

    // Validar límite de ejercicios para creación
    if (this.isEjercicioCreating()) {
      const entrenadorId = this.authService.currentUser()?.uid;
      if (entrenadorId) {
        const limits = this.entrenadorService.getLimits(entrenadorId);
        const currentCount = this.entrenadorService.getEjerciciosByEntrenador(entrenadorId)().length;
        if (currentCount >= limits.maxExercises) {
          const toast = await this.toastController.create({
            message: 'Has alcanzado el límite de ejercicios para tu plan. Actualiza para crear más.',
            duration: 3000,
            color: 'warning',
            position: 'top'
          });
          await toast.present();
          return;
        }
      }
    }

    try {
      const formValue = form.value;
      
      const ejercicioData: any = {
        ...originalData,
        nombre: formValue.nombre,
        descripcion: formValue.descripcion,
        series: formValue.series,
        repeticiones: formValue.repeticiones,
        peso: formValue.peso,
        fechaModificacion: new Date()
      };

      // Solo incluir campos premium si no es plan free
      if (!this.isFreePlan()) {
        ejercicioData.descansoSegundos = formValue.descansoSegundos ?? 60;
        ejercicioData.serieSegundos = formValue.serieSegundos ?? 0;
      }

      if (this.isEjercicioCreating()) {
        ejercicioData.fechaCreacion = new Date();
      }

      await this.ejercicioService.save(ejercicioData);

      // Si es creación, agregar el ejercicio al entrenador
      if (this.isEjercicioCreating() && ejercicioData.id) {
        const entrenadorId = this.authService.currentUser()?.uid;
        if (entrenadorId) {
          await this.entrenadorService.addEjercicioCreado(entrenadorId, ejercicioData.id);
        }
      }
      
      this.closeEjercicioModal();
      // Mostrar éxito
    } catch (error) {
      console.error('Error guardando ejercicio:', error);
      // Mostrar error
    }
  }
}