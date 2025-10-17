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
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fitnessOutline, close, add, pencil, trash ,barbell} from 'ionicons/icons';
import { AuthService, RutinaService, EjercicioService } from 'gym-library';

@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.page.html',
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
    IonSelect,
    IonSelectOption
  ],
  styles: [`
    .rutina-modal {
      --width: 95%;
      --max-width: 600px;
      --border-radius: 16px;
      --backdrop-opacity: 0.3;
    }
  `]
})
export class RutinasPage implements OnInit {
  private authService = inject(AuthService);
  private rutinaService = inject(RutinaService);
  private ejercicioService = inject(EjercicioService);
  private fb = inject(FormBuilder);

  rutinasCreadas: Signal<any[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.rutinaService.getRutinasByCreador(entrenadorId)() : [];
  });

  ejerciciosCreados: Signal<any[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.ejercicioService.getEjerciciosByCreador(entrenadorId)() : [];
  });

  // Signals para el modal de rutinas
  readonly isRutinaModalOpen = signal(false);
  readonly rutinaModalData = signal<any>(null);
  readonly rutinaEditForm = signal<FormGroup | null>(null);
  readonly isRutinaCreating = signal(false);

  constructor() {
    addIcons({ fitnessOutline, close, add, pencil, trash ,barbell});
  }

  ngOnInit() {
    // Inicializar si es necesario
  }

  verRutina(rutina: any) {
    // Abrir modal para ver/editar rutina
    this.openRutinaModal(rutina);
  }

  crearRutina() {
    this.openCreateRutinaModal();
  }

  // ========================================
  // MÉTODOS PARA RUTINAS
  // ========================================
  
  async deleteRutina(id: string) {
    await this.rutinaService.delete(id);
    // Mostrar toast o algo
  }

  openRutinaModal(item: any) {
    this.rutinaModalData.set(item);
    this.isRutinaModalOpen.set(true);
    this.isRutinaCreating.set(false);
    this.createRutinaEditForm(item);
  }

  openCreateRutinaModal() {
    const newItem = this.createEmptyRutina();
    this.rutinaModalData.set(newItem);
    this.isRutinaModalOpen.set(true);
    this.isRutinaCreating.set(true);
    this.createRutinaEditForm(newItem);
  }

  closeRutinaModal() {
    this.isRutinaModalOpen.set(false);
    this.rutinaModalData.set(null);
    this.rutinaEditForm.set(null);
    this.isRutinaCreating.set(false);
  }

  private createEmptyRutina(): any {
    const timestamp = Date.now();
    const entrenadorId = this.authService.currentUser()?.uid;
    return {
      id: 'r' + timestamp,
      nombre: '',
      DiasSemana: [],
      descripcion: '',
      ejercicios: [],
      creadorId: entrenadorId,
      asignadoIds: [],
      activa: true,
      completado: false
    };
  }

  private createRutinaEditForm(item: any) {
    // Convertir DiasSemana de números a strings para el select
    const diasSemanaStrings = item.DiasSemana ? item.DiasSemana.map((dia: number) => dia.toString()) : [];
    
    const formConfig: any = {
      nombre: [item.nombre || ''],
      descripcion: [item.descripcion || ''],
      DiasSemana: [diasSemanaStrings],
      ejercicios: [item.ejercicios || []],
      creadorId: [item.creadorId || ''],
      asignadoIds: [item.asignadoIds || []]
    };

    this.rutinaEditForm.set(this.fb.group(formConfig));
  }

  async saveRutinaChanges() {
    const form = this.rutinaEditForm();
    const originalData = this.rutinaModalData();

    if (!form || !originalData) return;

    form.markAllAsTouched();

    if (!form.valid) return;

    try {
      const formValue = form.value;
      
      // Convertir DiasSemana de strings a números
      const diasSemanaNumeros = formValue.DiasSemana ? formValue.DiasSemana.map((dia: string) => parseInt(dia, 10)) : [];
      
      // Preparar datos para guardar
      const rutinaData = {
        ...originalData,
        ...formValue,
        DiasSemana: diasSemanaNumeros,
        fechaModificacion: new Date()
      };

      if (this.isRutinaCreating()) {
        rutinaData.fechaCreacion = new Date();
      }

      await this.rutinaService.save(rutinaData);
      
      this.closeRutinaModal();
      // Mostrar éxito
    } catch (error) {
      console.error('Error guardando rutina:', error);
      // Mostrar error
    }
  }

  getRutinaFormFields(): any[] {
    return [
      {
        name: 'nombre',
        type: 'text',
        label: 'Nombre de la Rutina',
        placeholder: 'Nombre de la rutina'
      },
      {
        name: 'descripcion',
        type: 'textarea',
        label: 'Descripción',
        placeholder: 'Descripción de la rutina...'
      },
      {
        name: 'DiasSemana',
        type: 'dias-semana',
        label: 'Días de la Semana'
      },
      {
        name: 'ejercicios',
        type: 'ejercicios-multiselect',
        label: 'Ejercicios Disponibles',
        options: this.ejerciciosCreados().map(ejercicio => ({
          value: ejercicio.id,
          label: ejercicio.nombre,
          extra: `${ejercicio.series}x${ejercicio.repeticiones}`
        }))
      }
    ];
  }
}
