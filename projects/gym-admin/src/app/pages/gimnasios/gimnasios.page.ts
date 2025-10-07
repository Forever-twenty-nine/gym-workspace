import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GimnasioService, UserService, EntrenadorService, EntrenadoService, Gimnasio, Rol } from 'gym-library';
import { GenericCardComponent, CardConfig } from '../../components/shared/generic-card/generic-card.component';
import { ModalFormComponent, FormFieldConfig } from '../../components/modal-form/modal-form.component';
import { ToastComponent, Toast } from '../../components/shared/toast/toast.component';

@Component({
  selector: 'app-gimnasios-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenericCardComponent,
    ModalFormComponent,
    ToastComponent
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-white mb-6">Gimnasios</h1>
      
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Card de Gimnasios -->
        <app-generic-card
          [config]="gimnasiosCardConfig"
          [items]="gimnasios()"
          [idField]="'id'"
          [canCreate]="false"
          (edit)="openDetailsModal($event)"
          (delete)="deleteGimnasio($event)">
        </app-generic-card>
      </section>

      <!-- Toasts -->
      <app-toast 
        [toasts]="toasts()" 
        (closeToast)="removeToast($event)">
      </app-toast>

      <!-- Modal de edición -->
      <app-modal-form
        [isOpen]="isModalOpen()"
        [modalType]="'gimnasio'"
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
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GimnasiosPage {
  // Servicios inyectados
  private readonly gimnasioService = inject(GimnasioService);
  private readonly userService = inject(UserService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly entrenadoService = inject(EntrenadoService);
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

  // Configuración del card
  readonly gimnasiosCardConfig: CardConfig = {
    title: 'Gimnasios',
    createButtonText: 'N/A',
    createButtonColor: 'purple',
    emptyStateTitle: 'No hay gimnasios registrados',
    displayField: 'displayName',
    showCounter: true,
    counterColor: 'purple'
  };

  // Signals para el estado del componente
  readonly toasts = signal<Toast[]>([]);
  readonly isModalOpen = signal(false);
  readonly modalData = signal<any>(null);
  readonly editForm = signal<FormGroup | null>(null);
  readonly isLoading = signal(false);
  readonly isCreating = signal(false);

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

  async deleteGimnasio(id: string) {
    await this.gimnasioService.delete(id);
    this.log(`Gimnasio eliminado: ${id}`);
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
    const entrenadoresAsociados = this.getEntrenadoresByGimnasio(item.id || '').map(e => e.id);
    const clientesAsociados = this.getEntrenadosByGimnasio(item.id || '').map(c => c.id);
    
    const formConfig: any = {
      usuarioInfo: [{ value: '', disabled: true }],
      nombre: [item.nombre || '', [Validators.required]],
      direccion: [item.direccion || '', [Validators.required]],
      activo: [item.activo || true],
      entrenadoresAsociados: [entrenadoresAsociados],
      clientesAsociados: [clientesAsociados]
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
      
      const gimnasioDataToSave = {
        ...updatedData
      };
      
      delete gimnasioDataToSave.usuarioInfo;
      const entrenadoresSeleccionados = updatedData.entrenadoresAsociados || [];
      const clientesSeleccionados = updatedData.clientesAsociados || [];
      delete gimnasioDataToSave.entrenadoresAsociados;
      delete gimnasioDataToSave.clientesAsociados;
      
      await this.gimnasioService.save(gimnasioDataToSave);
      
      if (!this.isCreating()) {
        const entrenadoresActuales = this.getEntrenadoresByGimnasio(updatedData.id);
        for (const entrenador of entrenadoresActuales) {
          if (!entrenadoresSeleccionados.includes(entrenador.id)) {
            await this.entrenadorService.update(entrenador.id, { 
              ...entrenador, 
              gimnasioId: '' 
            });
          }
        }
        
        const clientesActuales = this.getEntrenadosByGimnasio(updatedData.id);
        for (const entrenado of clientesActuales) {
          if (!clientesSeleccionados.includes(entrenado.id)) {
            await this.entrenadoService.save({ 
              ...entrenado, 
              gimnasioId: '' 
            });
          }
        }
      }
      
      for (const entrenadorId of entrenadoresSeleccionados) {
        try {
          const entrenadorActual = this.entrenadorService.entrenadores().find(e => e.id === entrenadorId);
          if (entrenadorActual) {
            await this.entrenadorService.update(entrenadorId, {
              ...entrenadorActual,
              gimnasioId: updatedData.id
            });
          } else {
            const entrenadorServiceAdapter = (this.entrenadorService as any).adapter;
            if (entrenadorServiceAdapter && entrenadorServiceAdapter.createWithId) {
              await entrenadorServiceAdapter.createWithId(entrenadorId, {
                id: entrenadorId,
                gimnasioId: updatedData.id,
                activo: true,
                clientes: [],
                rutinas: [],
                ejercicios: []
              });
            }
          }
        } catch (error) {
          console.error(`Error al asociar entrenador ${entrenadorId}:`, error);
          this.log(`⚠️ Error al asociar entrenador ${entrenadorId}: ${error}`);
        }
      }
      
      for (const clienteId of clientesSeleccionados) {
        try {
          const clienteActual = this.entrenadoService.entrenados().find(c => c.id === clienteId);
          if (clienteActual) {
            await this.entrenadoService.save({
              ...clienteActual,
              gimnasioId: updatedData.id
            });
          } else {
            const entrenadoServiceAdapter = (this.entrenadoService as any).adapter;
            if (entrenadoServiceAdapter && entrenadoServiceAdapter.createWithId) {
              await entrenadoServiceAdapter.createWithId(clienteId, {
                id: clienteId,
                gimnasioId: updatedData.id,
                activo: true,
                entrenadorId: '',
                objetivo: '',
                fechaRegistro: new Date(),
                rutinas: []
              });
            }
          }
        } catch (error) {
          console.error(`Error al asociar entrenado ${clienteId}:`, error);
          this.log(`⚠️ Error al asociar entrenado ${clienteId}: ${error}`);
        }
      }
      
      this.log(`Gimnasio ${this.isCreating() ? 'creado' : 'actualizado'}: ${updatedData.nombre} - Entrenadores: ${entrenadoresSeleccionados.length}, Entrenados: ${clientesSeleccionados.length}`);
      
      this.closeModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      this.log(`Error al guardar los cambios: ${error}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  getEntrenadoresByGimnasio(gimnasioId: string) {
    return this.entrenadorService.entrenadores().filter(entrenador => entrenador.gimnasioId === gimnasioId);
  }

  getEntrenadosDisponiblesParaGimnasio() {
    return this.usuarios().filter(u => u.role === Rol.ENTRENADO);
  }

  getEntrenadoresDisponiblesParaGimnasio() {
    return this.usuarios().filter(u => u.role === Rol.ENTRENADOR);
  }

  getEntrenadosByGimnasio(gimnasioId: string) {
    return this.entrenadoService.entrenados().filter(entrenado => entrenado.gimnasioId === gimnasioId);
  }

  getFormFields(): FormFieldConfig[] {
    const gimnasioData = this.modalData();
    const usuarioGimnasio = this.usuarios().find(u => u.uid === gimnasioData?.id);
    const entrenadoresGimnasio = this.getEntrenadoresByGimnasio(gimnasioData?.id || '');
    const entrenadoresDisponibles = this.getEntrenadoresDisponiblesParaGimnasio();
    const clientesGimnasio = this.getEntrenadosByGimnasio(gimnasioData?.id || '');
    const clientesDisponibles = this.getEntrenadosDisponiblesParaGimnasio();
    
    return [
      {
        name: 'usuarioInfo',
        type: 'user-info',
        label: 'Usuario Asociado',
        colSpan: 2,
        usuario: usuarioGimnasio
      },
      {
        name: 'nombre',
        type: 'text',
        label: 'Nombre',
        placeholder: 'Nombre del gimnasio',
        colSpan: 2
      },
      {
        name: 'direccion',
        type: 'text',
        label: 'Dirección',
        placeholder: 'Dirección del gimnasio',
        colSpan: 2
      },
      {
        name: 'activo',
        type: 'checkbox',
        label: 'Estado',
        checkboxLabel: 'Gimnasio Activo',
        colSpan: 2
      },
      {
        name: 'entrenadoresAsociados',
        type: 'entrenadores-multiselect',
        label: `Entrenadores del Gimnasio (${entrenadoresDisponibles.length} disponibles)`,
        colSpan: 2,
        options: entrenadoresDisponibles.map(entrenador => ({
          value: entrenador.uid,
          label: entrenador.nombre || entrenador.email || `Entrenador ${entrenador.uid}`,
          extra: entrenador.emailVerified ? 'Verificado' : 'Sin verificar'
        }))
      },
      {
        name: 'clientesAsociados',
        type: 'clientes-multiselect',
        label: `Entrenados del Gimnasio (${clientesDisponibles.length} disponibles)`,
        colSpan: 2,
        options: clientesDisponibles.map(entrenado => ({
          value: entrenado.uid,
          label: entrenado.nombre || entrenado.email || `Cliente ${entrenado.uid}`,
          extra: entrenado.emailVerified ? 'Verificado' : 'Sin verificar'
        }))
      }
    ];
  }

  // Métodos requeridos por el modal pero no usados en esta página
  onToggleDiaSemana(eventData: { event: Event; value: string }) {
    // No se usa en gimnasios
  }

  toggleEjercicio(ejercicioId: string) {
    // No se usa en gimnasios
  }
}

