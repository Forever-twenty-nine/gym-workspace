import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ejercicio, EjercicioService, UserService, Rol } from 'gym-library';
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
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  // Inputs
  isOpen = input.required<boolean>();
  isCreating = input.required<boolean>();
  creadorId = input<string>('');

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

  // Crear formulario
  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      series: [3, [Validators.required, Validators.min(1)]],
      repeticiones: [10, [Validators.required, Validators.min(1)]],
      peso: [0, Validators.min(0)],
      descansoSegundos: [60, [Validators.required, Validators.min(0)]]
    });
  }

  // Inicializar formulario con datos
  initializeForm(ejercicio?: Ejercicio) {
    if (ejercicio) {
      this.ejercicioData.set({ ...ejercicio });
      this.ejercicioForm().patchValue({
        nombre: ejercicio.nombre || '',
        descripcion: ejercicio.descripcion || '',
        series: ejercicio.series || 3,
        repeticiones: ejercicio.repeticiones || 10,
        peso: ejercicio.peso || 0,
        descansoSegundos: ejercicio.descansoSegundos || 60
      });
    } else {
      this.ejercicioData.set(null);
      this.ejercicioForm().reset({
        nombre: '',
        descripcion: '',
        series: 3,
        repeticiones: 10,
        peso: 0,
        descansoSegundos: 60
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

      // Asegurar creadorId
      if (!updatedData.creadorId) {
        updatedData.creadorId = this.creadorId() || originalData?.creadorId;
      }

      // Limpiar campos para Firestore
      const ejercicioToSave: Ejercicio = {
        id: updatedData.id || `ej${Date.now()}`,
        nombre: updatedData.nombre || '',
        descripcion: updatedData.descripcion || '',
        series: updatedData.series || 3,
        repeticiones: updatedData.repeticiones || 10,
        peso: updatedData.peso || 0,
        descansoSegundos: updatedData.descansoSegundos || 60,
        creadorId: updatedData.creadorId || '',
        creadorTipo: Rol.ENTRENADOR,
        fechaCreacion: updatedData.fechaCreacion || new Date()
      };

      await this.ejercicioService.save(ejercicioToSave);

      let logMessage = `${this.isCreating() ? 'Creado' : 'Actualizado'} ejercicio: ${updatedData.nombre}`;
      if (updatedData.creadorId) {
        const creador = this.usuarios().find(u => u.uid === updatedData.creadorId);
        logMessage += ` - Creador: ${creador?.nombre || creador?.email || updatedData.creadorId}`;
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