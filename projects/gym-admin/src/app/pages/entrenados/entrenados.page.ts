import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  EntrenadoService, 
  UserService, 
  GimnasioService, 
  EntrenadorService,
  NotificacionService,
  RutinaService,
  Notificacion,
  Entrenado, 
  Rol, 
  Objetivo
} from 'gym-library';
import { ModalFormComponent, FormFieldConfig } from '../../components/modal-form/modal-form.component';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { GenericModalManager } from '../../helpers/modal-manager.helper';
import { DisplayHelperService } from '../../services/display-helper.service';
import { EntrenadosTableComponent } from '../../components/entrenados-table/entrenados-table.component';

@Component({
  selector: 'app-entrenados-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalFormComponent,
    EntrenadosTableComponent
  ],
  templateUrl: './entrenados.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadosPage {
  // Servicios inyectados
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly userService = inject(UserService);
  private readonly gimnasioService = inject(GimnasioService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly rutinaService = inject(RutinaService);
  private readonly fb = inject(FormBuilder);
  readonly toastService = inject(ToastService);
  private readonly displayHelper = inject(DisplayHelperService);
  private readonly pageTitleService = inject(PageTitleService);

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

  readonly entrenados = computed(() => {
    return this.entrenadoService.entrenados().map(entrenado => {
      const usuario = this.usuarios().find(u => u.uid === entrenado.id);
      const entrenadorId = entrenado.entrenadoresId?.[0]; // Tomar el primer entrenador
      const entrenador = entrenadorId ? this.entrenadores().find(e => e.id === entrenadorId) : null;
      const entrenadorName = entrenador?.displayName || (entrenadorId ? `Entrenador ${entrenadorId}` : 'Sin asignar');
      
      return {
        ...entrenado,
        displayName: usuario?.nombre || usuario?.email || `Entrenado ${entrenado.id}`,
        entrenadorName
      };
    });
  });

  // Rutinas del sistema
  readonly rutinas = computed(() => {
    return this.rutinaService.rutinas();
  });

  // Signals para el estado del componente
  readonly isModalOpen = signal(false);
  readonly modalData = signal<any>(null);
  readonly editForm = signal<FormGroup | null>(null);
  readonly isLoading = signal(false);
  readonly isCreating = signal(false);

  constructor() {
    this.pageTitleService.setTitle('Entrenados');
    
    // Inicializar el listener de entrenadores (necesario para las listas desplegables)
    this.entrenadorService.initializeListener();
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
      entrenadorInfo: [{ value: '', disabled: true }],
      objetivo: [item.objetivo || ''],
      fechaRegistro: [item.fechaRegistro ? new Date(item.fechaRegistro).toISOString().slice(0, 16) : '']
    };

    this.editForm.set(this.fb.group(formConfig));
  }

  async saveChanges() {
    const form = this.editForm();
    const originalData = this.modalData();

    if (!form || !originalData) {
      this.toastService.log('Error: Formulario inválido o datos faltantes');
      return;
    }

    form.markAllAsTouched();

    if (!form.valid) {
      this.toastService.log('Error: Por favor, completa todos los campos obligatorios');
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
      
      await this.entrenadoService.save(clienteDataToSave);
      
      const usuarioNombre = this.usuarios().find(u => u.uid === updatedData.id)?.nombre || updatedData.id;
      const entrenadorId = updatedData.entrenadoresId?.[0];
      const entrenadorClienteNombre = entrenadorId ? this.usuarios().find(u => u.uid === entrenadorId)?.nombre || 'Entrenador desconocido' : 'Sin entrenador';
      
      this.toastService.log(`Cliente ${this.isCreating() ? 'creado' : 'actualizado'}: ${usuarioNombre} - Entrenador: ${entrenadorClienteNombre}`);
      
      this.closeModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      this.toastService.log(`Error al guardar los cambios: ${error}`);
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

  getFormFields(): FormFieldConfig[] {
    const clienteData = this.modalData();
    
    // Si no hay datos, retornar array vacío
    if (!clienteData || !clienteData.id) {
      return [];
    }
    
    const usuarioAsociado = this.usuarios().find(u => u.uid === clienteData?.id);
    const entrenadorId = clienteData?.entrenadoresId?.[0];
    const entrenadorAsociado = entrenadorId ? this.entrenadores().find(e => e.id === entrenadorId) : null;
    
    // Obtener notificaciones del entrenado (SOLO NO LEÍDAS)
    const notificacionesEntrenado = this.getNotificacionesEntrenado(clienteData.id).filter(n => !n.leida);
    
    // Obtener rutinas asignadas al entrenado
    const rutinasAsignadas = this.rutinas().filter(rutina => {
      // Verificar si la rutina está en la lista de rutinas asignadas del cliente
      return clienteData.rutinasAsignadas && clienteData.rutinasAsignadas.includes(rutina.id);
    }).map(rutina => {
      const creador = this.usuarios().find(u => u.uid === rutina.creadorId);
      return {
        ...rutina,
        asignadoNombre: usuarioAsociado?.nombre || usuarioAsociado?.email || 'Entrenado',
        creadorNombre: creador?.nombre || creador?.email || 'Desconocido'
      };
    });
    
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
        name: 'rutinasAsignadas',
        type: 'text',
        label: 'Rutinas Asignadas',
        placeholder: rutinasAsignadas.length > 0 ? `${rutinasAsignadas.length} rutina(s) asignada(s)` : 'Sin rutinas asignadas',
        readonly: true,
        colSpan: 2
      },
      {
        name: 'notificacionesMensajes',
        type: 'text',
        label: 'Notificaciones Pendientes',
        placeholder: notificacionesEntrenado.length > 0 ? `${notificacionesEntrenado.length} notificación(es) pendiente(s)` : 'Sin notificaciones pendientes',
        readonly: true,
        colSpan: 2
      },
      {
        name: 'fechaRegistro',
        type: 'text',
        inputType: 'datetime-local',
        label: 'Fecha de Registro',
        placeholder: 'Fecha de registro',
        colSpan: 2
      }
    ];
  }

  // ========================================
  // MÉTODOS PARA NOTIFICACIONES EN MODAL
  // ========================================

  getNotificacionesEntrenado(entrenadoId: string): any[] {
    if (!entrenadoId) return [];
    
    const todasNotificaciones = this.notificacionService.notificaciones();
    
    const notificacionesRelacionadas = todasNotificaciones.filter(notif => {
      return notif.usuarioId === entrenadoId;
    });
    
    return notificacionesRelacionadas.map(notif => {
      const remitenteId = notif.datos?.['remitenteId'];
      
      if (remitenteId) {
        const remitente = this.usuarios().find(u => u.uid === remitenteId);
        return {
          ...notif,
          noLeidos: 0, // Sin mensajes, no hay no leídos
          mensajeInfo: {
            remitenteNombre: remitente?.nombre || remitente?.email || 'Usuario desconocido'
          }
        };
      }
      
      return { ...notif, noLeidos: 0 };
    });
  }

  getConversacionesEntrenado(entrenadoId: string): any[] {
    // Funcionalidad de conversaciones no disponible
    return [];
  }
}
