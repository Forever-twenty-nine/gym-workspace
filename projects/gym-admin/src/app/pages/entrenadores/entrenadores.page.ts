import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  EntrenadorService, 
  UserService, 
  GimnasioService, 
  EntrenadoService, 
  RutinaService, 
  EjercicioService, 
  NotificacionService,
  MensajeService,
  InvitacionService,
  Notificacion,
  Mensaje,
  Invitacion,
  Entrenador, 
  Rol 
} from 'gym-library';
import { GenericCardComponent, CardConfig } from '../../components/shared/generic-card/generic-card.component';
import { ModalFormComponent, FormFieldConfig } from '../../components/modal-form/modal-form.component';
import { ToastComponent, Toast } from '../../components/shared/toast/toast.component';
import { GenericModalManager } from '../../helpers/modal-manager.helper';
import { DisplayHelperService } from '../../services/display-helper.service';

@Component({
  selector: 'app-entrenadores-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenericCardComponent,
    ModalFormComponent,
    ToastComponent
  ],
  templateUrl: './entrenadores.page.html',
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
  private readonly notificacionService = inject(NotificacionService);
  private readonly mensajeService = inject(MensajeService);
  private readonly invitacionService = inject(InvitacionService);
  private readonly fb = inject(FormBuilder);
  private readonly displayHelper = inject(DisplayHelperService);

  // Modal managers para notificaciones, mensajes e invitaciones
  readonly notificacionManager: GenericModalManager<Notificacion>;
  readonly mensajeManager: GenericModalManager<Mensaje>;
  readonly invitacionManager: GenericModalManager<Invitacion>;

  constructor() {
    // Inicializar modal managers
    this.notificacionManager = new GenericModalManager<Notificacion>(
      this.fb,
      (item) => this.createNotificacionEditForm(item),
      (data) => this.notificacionService.save(data),
      (id) => this.notificacionService.delete(id)
    );

    this.mensajeManager = new GenericModalManager<Mensaje>(
      this.fb,
      (item) => this.createMensajeEditForm(item),
      (data) => this.mensajeService.save(data),
      (id) => this.mensajeService.delete(id)
    );

    this.invitacionManager = new GenericModalManager<Invitacion>(
      this.fb,
      (item) => this.createInvitacionEditForm(item),
      (data) => this.invitacionService.save(data),
      (id) => this.invitacionService.delete(id)
    );
  }

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

  readonly notificacionesCardConfig: CardConfig = {
    title: 'Notificaciones',
    createButtonText: 'Nueva Notificación',
    createButtonColor: 'blue',
    emptyStateTitle: 'No hay notificaciones',
    displayField: 'titulo',
    showCounter: true,
    counterColor: 'blue',
    showChips: ['tipo', 'leida']
  };

  readonly mensajesCardConfig: CardConfig = {
    title: 'Mensajes',
    createButtonText: 'Nuevo Mensaje',
    createButtonColor: 'purple',
    emptyStateTitle: 'No hay mensajes',
    displayField: 'titulo',
    showCounter: true,
    counterColor: 'purple',
    showChips: ['remitenteChip', 'destinatarioChip']
  };

  readonly invitacionesCardConfig: CardConfig = {
    title: 'Invitaciones',
    createButtonText: 'Nueva Invitación',
    createButtonColor: 'orange',
    emptyStateTitle: 'No hay invitaciones',
    displayField: 'mensaje',
    showCounter: true,
    counterColor: 'orange',
    showChips: ['estado', 'tipo']
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

  // Signals para notificaciones (desde el servicio)
  readonly notificaciones = computed(() => {
    return this.notificacionService.notificaciones().map(notif => {
      const tipoDisplay = this.displayHelper.getTipoNotificacionDisplay(notif.tipo);
      const leidaDisplay = notif.leida 
        ? '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> Leída' 
        : '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg> No leída';
      
      return {
        ...notif,
        titulo: notif.titulo,
        tipo: tipoDisplay,
        leida: leidaDisplay
      };
    });
  });

  // Signals para mensajes (desde el servicio)
  readonly mensajes = computed(() => {
    return this.mensajeService.mensajes().map(mensaje => {
      const remitente = this.usuarios().find(u => u.uid === mensaje.remitenteId);
      const destinatario = this.usuarios().find(u => u.uid === mensaje.destinatarioId);
      
      const remitenteNombre = remitente?.nombre || remitente?.email || `Usuario ${mensaje.remitenteId}`;
      const destinatarioNombre = destinatario?.nombre || destinatario?.email || `Usuario ${mensaje.destinatarioId}`;
      
      const titulo = this.displayHelper.getTituloMensaje(mensaje.tipo);
      
      return {
        ...mensaje,
        titulo,
        remitenteChip: `De: ${remitenteNombre}`,
        destinatarioChip: `Para: ${destinatarioNombre}`
      };
    });
  });

  // Signals para invitaciones (desde el servicio)
  readonly invitaciones = computed(() => {
    return this.invitacionService.invitaciones().map(inv => {
      const estadoDisplay = this.displayHelper.getEstadoInvitacionDisplay(inv.estado);
      const tipoDisplay = this.displayHelper.getFranjaHorariaDisplay(inv.franjaHoraria);
      
      return {
        ...inv,
        mensaje: inv.mensaje || `Invitación para ${inv.email}`,
        tipo: tipoDisplay,
        estado: estadoDisplay
      };
    });
  });

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

  // Funciones helper para display
  private getTipoNotificacionDisplay(tipo: any): string {
    const tipoMap: Record<string, string> = {
      'rutina_asignada': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/></svg> Rutina',
      'mensaje_nuevo': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"/></svg> Mensaje',
      'invitacion': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg> Invitación',
      'ejercicio_completado': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> Ejercicio',
      'sesion_programada': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg> Sesión',
      'info': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg> Info'
    };
    return tipoMap[tipo] || '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg> Info';
  }

  private getEstadoInvitacionDisplay(estado: string): string {
    const estadoMap: Record<string, string> = {
      'pendiente': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg> Pendiente',
      'aceptada': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> Aceptada',
      'rechazada': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg> Rechazada'
    };
    return estadoMap[estado] || '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg> Pendiente';
  }

  private getTipoInvitacionDisplay(franja?: string): string {
    if (!franja) return '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg> General';
    const tipoMap: Record<string, string> = {
      'mañana': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/></svg> Mañana',
      'tarde': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg> Tarde',
      'noche': '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg> Noche'
    };
    return tipoMap[franja] || '<svg class="inline w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/></svg> General';
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

  // ========================================
  // MÉTODOS PARA NOTIFICACIONES
  // ========================================

  // ========================================
  // MÉTODOS PARA NOTIFICACIONES
  // ========================================

  addNotificacion() {
    const newNotificacion = {
      id: 'n' + Date.now(),
      usuarioId: '',
      tipo: 'rutina_asignada' as const,
      titulo: '',
      mensaje: '',
      leida: false,
      fechaCreacion: new Date()
    } as Notificacion;
    this.notificacionManager.openCreateModal(newNotificacion);
  }

  openNotificacionModal(item: any) {
    this.notificacionManager.openEditModal(item as Notificacion);
  }

  private createNotificacionEditForm(item: Notificacion): FormGroup {
    return this.fb.group({
      usuarioId: [item.usuarioId || '', Validators.required],
      tipo: [item.tipo || 'rutina_asignada', Validators.required],
      titulo: [item.titulo || '', Validators.required],
      mensaje: [item.mensaje || '', Validators.required]
    });
  }

  async saveNotificacion() {
    this.isLoading.set(true);
    const result = await this.notificacionManager.save({
      leida: false,
      fechaCreacion: new Date()
    });
    this.isLoading.set(false);
    
    if (result.success) {
      this.log(`Notificación ${this.notificacionManager.isCreating() ? 'creada' : 'actualizada'}`);
    } else {
      this.log(`ERROR: ${result.error}`);
    }
  }

  getNotificacionFormFields(): FormFieldConfig[] {
    return [
      {
        name: 'usuarioId',
        type: 'select',
        label: 'Usuario Destinatario',
        placeholder: 'Seleccionar usuario',
        options: this.usuarios().map(user => ({
          value: user.uid,
          label: `${user.nombre || user.email || user.uid} (${user.role})`
        })),
        colSpan: 2
      },
      {
        name: 'tipo',
        type: 'select',
        label: 'Tipo de Notificación',
        placeholder: 'Seleccionar tipo',
        options: [
          { value: 'rutina_asignada', label: 'Rutina Asignada' },
          { value: 'recordatorio', label: 'Recordatorio' },
          { value: 'logro', label: 'Logro' },
          { value: 'mensaje_nuevo', label: 'Mensaje Nuevo' },
          { value: 'invitacion', label: 'Invitación' },
          { value: 'rutina_completada', label: 'Rutina Completada' },
          { value: 'nuevo_pr', label: 'Nuevo Récord Personal' }
        ],
        colSpan: 2
      },
      {
        name: 'titulo',
        type: 'text',
        label: 'Título',
        placeholder: 'Título de la notificación',
        colSpan: 2
      },
      {
        name: 'mensaje',
        type: 'textarea',
        label: 'Mensaje',
        placeholder: 'Contenido de la notificación...',
        rows: 3,
        colSpan: 2
      }
    ];
  }

  async deleteNotificacion(id: string) {
    const result = await this.notificacionManager.delete(id);
    if (result.success) {
      this.log('Notificación eliminada');
    } else {
      this.log(`ERROR: ${result.error}`);
    }
  }

  // ========================================
  // MÉTODOS PARA MENSAJES
  // ========================================

  addMensaje() {
    const newMensaje = {
      id: 'm' + Date.now(),
      conversacionId: 'conv-' + Date.now(),
      remitenteId: '',
      remitenteTipo: Rol.ENTRENADOR,
      destinatarioId: '',
      destinatarioTipo: Rol.ENTRENADO,
      contenido: '',
      tipo: 'texto' as const,
      leido: false,
      entregado: false,
      fechaEnvio: new Date()
    } as Mensaje;
    this.mensajeManager.openCreateModal(newMensaje);
  }

  openMensajeModal(item: any) {
    this.mensajeManager.openEditModal(item as Mensaje);
  }

  private createMensajeEditForm(item: Mensaje): FormGroup {
    return this.fb.group({
      remitenteId: [item.remitenteId || '', Validators.required],
      destinatarioId: [item.destinatarioId || '', Validators.required],
      contenido: [item.contenido || '', Validators.required],
      tipo: [item.tipo || 'texto', Validators.required]
    });
  }

  async saveMensaje() {
    this.isLoading.set(true);
    
    const form = this.mensajeManager.editForm();
    if (form) {
      const remitenteUser = this.usuarios().find(u => u.uid === form.value.remitenteId);
      const destinatarioUser = this.usuarios().find(u => u.uid === form.value.destinatarioId);
      
      const result = await this.mensajeManager.save({
        remitenteTipo: remitenteUser?.role || Rol.ENTRENADOR,
        destinatarioTipo: destinatarioUser?.role || Rol.ENTRENADO,
        leido: false,
        entregado: true,
        fechaEnvio: new Date()
      });
      
      this.isLoading.set(false);
      
      if (result.success) {
        this.log(`Mensaje ${this.mensajeManager.isCreating() ? 'creado' : 'actualizado'}`);
      } else {
        this.log(`ERROR: ${result.error}`);
      }
    } else {
      this.isLoading.set(false);
      this.log('ERROR: Formulario inválido');
    }
  }

  getMensajeFormFields(): FormFieldConfig[] {
    return [
      {
        name: 'remitenteId',
        type: 'select',
        label: 'Remitente',
        placeholder: 'Seleccionar remitente',
        options: this.usuarios().map(user => ({
          value: user.uid,
          label: `${user.nombre || user.email || user.uid} (${user.role})`
        })),
        colSpan: 1
      },
      {
        name: 'destinatarioId',
        type: 'select',
        label: 'Destinatario',
        placeholder: 'Seleccionar destinatario',
        options: this.usuarios().map(user => ({
          value: user.uid,
          label: `${user.nombre || user.email || user.uid} (${user.role})`
        })),
        colSpan: 1
      },
      {
        name: 'tipo',
        type: 'select',
        label: 'Tipo de Mensaje',
        placeholder: 'Seleccionar tipo',
        options: [
          { value: 'texto', label: 'Texto' },
          { value: 'imagen', label: 'Imagen' },
          { value: 'video', label: 'Video' },
          { value: 'audio', label: 'Audio' }
        ],
        colSpan: 2
      },
      {
        name: 'contenido',
        type: 'textarea',
        label: 'Contenido',
        placeholder: 'Escribe el mensaje aquí...',
        rows: 4,
        colSpan: 2
      }
    ];
  }

  async deleteMensaje(id: string) {
    const result = await this.mensajeManager.delete(id);
    if (result.success) {
      this.log('Mensaje eliminado');
    } else {
      this.log(`ERROR: ${result.error}`);
    }
  }

  // ========================================
  // MÉTODOS PARA INVITACIONES
  // ========================================

  addInvitacion() {
    const newInvitacion = {
      id: 'inv-' + Date.now(),
      invitadorId: '',
      email: '',
      estado: 'pendiente' as const,
      mensaje: '',
      franjaHoraria: 'mañana' as 'mañana' | 'tarde' | 'noche',
      fechaEnvio: new Date()
    } as Invitacion;
    this.invitacionManager.openCreateModal(newInvitacion);
  }

  openInvitacionModal(item: any) {
    this.invitacionManager.openEditModal(item as Invitacion);
  }

  private createInvitacionEditForm(item: Invitacion): FormGroup {
    return this.fb.group({
      invitadorId: [item.invitadorId || '', Validators.required],
      email: [item.email || '', [Validators.required, Validators.email]],
      mensaje: [item.mensaje || ''],
      franjaHoraria: [item.franjaHoraria || 'mañana', Validators.required]
    });
  }

  async saveInvitacion() {
    this.isLoading.set(true);
    const result = await this.invitacionManager.save({
      estado: 'pendiente' as const,
      fechaEnvio: new Date()
    });
    this.isLoading.set(false);
    
    if (result.success) {
      this.log(`Invitación ${this.invitacionManager.isCreating() ? 'creada' : 'actualizada'}`);
    } else {
      this.log(`ERROR: ${result.error}`);
    }
  }

  getInvitacionFormFields(): FormFieldConfig[] {
    return [
      {
        name: 'invitadorId',
        type: 'select',
        label: 'Invitador',
        placeholder: 'Seleccionar invitador',
        options: this.usuarios().map(user => ({
          value: user.uid,
          label: `${user.nombre || user.email || user.uid} (${user.role})`
        })),
        colSpan: 1
      },
      {
        name: 'email',
        type: 'text',
        label: 'Email del Invitado',
        placeholder: 'ejemplo@email.com',
        colSpan: 1
      },
      {
        name: 'franjaHoraria',
        type: 'select',
        label: 'Franja Horaria',
        placeholder: 'Seleccionar franja horaria',
        options: [
          { value: 'mañana', label: 'Mañana (6:00 - 12:00)' },
          { value: 'tarde', label: 'Tarde (12:00 - 18:00)' },
          { value: 'noche', label: 'Noche (18:00 - 23:00)' }
        ],
        colSpan: 2
      },
      {
        name: 'mensaje',
        type: 'textarea',
        label: 'Mensaje Personalizado',
        placeholder: 'Agrega un mensaje personal a la invitación (opcional)...',
        rows: 4,
        colSpan: 2
      }
    ];
  }

  async deleteInvitacion(id: string) {
    const result = await this.invitacionManager.delete(id);
    if (result.success) {
      this.log('Invitación eliminada');
    } else {
      this.log(`ERROR: ${result.error}`);
    }
  }

  async aceptarInvitacion(id: string) {
    try {
      await this.invitacionService.aceptar(id);
      this.log('Invitación aceptada');
    } catch (error) {
      this.log('ERROR al aceptar invitación');
    }
  }

  async rechazarInvitacion(id: string) {
    try {
      await this.invitacionService.rechazar(id);
      this.log('Invitación rechazada');
    } catch (error) {
      this.log('ERROR al rechazar invitación');
    }
  }
}
