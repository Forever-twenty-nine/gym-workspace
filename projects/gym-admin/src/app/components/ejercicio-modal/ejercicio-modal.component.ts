import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ejercicio, EjercicioService, UserService, Rol, EntrenadorService } from 'gym-library';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-ejercicio-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './ejercicio-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EjercicioModalComponent {
  // Servicios inyectados
  private readonly ejercicioService = inject(EjercicioService);
  private readonly userService = inject(UserService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  // Inputs
  isOpen = input<boolean>(false);
  isCreating = input<boolean>(false);
  creadorId = input<string>('');
  ejercicioToEdit = input<Ejercicio | null>(null);

  // Outputs
  close = output<void>();

  // Signals internos
  readonly ejercicioData = signal<Ejercicio | null>(null);
  readonly isLoading = signal(false);

  // Formulario reactivo
  ejercicioForm = signal<FormGroup>(this.createForm());

  // Computed
  readonly modalTitle = computed(() => {
    return this.isCreating() ? 'Crear Ejercicio' : 'Editar Ejercicio';
  });

  readonly usuarios = computed(() => {
    return this.userService.users().map(user => ({
      ...user,
      displayName: user.nombre || user.email || `Usuario ${user.uid}`
    }));
  });

  // Efecto para inicializar formulario cuando cambian los inputs
  private readonly initializeFormEffect = effect(() => {
    if (this.isOpen()) {
      this.initializeForm(this.ejercicioToEdit() || undefined);
    }
  });

  // Crear formulario
  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      series: [0, [Validators.required, Validators.min(1)]],
      repeticiones: [0, [Validators.required, Validators.min(1)]],
      peso: [0, Validators.min(0)],
      descansoSegundos: [0, [Validators.required, Validators.min(0)]],
      serieSegundos: [0, Validators.min(0)]
    });
  }

  // Inicializar formulario con datos
  initializeForm(ejercicio?: Ejercicio) {
    if (ejercicio) {
      this.ejercicioData.set({ ...ejercicio });
      this.ejercicioForm().patchValue({
        nombre: ejercicio.nombre || '',
        descripcion: ejercicio.descripcion || '',
        series: ejercicio.series || 0,
        repeticiones: ejercicio.repeticiones || 0,
        peso: ejercicio.peso || 0,
        descansoSegundos: ejercicio.descansoSegundos || 0,
        serieSegundos: ejercicio.serieSegundos || 0
      });
    } else {
      this.ejercicioData.set(null);
      this.ejercicioForm().reset({
        nombre: '',
        descripcion: '',
        series: 0,
        repeticiones: 0,
        peso: 0,
        descansoSegundos: 0,
        serieSegundos: 0
      });
    }
  }

  // Guardar cambios
  async onSaveEjercicio() {
    const form = this.ejercicioForm();

    if (!form.valid) {
      this.toastService.log('Error: Por favor, completa todos los campos obligatorios');
      form.markAllAsTouched();
      return;
    }

    const formValue = form.value;
    if (!formValue.nombre || formValue.nombre.trim() === '') {
      this.toastService.log('Error: El nombre del ejercicio es obligatorio');
      return;
    }

    this.isLoading.set(true);

    try {
      const originalData = this.ejercicioData();
      let updatedData = { ...originalData, ...formValue };

      // Limpiar campos para Firestore
      const ejercicioToSave: Ejercicio = {
        id: updatedData.id || `ej${Date.now()}`,
        nombre: updatedData.nombre || '',
        descripcion: updatedData.descripcion || '',
        series: updatedData.series || 3,
        repeticiones: updatedData.repeticiones || 10,
        peso: updatedData.peso || 0,
        descansoSegundos: updatedData.descansoSegundos || 60,
        serieSegundos: updatedData.serieSegundos || 0,
        fechaCreacion: updatedData.fechaCreacion || new Date()
      };

      await this.ejercicioService.save(ejercicioToSave);

      // Si es creación, agregar el ejercicio al entrenador
      if (!originalData?.id && this.creadorId()) {
        await this.entrenadorService.addEjercicioCreado(this.creadorId(), ejercicioToSave.id);
      }

      let logMessage = `${this.isCreating() ? 'Creado' : 'Actualizado'} ejercicio: ${updatedData.nombre}`;
      if (this.creadorId()) {
        const creador = this.usuarios().find(u => u.uid === this.creadorId());
        logMessage += ` - Creador: ${creador?.nombre || creador?.email || this.creadorId()}`;
      }

      this.toastService.log(logMessage);
      this.close.emit();

    } catch (error: any) {
      console.error('Error al guardar ejercicio:', error);
      this.toastService.log(`ERROR al guardar ejercicio: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Cerrar modal
  onClose() {
    this.close.emit();
  }
}