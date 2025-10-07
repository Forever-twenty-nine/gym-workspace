import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EntrenadoService, UserService, GimnasioService, EntrenadorService, RutinaService, EjercicioService, Entrenado, Rol, Objetivo } from 'gym-library';
import { GenericCardComponent, CardConfig } from '../../components/shared/generic-card/generic-card.component';
import { ModalFormComponent, FormFieldConfig } from '../../components/modal-form/modal-form.component';
import { ToastComponent, Toast } from '../../components/shared/toast/toast.component';

@Component({
  selector: 'app-entrenados-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenericCardComponent,
    ModalFormComponent,
    ToastComponent
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-white mb-6">Entrenados</h1>
      
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Card de Entrenados -->
        <app-generic-card
          [config]="entrenadosCardConfig"
          [items]="entrenados()"
          [idField]="'id'"
          [canCreate]="false"
          (edit)="openDetailsModal($event)"
          (delete)="deleteEntrenado($event)">
        </app-generic-card>

        <!-- Card de Ejercicios -->
        <app-generic-card
          [config]="ejerciciosCardConfig"
          [items]="ejercicios()"
          [idField]="'id'"
          (create)="addSampleEjercicio()"
          (edit)="openEjercicioModal($event)"
          (delete)="deleteEjercicio($event)">
        </app-generic-card>

        <!-- Card de Rutinas -->
        <app-generic-card
          [config]="rutinasCardConfig"
          [items]="rutinas()"
          [idField]="'id'"
          (create)="addSampleRutina()"
          (edit)="openRutinaModal($event)"
          (delete)="deleteRutina($event)">
        </app-generic-card>
      </section>

      <!-- Toasts -->
      <app-toast 
        [toasts]="toasts()" 
        (closeToast)="removeToast($event)">
      </app-toast>

      <!-- Modal de edición de entrenado -->
      <app-modal-form
        [isOpen]="isModalOpen()"
        [modalType]="'entrenado'"
        [isCreating]="isCreating()"
        [form]="editForm()"
        [formFields]="getFormFields()"
        [ejercicios]="[]"
        [selectedEjercicios]="[]"
        [isLoading]="isLoading()"
        (close)="closeModal()"
        (save)="saveChanges()"
        (toggleDiaSemana)="onToggleDiaSemana($event)"
        (toggleEjercicio)="toggleEjercicio($event)">
      </app-modal-form>

      <!-- Modal de ejercicios -->
      <app-modal-form
        [isOpen]="isEjercicioModalOpen()"
        [modalType]="'ejercicio'"
        [isCreating]="isEjercicioCreating()"
        [form]="ejercicioEditForm()"
        [formFields]="getEjercicioFormFields()"
        [ejercicios]="[]"
        [selectedEjercicios]="[]"
        [isLoading]="isLoading()"
        (close)="closeEjercicioModal()"
        (save)="saveEjercicioChanges()"
        (toggleDiaSemana)="onToggleDiaSemana($event)"
        (toggleEjercicio)="toggleEjercicio($event)">
      </app-modal-form>

      <!-- Modal de rutinas -->
      <app-modal-form
        [isOpen]="isRutinaModalOpen()"
        [modalType]="'rutina'"
        [isCreating]="isRutinaCreating()"
        [form]="rutinaEditForm()"
        [formFields]="getRutinaFormFields()"
        [ejercicios]="ejercicios()"
        [selectedEjercicios]="rutinaModalData()?.ejercicios || []"
        [isLoading]="isLoading()"
        (close)="closeRutinaModal()"
        (save)="saveRutinaChanges()"
        (toggleDiaSemana)="onToggleDiaSemana($event)"
        (toggleEjercicio)="toggleEjercicio($event)">
      </app-modal-form>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadosPage {
  // Servicios inyectados
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly userService = inject(UserService);
  private readonly gimnasioService = inject(GimnasioService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly rutinaService = inject(RutinaService);
  private readonly ejercicioService = inject(EjercicioService);
  private readonly fb = inject(FormBuilder);

  // Signals reactivas para datos
  readonly usuarios = computed(() => {
    return this.userService.users().map(user => {
      const needsReview = !user.nombre || !user.role;
      return {
        ...user,
        displayName: user.nombre || user.email || `Usuario ${user.uid}`,
        needsReview
      };
    });
  });

  readonly entrenadores = computed(() => {
    return this.entrenadorService.entrenadores().map(entrenador => {
      const usuario = this.usuarios().find(u => u.uid === entrenador.id);
      return {
        ...entrenador,
        displayName: usuario?.nombre || usuario?.email || `Entrenador ${entrenador.id}`
      };
    });
  });

  readonly gimnasios = computed(() => {
    return this.gimnasioService.gimnasios().map(gimnasio => ({
      ...gimnasio,
      displayName: gimnasio.nombre || `Gimnasio ${gimnasio.id}`
    }));
  });

  readonly ejercicios = computed(() => {
    return this.ejercicioService.ejercicios().map(ejercicio => {
      let creadorName = null;
      
      if (ejercicio.creadorId) {
        const usuario = this.usuarios().find(u => u.uid === ejercicio.creadorId);
        creadorName = usuario?.nombre || usuario?.email || `Usuario ${ejercicio.creadorId}`;
      }
      
      return {
        ...ejercicio,
        creadorName
      };
    });
  });

  readonly rutinas = computed(() => {
    return this.rutinaService.rutinas().map(rutina => {
      let creadorName = null;
      let asignadoName = null;
      
      if (rutina.creadorId) {
        const usuario = this.usuarios().find(u => u.uid === rutina.creadorId);
        creadorName = usuario?.nombre || usuario?.email || `Usuario ${rutina.creadorId}`;
      }
      
      if (rutina.asignadoId) {
        const usuario = this.usuarios().find(u => u.uid === rutina.asignadoId);
        asignadoName = usuario?.nombre || usuario?.email || `Usuario ${rutina.asignadoId}`;
      }
      
      return {
        ...rutina,
        creadorName,
        asignadoName
      };
    });
  });

  readonly entrenados = computed(() => {
    return this.entrenadoService.entrenados().map(entrenado => {
      const usuario = this.usuarios().find(u => u.uid === entrenado.id);
      const entrenador = this.entrenadores().find(e => e.id === entrenado.entrenadorId);
      const entrenadorName = entrenador?.displayName || (entrenado.entrenadorId ? `Entrenador ${entrenado.entrenadorId}` : null);
      const gimnasio = this.gimnasios().find(g => g.id === entrenado.gimnasioId);
      const gimnasioName = gimnasio?.displayName || (entrenado.gimnasioId ? `Gimnasio ${entrenado.gimnasioId}` : null);
      
      return {
        ...entrenado,
        displayName: usuario?.nombre || usuario?.email || `Entrenado ${entrenado.id}`,
        entrenadorName,
        gimnasioName
      };
    });
  });

  // Configuración de los cards
  readonly entrenadosCardConfig: CardConfig = {
    title: 'Entrenados',
    createButtonText: 'N/A',
    createButtonColor: 'green',
    emptyStateTitle: 'No hay entrenados registrados',
    displayField: 'displayName',
    showCounter: true,
    counterColor: 'green',
    showChips: ['gimnasioName', 'entrenadorName']
  };

  readonly ejerciciosCardConfig: CardConfig = {
    title: 'Ejercicios',
    createButtonText: 'Crear Ejercicio',
    createButtonColor: 'blue',
    emptyStateTitle: 'No hay ejercicios creados',
    displayField: 'nombre',
    showCounter: true,
    counterColor: 'blue',
    showChips: ['creadorName']
  };

  readonly rutinasCardConfig: CardConfig = {
    title: 'Rutinas',
    createButtonText: 'Crear Rutina',
    createButtonColor: 'purple',
    emptyStateTitle: 'No hay rutinas creadas',
    displayField: 'nombre',
    showCounter: true,
    counterColor: 'purple',
    showChips: ['creadorName', 'asignadoName']
  };

  // Signals para el estado del componente
  readonly toasts = signal<Toast[]>([]);
  readonly isModalOpen = signal(false);
  readonly modalData = signal<any>(null);
  readonly editForm = signal<FormGroup | null>(null);
  readonly isLoading = signal(false);
  readonly isCreating = signal(false);
  
  // Signals para ejercicios
  readonly isEjercicioModalOpen = signal(false);
  readonly ejercicioModalData = signal<any>(null);
  readonly ejercicioEditForm = signal<FormGroup | null>(null);
  readonly isEjercicioCreating = signal(false);
  
  // Signals para rutinas
  readonly isRutinaModalOpen = signal(false);
  readonly rutinaModalData = signal<any>(null);
  readonly rutinaEditForm = signal<FormGroup | null>(null);
  readonly isRutinaCreating = signal(false);

  private showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 4000) {
    const id = Date.now().toString();
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      isVisible: false
    };

    this.toasts.update(toasts => [...toasts, toast]);

    setTimeout(() => {
      this.toasts.update(toasts => 
        toasts.map(t => t.id === id ? { ...t, isVisible: true } : t)
      );
    }, 10);

    setTimeout(() => {
      this.removeToast(id);
    }, duration);
  }

  private showSuccess(message: string, duration?: number) {
    this.showToast(message, 'success', duration);
  }

  private showError(message: string, duration?: number) {
    this.showToast(message, 'error', duration);
  }

  private log(msg: string) {
    const cleanMsg = msg.replace(/✅|❌|⚠️/g, '').trim();
    
    if (msg.includes('Error') || msg.includes('ERROR') || msg.includes('❌')) {
      this.showError(cleanMsg);
    } else if (msg.includes('⚠️') || msg.includes('Warning')) {
      this.showToast(cleanMsg, 'warning');
    } else if (msg.includes('✅') || msg.includes('creado') || msg.includes('actualizado') || msg.includes('eliminado')) {
      this.showSuccess(cleanMsg);
    } else {
      this.showToast(cleanMsg, 'info');
    }
  }

  removeToast(id: string) {
    this.toasts.update(toasts => 
      toasts.map(t => t.id === id ? { ...t, isVisible: false } : t)
    );

    setTimeout(() => {
      this.toasts.update(toasts => toasts.filter(t => t.id !== id));
    }, 300);
  }

  async deleteEntrenado(id: string) {
    await this.entrenadoService.delete(id);
    this.log(`Entrenado eliminado: ${id}`);
  }

  openDetailsModal(item: any) {
    this.modalData.set(item);
    this.isModalOpen.set(true);
    this.isCreating.set(false);
    this.createEditForm(item);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.modalData.set(null);
    this.editForm.set(null);
    this.isLoading.set(false);
    this.isCreating.set(false);
  }

  private createEditForm(item: any) {
    const formConfig: any = {
      nombre: [{ value: '', disabled: true }],
      email: [{ value: '', disabled: true }],
      planInfo: [{ value: '', disabled: true }],
      gimnasioInfo: [{ value: '', disabled: true }],
      entrenadorInfo: [{ value: '', disabled: true }],
      activo: [item.activo || false],
      objetivo: [item.objetivo || ''],
      fechaRegistro: [item.fechaRegistro ? new Date(item.fechaRegistro).toISOString().slice(0, 16) : ''],
      rutinasAsociadas: [{ value: '', disabled: true }]
    };

    this.editForm.set(this.fb.group(formConfig));
  }

  async saveChanges() {
    const form = this.editForm();
    const originalData = this.modalData();

    if (!form || !originalData) {
      this.log('Error: Formulario inválido o datos faltantes');
      return;
    }

    form.markAllAsTouched();

    if (!form.valid) {
      this.log('Error: Por favor, completa todos los campos obligatorios');
      return;
    }

    this.isLoading.set(true);

    try {
      let updatedData = { ...originalData, ...form.value };
      
      const clienteDataToSave = {
        ...updatedData,
        fechaRegistro: updatedData.fechaRegistro ? new Date(updatedData.fechaRegistro) : undefined
      };
      
      delete clienteDataToSave.usuarioInfo;
      delete clienteDataToSave.rutinasAsociadas;
      
      await this.entrenadoService.save(clienteDataToSave);
      
      const usuarioNombre = this.usuarios().find(u => u.uid === updatedData.id)?.nombre || updatedData.id;
      const gimnasioNombre = this.usuarios().find(u => u.uid === updatedData.gimnasioId)?.nombre || 'Gimnasio desconocido';
      const entrenadorClienteNombre = this.usuarios().find(u => u.uid === updatedData.entrenadorId)?.nombre || 'Entrenador desconocido';
      
      this.log(`Cliente ${this.isCreating() ? 'creado' : 'actualizado'}: ${usuarioNombre} - Gimnasio: ${gimnasioNombre} - Entrenador: ${entrenadorClienteNombre}`);
      
      this.closeModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      this.log(`Error al guardar los cambios: ${error}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  getObjetivosDisponibles() {
    return Object.values(Objetivo).map(objetivo => ({
      value: objetivo,
      label: objetivo
    }));
  }

  getRutinasAsignadasAlCliente(clienteId: string) {
    // Por ahora retorna array vacío, puedes implementar la lógica completa después
    return [];
  }

  getFormFields(): FormFieldConfig[] {
    const clienteData = this.modalData();
    const usuarioAsociado = this.usuarios().find(u => u.uid === clienteData?.id);
    const rutinasAsignadasAlCliente = this.getRutinasAsignadasAlCliente(clienteData?.id || '');
    const gimnasioAsociado = clienteData?.gimnasioId ? this.gimnasios().find(g => g.id === clienteData.gimnasioId) : null;
    const entrenadorAsociado = clienteData?.entrenadorId ? this.entrenadores().find(e => e.id === clienteData.entrenadorId) : null;
    
    return [
      {
        name: 'nombre',
        type: 'text',
        label: 'Nombre del Cliente',
        placeholder: usuarioAsociado?.nombre || usuarioAsociado?.email || 'Nombre del entrenado',
        readonly: true,
        colSpan: 1
      },
      {
        name: 'email',
        type: 'text',
        label: 'Email',
        placeholder: usuarioAsociado?.email || 'Email del entrenado',
        readonly: true,
        colSpan: 1
      },
      {
        name: 'planInfo',
        type: 'text',
        label: 'Plan de Suscripción',
        placeholder: usuarioAsociado?.plan ? (usuarioAsociado.plan === 'premium' ? 'Premium' : 'Gratuito') : 'Sin plan',
        readonly: true,
        colSpan: 2
      },
      {
        name: 'gimnasioInfo',
        type: 'text',
        label: 'Gimnasio Asociado',
        placeholder: gimnasioAsociado?.displayName || 'Sin gimnasio asignado',
        readonly: true,
        colSpan: 1
      },
      {
        name: 'entrenadorInfo',
        type: 'text',
        label: 'Entrenador Asociado',
        placeholder: entrenadorAsociado?.displayName || 'Sin entrenador asignado',
        readonly: true,
        colSpan: 1
      },
      {
        name: 'objetivo',
        type: 'select',
        label: 'Objetivo',
        placeholder: 'Seleccionar objetivo',
        options: this.getObjetivosDisponibles(),
        colSpan: 1
      },
      {
        name: 'activo',
        type: 'checkbox',
        label: 'Estado',
        checkboxLabel: 'Cliente Activo',
        colSpan: 1
      },
      {
        name: 'fechaRegistro',
        type: 'text',
        inputType: 'datetime-local',
        label: 'Fecha de Registro',
        placeholder: 'Fecha de registro',
        colSpan: 2
      },
      {
        name: 'rutinasAsociadas',
        type: 'rutinas-simple',
        label: `Rutinas Asignadas (${rutinasAsignadasAlCliente.length})`,
        colSpan: 2,
        rutinas: rutinasAsignadasAlCliente
      }
    ];
  }

  // Métodos requeridos por el modal pero no usados en esta página
  onToggleDiaSemana(eventData: { event: Event; value: string }) {
    // No se usa en entrenados
  }

  toggleEjercicio(ejercicioId: string) {
    // No se usa en entrenados
  }

  // ========================================
  // MÉTODOS PARA EJERCICIOS
  // ========================================
  
  addSampleEjercicio() {
    this.openCreateEjercicioModal();
  }

  async deleteEjercicio(id: string) {
    await this.ejercicioService.delete(id);
    this.log(`Ejercicio eliminado: ${id}`);
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
    return {
      id: 'e' + timestamp,
      nombre: '',
      series: 1,
      repeticiones: 1,
      peso: 0,
      serieSegundos: 0,
      descansoSegundos: 0,
      descripcion: ''
    };
  }

  private createEjercicioEditForm(item: any) {
    const formConfig: any = {
      nombre: [item.nombre || ''],
      descripcion: [item.descripcion || ''],
      series: [item.series || 0],
      repeticiones: [item.repeticiones || 0],
      peso: [item.peso || 0],
      serieSegundos: [item.serieSegundos || 0],
      descansoSegundos: [item.descansoSegundos || 0],
      creadorId: [item.creadorId || ''],
      creadorTipo: [item.creadorTipo || ''],
      asignadoAId: [item.asignadoAId || ''],
      asignadoATipo: [item.asignadoATipo || '']
    };

    this.ejercicioEditForm.set(this.fb.group(formConfig));
  }

  async saveEjercicioChanges() {
    const form = this.ejercicioEditForm();
    const originalData = this.ejercicioModalData();

    if (!form || !originalData) {
      this.log('Error: Formulario inválido o datos faltantes');
      return;
    }

    form.markAllAsTouched();

    if (!form.valid) {
      this.log('Error: Por favor, completa todos los campos obligatorios');
      return;
    }

    this.isLoading.set(true);

    try {
      let updatedData = { ...originalData, ...form.value };
      
      await this.ejercicioService.save(updatedData);
      
      let logMessage = `Ejercicio ${this.isEjercicioCreating() ? 'creado' : 'actualizado'}: ${updatedData.nombre}`;
      
      if (updatedData.creadorId) {
        const creador = this.usuarios().find(u => u.uid === updatedData.creadorId);
        logMessage += ` - Creador: ${creador?.nombre || creador?.email || updatedData.creadorId}`;
      }
      
      this.log(logMessage);
      
      this.closeEjercicioModal();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      this.log(`ERROR al guardar ejercicio: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  getEjercicioFormFields(): FormFieldConfig[] {
    return [
      {
        name: 'nombre',
        type: 'text',
        label: 'Nombre del Ejercicio',
        placeholder: 'Nombre del ejercicio',
        colSpan: 2
      },
      {
        name: 'descripcion',
        type: 'textarea',
        label: 'Descripción',
        placeholder: 'Descripción del ejercicio...',
        rows: 2,
        colSpan: 2
      },
      {
        name: 'series',
        type: 'text',
        inputType: 'number',
        label: 'Series',
        placeholder: 'Número de series',
        min: 1,
        colSpan: 1
      },
      {
        name: 'repeticiones',
        type: 'text',
        inputType: 'number',
        label: 'Repeticiones',
        placeholder: 'Repeticiones por serie',
        min: 1,
        colSpan: 1
      },
      {
        name: 'peso',
        type: 'text',
        inputType: 'number',
        label: 'Peso (kg)',
        placeholder: 'Peso en kilogramos',
        min: 0,
        step: 0.5,
        colSpan: 1
      },
      {
        name: 'serieSegundos',
        type: 'text',
        inputType: 'number',
        label: 'Duración de Serie (seg)',
        placeholder: 'Duración por serie',
        min: 0,
        colSpan: 1
      },
      {
        name: 'descansoSegundos',
        type: 'text',
        inputType: 'number',
        label: 'Descanso (seg)',
        placeholder: 'Tiempo de descanso entre series',
        min: 0,
        colSpan: 2
      },
      {
        name: 'creadorId',
        type: 'select',
        label: 'Creador del Ejercicio',
        placeholder: 'Seleccionar creador (opcional)',
        options: [
          { value: '', label: '-- Sin creador --' },
          ...this.usuarios()
            .filter(user => EjercicioService.canCreateEjercicio(user.role as Rol))
            .map(user => ({
              value: user.uid,
              label: `${user.nombre || user.email || user.uid} (${user.role})`
            }))
        ],
        colSpan: 2
      }
    ];
  }

  // ========================================
  // MÉTODOS PARA RUTINAS
  // ========================================
  
  addSampleRutina() {
    this.openCreateRutinaModal();
  }

  async deleteRutina(id: string) {
    await this.rutinaService.delete(id);
    this.log(`Rutina eliminada: ${id}`);
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
    return {
      id: 'r' + timestamp,
      nombre: '',
      diasSemana: [],
      descripcion: '',
      ejercicios: []
    };
  }

  private createRutinaEditForm(item: any) {
    const formConfig: any = {
      nombre: [item.nombre || ''],
      descripcion: [item.descripcion || ''],
      diasSemana: [item.diasSemana || []],
      ejercicios: [item.ejercicios || []],
      creadorId: [item.creadorId || ''],
      asignadoId: [item.asignadoId || '']
    };

    this.rutinaEditForm.set(this.fb.group(formConfig));
  }

  async saveRutinaChanges() {
    const form = this.rutinaEditForm();
    const originalData = this.rutinaModalData();

    if (!form || !originalData) {
      this.log('Error: Formulario inválido o datos faltantes');
      return;
    }

    form.markAllAsTouched();

    if (!form.valid) {
      this.log('Error: Por favor, completa todos los campos obligatorios');
      return;
    }

    this.isLoading.set(true);

    try {
      let updatedData = { ...originalData, ...form.value };
      
      await this.rutinaService.save(updatedData);
      
      let logMessage = `Rutina ${this.isRutinaCreating() ? 'creada' : 'actualizada'}: ${updatedData.nombre}`;
      
      if (updatedData.creadorId) {
        const creador = this.usuarios().find(u => u.uid === updatedData.creadorId);
        logMessage += ` - Creador: ${creador?.nombre || creador?.email || updatedData.creadorId}`;
      }
      
      if (updatedData.asignadoId) {
        const asignado = this.usuarios().find(u => u.uid === updatedData.asignadoId);
        logMessage += ` - Asignado a: ${asignado?.nombre || asignado?.email || updatedData.asignadoId}`;
      }
      
      this.log(logMessage);
      
      this.closeRutinaModal();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      this.log(`ERROR al guardar rutina: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  getRutinaFormFields(): FormFieldConfig[] {
    return [
      {
        name: 'nombre',
        type: 'text',
        label: 'Nombre de la Rutina',
        placeholder: 'Nombre de la rutina',
        colSpan: 2
      },
      {
        name: 'descripcion',
        type: 'textarea',
        label: 'Descripción',
        placeholder: 'Descripción de la rutina...',
        rows: 2,
        colSpan: 2
      },
      {
        name: 'diasSemana',
        type: 'dias-semana',
        label: 'Días de la Semana',
        colSpan: 2
      },
      {
        name: 'ejercicios',
        type: 'ejercicios-multiselect',
        label: 'Ejercicios de la Rutina',
        colSpan: 2
      },
      {
        name: 'creadorId',
        type: 'select',
        label: 'Creador de la Rutina',
        placeholder: 'Seleccionar creador (opcional)',
        options: [
          { value: '', label: '-- Sin creador --' },
          ...this.usuarios()
            .filter(user => user.role === Rol.ENTRENADOR || user.role === Rol.GIMNASIO)
            .map(user => ({
              value: user.uid,
              label: `${user.nombre || user.email || user.uid} (${user.role})`
            }))
        ],
        colSpan: 1
      },
      {
        name: 'asignadoId',
        type: 'select',
        label: 'Asignado A (Cliente)',
        placeholder: 'Seleccionar entrenado (opcional)',
        options: [
          { value: '', label: '-- No asignado --' },
          ...this.usuarios()
            .filter(user => user.role === Rol.ENTRENADO)
            .map(user => ({
              value: user.uid,
              label: `${user.nombre || user.email || user.uid}`
            }))
        ],
        colSpan: 1
      }
    ];
  }
}
