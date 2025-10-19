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
  IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbellOutline, close, add, pencil, trash ,barbell} from 'ionicons/icons';
import { AuthService, EjercicioService, EntrenadorService } from 'gym-library';

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
    IonTextarea
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
  private fb = inject(FormBuilder);

  ejerciciosCreados: Signal<any[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadorService.getEjerciciosByEntrenador(entrenadorId)() : [];
  });

  // Signals para el modal de ejercicios
  readonly isEjercicioModalOpen = signal(false);
  readonly ejercicioModalData = signal<any>(null);
  readonly ejercicioEditForm = signal<FormGroup | null>(null);
  readonly isEjercicioCreating = signal(false);

  constructor() {
    addIcons({ barbellOutline, close, add, pencil, trash, barbell });
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
      serieSegundos: [item.serieSegundos || 0],
      descansoSegundos: [item.descansoSegundos || 0],
      creadorId: [item.creadorId || ''],
      creadorTipo: [item.creadorTipo || 'entrenador']
    };

    this.ejercicioEditForm.set(this.fb.group(formConfig));
  }

  async saveEjercicioChanges() {
    const form = this.ejercicioEditForm();
    const originalData = this.ejercicioModalData();

    if (!form || !originalData) return;

    form.markAllAsTouched();

    if (!form.valid) return;

    try {
      const formValue = form.value;
      
      const ejercicioData = {
        ...originalData,
        ...formValue,
        fechaModificacion: new Date()
      };

      if (this.isEjercicioCreating()) {
        ejercicioData.fechaCreacion = new Date();
      }

      await this.ejercicioService.save(ejercicioData);
      
      this.closeEjercicioModal();
      // Mostrar éxito
    } catch (error) {
      console.error('Error guardando ejercicio:', error);
      // Mostrar error
    }
  }
}