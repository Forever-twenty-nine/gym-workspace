import { Component, input, output, signal, computed, inject, ChangeDetectionStrategy, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ejercicio, RutinaService, UserService, EntrenadoService } from 'gym-library';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-rutina-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './rutina-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RutinaModalComponent implements OnInit {
  // Servicios inyectados
  private readonly rutinaService = inject(RutinaService);
  private readonly userService = inject(UserService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly fb = inject(FormBuilder);
  private readonly toastService = inject(ToastService);

  // Inputs
  isOpen = input<boolean>(false);
  isCreating = input<boolean>(false);
  ejercicios = input<Ejercicio[]>([]);
  creadorId = input<string>('');
  rutinaToEdit = input<any>(null);

  // Outputs
  close = output<void>();
  rutinaDeleted = output<string>();

  // Signals internos
  readonly rutinaData = signal<any>(null);
  readonly isLoading = signal(false);

  // Formulario reactivo (no necesita ser signal)
  rutinaForm!: FormGroup;

  // Opciones para días de la semana
  readonly diasSemanaOptions = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  // Computed
  readonly modalTitle = computed(() => {
    return this.isCreating() ? 'Crear Rutina' : 'Editar Rutina';
  });

  readonly usuarios = computed(() => {
    return this.userService.users().map(user => ({
      ...user,
      displayName: user.nombre || user.email || `Usuario ${user.uid}`
    }));
  });

  readonly ejerciciosFiltrados = computed(() => {
    const creadorId = this.creadorId();
    if (!creadorId) return this.ejercicios();

    return this.ejercicios().filter((ej: Ejercicio) =>
      ej.creadorId === creadorId && ej.creadorTipo === 'entrenador'
    );
  });

  readonly ejerciciosSeleccionados = computed(() => {
    if (!this.rutinaForm) return [];

    const ejerciciosIds = this.rutinaForm.get('ejercicios')?.value || [];
    return ejerciciosIds.map((id: string) =>
      this.ejercicios().find(ej => ej.id === id)
    ).filter(Boolean);
  });

  ngOnInit() {
    // Inicializar formulario
    this.rutinaForm = this.createForm();
  }

  // Efecto para inicializar formulario cuando se abre el modal
  private readonly initializeFormEffect = effect(() => {
    if (this.isOpen()) {
      this.initializeForm(this.rutinaToEdit() || undefined);
    }
  });

  // Crear formulario
  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      diasSemana: [[]],
      ejercicios: [[]]
    });
  }

  // Inicializar formulario con datos
  initializeForm(rutina?: any) {
    if (rutina) {
      this.rutinaData.set({ ...rutina });
      this.rutinaForm.patchValue({
        nombre: rutina.nombre || '',
        descripcion: rutina.descripcion || '',
        diasSemana: rutina.DiasSemana || rutina.diasSemana || [],
        ejercicios: rutina.ejercicios || []
      });
    } else {
      this.rutinaData.set(null);
      this.rutinaForm.reset({
        nombre: '',
        descripcion: '',
        diasSemana: [],
        ejercicios: []
      });
    }
  }

  // Verificar si un día está seleccionado
  isDiaSelected(dia: string): boolean {
    const diasSeleccionados = this.rutinaForm.get('diasSemana')?.value || [];
    return diasSeleccionados.includes(dia);
  }

  // Toggle día de la semana
  onToggleDia(dia: string) {
    const diasActuales = this.rutinaForm.get('diasSemana')?.value || [];

    let nuevosDias;
    if (diasActuales.includes(dia)) {
      nuevosDias = diasActuales.filter((d: string) => d !== dia);
    } else {
      nuevosDias = [...diasActuales, dia];
    }

    this.rutinaForm.get('diasSemana')?.setValue(nuevosDias);
  }

  // Verificar si un ejercicio está seleccionado
  isEjercicioSelected(ejercicioId: string): boolean {
    const ejerciciosSeleccionados = this.rutinaForm.get('ejercicios')?.value || [];
    return ejerciciosSeleccionados.includes(ejercicioId);
  }

  // Toggle ejercicio
  onToggleEjercicioSeleccion(ejercicioId: string) {
    const ejerciciosActuales = this.rutinaForm.get('ejercicios')?.value || [];

    let nuevosEjercicios;
    if (ejerciciosActuales.includes(ejercicioId)) {
      nuevosEjercicios = ejerciciosActuales.filter((id: string) => id !== ejercicioId);
    } else {
      nuevosEjercicios = [...ejerciciosActuales, ejercicioId];
    }

    this.rutinaForm.get('ejercicios')?.setValue(nuevosEjercicios);
  }

  // Guardar cambios
  async onSaveRutina() {
    const form = this.rutinaForm;

    if (!form.valid) {
      this.toastService.log('Error: Por favor, completa todos los campos obligatorios');
      form.markAllAsTouched();
      return;
    }

    const formValue = form.value;
    if (!formValue.nombre || formValue.nombre.trim() === '') {
      this.toastService.log('Error: El nombre de la rutina es obligatorio');
      return;
    }

    this.isLoading.set(true);

    try {
      const originalData = this.rutinaData();
      let updatedData = { ...originalData, ...formValue };

      // Asegurar creadorId
      if (!updatedData.creadorId) {
        updatedData.creadorId = this.creadorId() || originalData?.creadorId;
      }

      // Limpiar campos para Firestore
      const rutinaToSave: any = {
        id: updatedData.id || `r${Date.now()}`,
        nombre: updatedData.nombre || '',
        descripcion: updatedData.descripcion || '',
        DiasSemana: updatedData.diasSemana || [],
        ejercicios: updatedData.ejercicios || [],
        creadorId: updatedData.creadorId || '',
        entrenadoId: null,
        activa: updatedData.activa ?? true,
        completado: updatedData.completado ?? false,
        fechaAsignacion: updatedData.fechaAsignacion || new Date()
      };

      await this.rutinaService.save(rutinaToSave);

      let logMessage = `${this.isCreating() ? 'Creada' : 'Actualizada'} rutina: ${updatedData.nombre}`;
      if (updatedData.creadorId) {
        const creador = this.usuarios().find(u => u.uid === updatedData.creadorId);
        logMessage += ` - Creador: ${creador?.nombre || creador?.email || updatedData.creadorId}`;
      }

      this.toastService.log(logMessage);
      this.close.emit();

    } catch (error: any) {
      console.error('Error al guardar rutina:', error);
      this.toastService.log(`ERROR al guardar rutina: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Cerrar modal
  onClose() {
    this.close.emit();
  }

  // Eliminar rutina
  async onDeleteRutina() {
    const rutina = this.rutinaData();
    if (!rutina || !rutina.id) {
      this.toastService.log('ERROR: No se puede eliminar la rutina');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la rutina "${rutina.nombre}"?`)) {
      return;
    }

    this.isLoading.set(true);

    try {
      await this.rutinaService.delete(rutina.id);
      this.toastService.log(`Rutina eliminada: ${rutina.nombre}`);
      this.rutinaDeleted.emit(rutina.id);
      this.close.emit();
    } catch (error: any) {
      console.error('Error al eliminar rutina:', error);
      this.toastService.log(`ERROR al eliminar rutina: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }
}