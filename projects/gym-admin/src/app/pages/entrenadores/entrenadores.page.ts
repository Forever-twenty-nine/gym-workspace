import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EntrenadorService, UserService, GimnasioService, EntrenadoService, RutinaService, EjercicioService, Entrenador, Rol } from 'gym-library';
import { GenericCardComponent, CardConfig } from '../../components/shared/generic-card/generic-card.component';
import { ModalFormComponent, FormFieldConfig } from '../../components/modal-form/modal-form.component';
import { ToastComponent, Toast } from '../../components/shared/toast/toast.component';

@Component({
  selector: 'app-entrenadores-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenericCardComponent,
    ModalFormComponent,
    ToastComponent
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-white mb-6">Entrenadores</h1>
      
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Card de Entrenadores -->
        <app-generic-card
          [config]="entrenadoresCardConfig"
          [items]="entrenadores()"
          [idField]="'id'"
          [canCreate]="false"
          (edit)="openDetailsModal($event)"
          (delete)="deleteEntrenador($event)">
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

      <!-- Modal de edición de entrenador -->
      <app-modal-form
        [isOpen]="isModalOpen()"
        [modalType]="'entrenador'"
        [isCreating]="isCreating()"
        [form]="editForm()"
        [formFields]="getFormFields()"
        [ejercicios]="ejercicios()"
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
export class EntrenadoresPage {
  // Servicios inyectados
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly userService = inject(UserService);
  private readonly gimnasioService = inject(GimnasioService);
  private readonly entrenadoService = inject(EntrenadoService);
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

  readonly entrenadoresBase = computed(() => {
    return this.entrenadorService.entrenadores().map(entrenador => {
      const usuario = this.usuarios().find(u => u.uid === entrenador.id);
      return {
        ...entrenador,
        displayName: usuario?.nombre || usuario?.email || `Entrenador ${entrenador.id}`
      };
    });
  });

  readonly entrenadores = computed(() => {
    return this.entrenadoresBase().map(entrenador => {
      const ejerciciosCreados = this.ejercicios().filter(e => 
        e.creadorId === entrenador.id && e.creadorTipo === 'entrenador'
      ).length;
      
      const clientesAsignados = this.entrenadoService.entrenados().filter(c => 
        c.entrenadorId === entrenador.id
      ).length;
      
      const rutinasCreadas = this.rutinas().filter(r => 
        r.creadorId === entrenador.id
      ).length;
      
      return {
        ...entrenador,
        ejerciciosCount: ejerciciosCreados,
        clientesCount: clientesAsignados,
        rutinasCount: rutinasCreadas
      };
    });
  });

  // Configuración de los cards
  readonly entrenadoresCardConfig: CardConfig = {
    title: 'Entrenadores',
    createButtonText: 'N/A',
    createButtonColor: 'orange',
    emptyStateTitle: 'No hay entrenadores registrados',
    displayField: 'displayName',
    showCounter: true,
    counterColor: 'orange',
    showChips: ['ejerciciosCount', 'clientesCount', 'rutinasCount']
  };

  readonly ejerciciosCardConfig: CardConfig = {
    title: 'Ejercicios',
    createButtonText: 'Crear Ejercicio',
    createButtonColor: 'green',
    emptyStateTitle: 'No hay ejercicios creados',
    displayField: 'nombre',
    showCounter: true,
    counterColor: 'green',
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

  async deleteEntrenador(id: string) {
    await this.entrenadorService.delete(id);
    this.log(`Entrenador eliminado: ${id}`);
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
      activo: [item.activo || false],
      rutinasAsociadas: [item.rutinas || []],
      clientesAsignados: [{ value: '', disabled: true }],
      ejerciciosCreados: [{ value: '', disabled: true }]
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
      
      const entrenadorDataToSave = {
        ...updatedData
      };
      
      delete entrenadorDataToSave.usuarioInfo;
      delete entrenadorDataToSave.clientesAsociados;
      delete entrenadorDataToSave.gimnasioInfo;
      
      if (this.isCreating()) {
        const entrenadorServiceAdapter = (this.entrenadorService as any).adapter;
        if (entrenadorServiceAdapter && entrenadorServiceAdapter.createWithId) {
          await entrenadorServiceAdapter.createWithId(entrenadorDataToSave.id, entrenadorDataToSave);
        } else {
          const tempId = await this.entrenadorService.create(entrenadorDataToSave);
          await this.entrenadorService.delete(tempId);
          if (entrenadorServiceAdapter) {
            await entrenadorServiceAdapter.update(entrenadorDataToSave.id, entrenadorDataToSave);
          }
        }
      } else {
        await this.entrenadorService.update(entrenadorDataToSave.id, entrenadorDataToSave);
      }
      
      const usuarioEntrenadorNombre = this.usuarios().find(u => u.uid === updatedData.id)?.nombre || updatedData.id;
      const gimnasioEntrenadorNombre = this.usuarios().find(u => u.uid === updatedData.gimnasioId)?.nombre || 'Gimnasio desconocido';
      const clientesCount = this.entrenadoService.entrenados().filter(c => c.entrenadorId === updatedData.id).length;
      const rutinasCount = this.rutinas().filter(r => r.creadorId === updatedData.id).length;
      
      this.log(`Entrenador ${this.isCreating() ? 'creado' : 'actualizado'}: ${usuarioEntrenadorNombre} - Gimnasio: ${gimnasioEntrenadorNombre} - Entrenados: ${clientesCount} - Rutinas: ${rutinasCount}`);
      
      this.closeModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      this.log(`Error al guardar los cambios: ${error}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  getEntrenadosByEntrenador(entrenadorId: string) {
    return this.entrenadoService.entrenados().filter(entrenado => entrenado.entrenadorId === entrenadorId);
  }

  getRutinasByEntrenador(entrenadorId: string) {
    return this.rutinas().filter(rutina => rutina.creadorId === entrenadorId);
  }

  getEjerciciosByEntrenador(entrenadorId: string) {
    if (!entrenadorId) return [];
    return this.ejercicios().filter(ejercicio => 
      ejercicio.creadorId === entrenadorId && ejercicio.creadorTipo === 'entrenador'
    );
  }

  getGimnasioInfo(gimnasioId: string) {
    const gimnasioUsuario = this.usuarios().find(u => u.uid === gimnasioId && u.role === Rol.GIMNASIO);
    const gimnasioData = this.gimnasios().find(g => g.id === gimnasioId);
    
    if (gimnasioUsuario && gimnasioData) {
      return {
        ...gimnasioData,
        email: gimnasioUsuario.email,
        emailVerified: gimnasioUsuario.emailVerified,
        onboarded: gimnasioUsuario.onboarded
      };
    }
    
    return null;
  }

  getFormFields(): FormFieldConfig[] {
    const entrenadorData = this.modalData();
    const usuarioEntrenador = this.usuarios().find(u => u.uid === entrenadorData?.id);
    const clientesEntrenador = this.getEntrenadosByEntrenador(entrenadorData?.id || '');
    const rutinasEntrenador = this.getRutinasByEntrenador(entrenadorData?.id || '');
    const ejerciciosEntrenador = this.getEjerciciosByEntrenador(entrenadorData?.id || '');
    const gimnasioInfo = entrenadorData?.gimnasioId ? this.getGimnasioInfo(entrenadorData.gimnasioId) : null;
    
    return [
      {
        name: 'nombre',
        type: 'text',
        label: 'Nombre del Entrenador',
        placeholder: usuarioEntrenador?.nombre || usuarioEntrenador?.email || 'Nombre del entrenador',
        readonly: true,
        colSpan: 1
      },
      {
        name: 'email',
        type: 'text',
        label: 'Email',
        placeholder: usuarioEntrenador?.email || 'Email del entrenador',
        readonly: true,
        colSpan: 1
      },
      {
        name: 'planInfo',
        type: 'text',
        label: 'Plan de Suscripción',
        placeholder: usuarioEntrenador?.plan ? (usuarioEntrenador.plan === 'premium' ? 'Premium' : 'Gratuito') : 'Sin plan',
        readonly: true,
        colSpan: 1
      },
      {
        name: 'gimnasioInfo',
        type: 'text',
        label: 'Gimnasio Asociado',
        placeholder: gimnasioInfo?.nombre || 'Sin gimnasio asignado',
        readonly: true,
        colSpan: 1
      },
      {
        name: 'activo',
        type: 'checkbox',
        label: 'Estado',
        checkboxLabel: 'Entrenador Activo',
        colSpan: 2
      },
      {
        name: 'clientesAsignados',
        type: 'clientes-simple',
        label: `Entrenados Asignados (${clientesEntrenador.length})`,
        colSpan: 2,
        clientes: clientesEntrenador.map(entrenado => {
          const usuario = this.usuarios().find(u => u.uid === entrenado.id);
          return {
            id: entrenado.id,
            nombre: usuario?.nombre || usuario?.email || `Cliente ${entrenado.id}`
          };
        })
      },
      {
        name: 'rutinasAsociadas',
        type: 'rutinas-multiselect',
        label: `Rutinas del Entrenador (${rutinasEntrenador.length} disponibles)`,
        colSpan: 2,
        options: rutinasEntrenador.map(rutina => ({
          value: rutina.id,
          label: rutina.nombre,
          extra: this.usuarios().find(u => u.uid === rutina.asignadoId)?.nombre || 'Sin entrenado'
        }))
      },
      {
        name: 'ejerciciosCreados',
        type: 'ejercicios-info',
        label: `Ejercicios Creados (${ejerciciosEntrenador.length})`,
        colSpan: 2,
        ejercicios: ejerciciosEntrenador
      }
    ];
  }

  // Métodos requeridos por el modal pero no usados en esta página
  onToggleDiaSemana(eventData: { event: Event; value: string }) {
    // No se usa en entrenadores
  }

  toggleEjercicio(ejercicioId: string) {
    // No se usa en entrenadores
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
