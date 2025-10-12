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
  ConversacionService,
  AuthService,
  Notificacion,
  TipoNotificacion,
  Mensaje,
  TipoMensaje,
  Invitacion,
  Conversacion,
  Entrenador,
  Ejercicio,
  Rol 
} from 'gym-library';
import { GenericCardComponent } from '../../components/shared/generic-card/generic-card.component';
import { CardConfig } from '../../components/shared/generic-card/generic-card.types';
import { ModalFormComponent, FormFieldConfig } from '../../components/modal-form/modal-form.component';
import { ToastComponent } from '../../components/shared/toast/toast.component';
import { EntrenadorStatsComponent } from '../../components/entrenador-stats/entrenador-stats.component';
import { ToastService } from '../../services/toast.service';
import { GenericModalManager } from '../../helpers/modal-manager.helper';
import { DisplayHelperService } from '../../services/display-helper.service';
import { PageTitleService } from '../../services/page-title.service';

@Component({
  selector: 'app-entrenadores-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenericCardComponent,
    ModalFormComponent,
    ToastComponent,
    EntrenadorStatsComponent
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
  private readonly conversacionService = inject(ConversacionService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly displayHelper = inject(DisplayHelperService);
  readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);

  // Modal managers para mensajes e invitaciones
  readonly mensajeManager: GenericModalManager<Mensaje>;
  readonly invitacionManager: GenericModalManager<Invitacion>;

  constructor() {
    this.pageTitleService.setTitle('Entrenadores');
    // Inicializar modal managers
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

  readonly entrenadoresBase = computed(() => {
    return this.entrenadorService.entrenadores().map(entrenador => {
      const usuario = this.usuarios().find(u => u.uid === entrenador.id);
      return {
        ...entrenador,
        displayName: usuario?.nombre || usuario?.email || `Usuario ${entrenador.id}`
      };
    });
  });

  readonly entrenadores = computed(() => {
    return this.entrenadoresBase().map(entrenador => {
      const ejerciciosCount = this.ejercicios().filter(e => e.creadorId === entrenador.id).length;
      const rutinasCount = this.rutinas().filter(r => r.creadorId === entrenador.id).length;
      const clientesCount = this.entrenadoService.entrenados().filter(e => e.entrenadorId === entrenador.id).length;
      
      return {
        ...entrenador,
        ejerciciosCount,
        rutinasCount,
        clientesCount
      };
    });
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

  // Computed para ejercicios filtrados por el entrenador actual en el modal de rutina
  readonly ejerciciosFiltradosParaRutina = computed(() => {
    const rutinaData = this.rutinaModalData();
    const creadorId = rutinaData?.creadorId;
    
    if (!creadorId) {
      return this.ejercicios();
    }
    
    return this.ejercicios().filter(ej => 
      ej.creadorId === creadorId && ej.creadorTipo === 'entrenador'
    );
  });

  // Computed para obtener los IDs de los ejercicios seleccionados en la rutina
  readonly ejerciciosSeleccionadosIds = computed(() => {
    const rutinaData = this.rutinaModalData();
    if (!rutinaData?.ejercicios) return [];
    
    // Los ejercicios pueden venir como objetos completos o como IDs
    return rutinaData.ejercicios.map((ej: Ejercicio | string) => 
      typeof ej === 'string' ? ej : ej.id
    );
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

  // Configuración de los cards
  readonly entrenadoresCardConfig: CardConfig = {
    title: 'Entrenadores',
    createButtonText: 'Crear Entrenador',
    createButtonColor: 'blue',
    emptyStateTitle: 'No hay entrenadores',
    displayField: 'displayName',
    showCounter: true,
    counterColor: 'blue',
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

  readonly mensajesCardConfig: CardConfig = {
    title: 'Mensajes de Entrenadores',
    createButtonText: 'N/A',
    createButtonColor: 'purple',
    emptyStateTitle: 'No hay mensajes de entrenadores',
    displayField: 'titulo',
    showCounter: true,
    counterColor: 'purple',
    showChips: ['remitenteChip', 'destinatarioChip'],
    showArrowBetweenChips: true
  };

  // Signals para el estado del componente
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

  // Signals para modal de selección de contenido
  readonly isContentModalOpen = signal(false);

  // Signals para mensajes (desde el servicio)
  readonly mensajes = computed(() => {
    return this.mensajeService.mensajes().map(mensaje => {
      const remitente = this.usuarios().find(u => u.uid === mensaje.remitenteId);
      const destinatario = this.usuarios().find(u => u.uid === mensaje.destinatarioId);
      
      const remitenteNombre = remitente?.nombre || remitente?.email || `Usuario ${mensaje.remitenteId}`;
      const destinatarioNombre = destinatario?.nombre || destinatario?.email || `Usuario ${mensaje.destinatarioId}`;
      
      // Mostrar solo el tipo de mensaje
      const titulo = mensaje.tipo || 'texto';
      
      return {
        ...mensaje,
        titulo,
        remitenteChip: remitenteNombre,
        destinatarioChip: destinatarioNombre
      };
    });
  });

  // Mensajes filtrados: solo mostrar mensajes donde el remitente es ENTRENADOR
  readonly mensajesFiltrados = computed(() => {
    return this.mensajes().filter(mensaje => {
      const remitente = this.usuarios().find(u => u.uid === mensaje.remitenteId);
      return remitente?.role === Rol.ENTRENADOR;
    });
  });

  // Signals para invitaciones (desde el servicio)

  openDetailsModal(item: any) {
    this.modalData.set(item);
    this.isModalOpen.set(true);
    this.isCreating.set(false);
    this.createEditForm(item);
    
    // Actualizar el control de clientes después de crear el form
    const clientesEntrenador = this.getEntrenadosByEntrenador(item.id);
    const clientesText = clientesEntrenador.length > 0 
      ? clientesEntrenador.map(entrenado => {
          const usuario = this.usuarios().find(u => u.uid === entrenado.id);
          return usuario?.nombre || usuario?.email || `Cliente ${entrenado.id}`;
        }).join('\n')
      : 'No hay clientes asignados';
    
    this.editForm()?.get('clientesAsignados')?.setValue(clientesText);
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
      
      this.toastService.log(`Entrenador ${this.isCreating() ? 'creado' : 'actualizado'}: ${usuarioEntrenadorNombre} - Gimnasio: ${gimnasioEntrenadorNombre} - Entrenados: ${clientesCount} - Rutinas: ${rutinasCount}`);
      
      this.closeModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      this.toastService.log(`Error al guardar los cambios: ${error}`);
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
    console.log('getFormFields called with entrenadorData:', entrenadorData);
    
    // Si no hay datos, retornar array vacío
    if (!entrenadorData || !entrenadorData.id) {
      console.log('No entrenadorData or id, returning empty array');
      return [];
    }
    
    const usuarioEntrenador = this.usuarios().find(u => u.uid === entrenadorData.id);
    const clientesEntrenador = this.getEntrenadosByEntrenador(entrenadorData.id);
    console.log('clientesEntrenador:', clientesEntrenador);
    const rutinasEntrenador = this.getRutinasByEntrenador(entrenadorData.id);
    const ejerciciosEntrenador = this.getEjerciciosByEntrenador(entrenadorData.id);
    const gimnasioInfo = entrenadorData.gimnasioId ? this.getGimnasioInfo(entrenadorData.gimnasioId) : null;
    
    // Obtener notificaciones relacionadas con mensajes del entrenador (solo no leídas)
    const notificacionesEntrenador = this.getNotificacionesMensajesEntrenador(entrenadorData.id).filter(n => !n.leida);
    
    // Obtener conversaciones del entrenador
    const conversacionesEntrenador = this.getConversacionesEntrenador(entrenadorData.id);
    
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
        name: 'notificacionesMensajes',
        type: 'notificaciones-mensajes',
        label: 'Notificaciones de Mensajes',
        colSpan: 2,
        notificaciones: notificacionesEntrenador
      },
      {
        name: 'conversaciones',
        type: 'conversaciones',
        label: 'Conversaciones',
        colSpan: 2,
        conversaciones: conversacionesEntrenador
      },
      {
        name: 'clientesAsignados',
        type: 'textarea',
        label: `Entrenados Asignados (${clientesEntrenador.length})`,
        colSpan: 2,
        readonly: true,
        rows: 5,
        placeholder: clientesEntrenador.length > 0 
          ? clientesEntrenador.map(entrenado => {
              const usuario = this.usuarios().find(u => u.uid === entrenado.id);
              return usuario?.nombre || usuario?.email || `Cliente ${entrenado.id}`;
            }).join('\n')
          : 'No hay clientes asignados'
      },
      {
        name: 'rutinasAsociadas',
        type: 'rutinas-info',
        label: `Rutinas del Entrenador (${rutinasEntrenador.length})`,
        colSpan: 2,
        rutinas: rutinasEntrenador.map(rutina => ({
          ...rutina,
          asignadoNombre: this.usuarios().find(u => u.uid === rutina.asignadoId)?.nombre || 'Sin asignar'
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
    
    // Obtener el primer entrenador disponible como creador por defecto
    const primerEntrenador = this.entrenadores()[0];
    
    return {
      id: 'e' + timestamp,
      nombre: '',
      series: 1,
      repeticiones: 1,
      peso: 0,
      serieSegundos: 0,
      descansoSegundos: 0,
      descripcion: '',
      creadorId: primerEntrenador?.id || '',
      creadorTipo: 'entrenador'
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
      
      // Si se especificó un creadorId, buscar su rol y establecer creadorTipo
      if (updatedData.creadorId) {
        const creador = this.usuarios().find(u => u.uid === updatedData.creadorId);
        if (creador && creador.role) {
          updatedData.creadorTipo = creador.role.toLowerCase();
        }
      } else {
        // Si no hay creadorId, eliminar también creadorTipo
        delete updatedData.creadorTipo;
      }
      
      await this.ejercicioService.save(updatedData);
      
      let logMessage = `Ejercicio ${this.isEjercicioCreating() ? 'creado' : 'actualizado'}: ${updatedData.nombre}`;
      
      if (updatedData.creadorId) {
        const creador = this.usuarios().find(u => u.uid === updatedData.creadorId);
        logMessage += ` - Creador: ${creador?.nombre || creador?.email || updatedData.creadorId}`;
      }
      
      this.toastService.log(logMessage);
      
      this.closeEjercicioModal();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      this.toastService.log(`ERROR al guardar ejercicio: ${error.message}`);
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
        label: 'Entrenador Creador',
        placeholder: 'Seleccionar entrenador',
        options: [
          { value: '', label: '-- Seleccionar entrenador --' },
          ...this.usuarios()
            .filter(user => user.role === Rol.ENTRENADOR)
            .map(user => ({
              value: user.uid,
              label: `${user.nombre || user.email || user.uid}`
            }))
        ],
        colSpan: 2
      }
    ];
  }
  
  // ========================================
  // MÉTODOS PARA RUTINAS
  // ========================================
  
  addRutinaParaEntrenador() {
    const entrenadorActual = this.modalData();
    if (!entrenadorActual || !entrenadorActual.id) {
      this.toastService.log('ERROR: Debe seleccionar un entrenador primero');
      return;
    }
    
    // Crear rutina con el entrenador ya seteado
    const timestamp = Date.now();
    const newItem = {
      id: 'r' + timestamp,
      nombre: '',
      diasSemana: [],
      descripcion: '',
      ejercicios: [],
      creadorId: entrenadorActual.id,
      asignadoId: ''
    };
    
    this.rutinaModalData.set(newItem);
    this.isRutinaModalOpen.set(true);
    this.isRutinaCreating.set(true);
    this.createRutinaEditForm(newItem);
  }

  addEjercicioParaEntrenador() {
    const entrenadorActual = this.modalData();
    if (!entrenadorActual || !entrenadorActual.id) {
      this.toastService.log('ERROR: Debe seleccionar un entrenador primero');
      return;
    }
    
    // Crear ejercicio con el entrenador como creador
    const timestamp = Date.now();
    const newItem = {
      id: 'ej-' + timestamp,
      nombre: '',
      descripcion: '',
      series: 3,
      repeticiones: 10,
      peso: 0,
      descansoSegundos: 60,
      serieSegundos: 30,
      creadorId: entrenadorActual.id,
      creadorTipo: Rol.ENTRENADOR,
      fechaCreacion: new Date()
    };
    
    this.ejercicioModalData.set(newItem);
    this.isEjercicioModalOpen.set(true);
    this.isEjercicioCreating.set(true);
    this.createEjercicioEditForm(newItem);
  }

  openCreateContentModal() {
    this.isContentModalOpen.set(true);
  }

  selectContentType(type: 'rutina' | 'ejercicio' | 'invitacion') {
    this.isContentModalOpen.set(false);
    
    if (type === 'rutina') {
      this.addRutinaParaEntrenador();
    } else if (type === 'ejercicio') {
      this.addEjercicioParaEntrenador();
    } else if (type === 'invitacion') {
      this.addInvitacionParaEntrenador();
    }
  }

  addInvitacionParaEntrenador() {
    const entrenadorActual = this.modalData();
    if (!entrenadorActual || !entrenadorActual.id) {
      this.toastService.log('ERROR: Debe seleccionar un entrenador primero');
      return;
    }
    
    // Crear invitación con el entrenador preseleccionado
    const newInvitacion = {
      id: 'inv-' + Date.now(),
      entrenadorId: entrenadorActual.id,
      entrenadoId: '',
      email: '',
      estado: 'pendiente',
      mensaje: '',
      franjaHoraria: 'mañana',
      fechaEnvio: new Date()
    };
    this.invitacionManager.openCreateModal(newInvitacion as any);
  }
  
  editarRutinaDesdeEntrenador(rutinaId: string) {
    console.log('🔍 Editando rutina:', rutinaId);
    console.log('📋 Rutinas disponibles:', this.rutinas());
    
    const rutina = this.rutinas().find(r => r.id === rutinaId);
    if (!rutina) {
      this.toastService.log('ERROR: Rutina no encontrada');
      console.error('❌ Rutina no encontrada con ID:', rutinaId);
      return;
    }
    
    console.log('✅ Rutina encontrada:', rutina);
    this.openRutinaModal(rutina);
  }
  
  addSampleRutina() {
    this.openCreateRutinaModal();
  }

  async deleteRutina(id: string) {
    await this.rutinaService.delete(id);
    this.toastService.log(`Rutina eliminada: ${id}`);
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
      
      // Limpiar campos undefined para evitar errores de Firestore
      const rutinaToSave: any = {
        id: updatedData.id,
        nombre: updatedData.nombre || '',
        descripcion: updatedData.descripcion || '',
        diasSemana: updatedData.diasSemana || [],
        ejercicios: updatedData.ejercicios || [],
        creadorId: updatedData.creadorId || '',
        asignadoId: updatedData.asignadoId || '',
        activa: updatedData.activa ?? true,
        completado: updatedData.completado ?? false,
        fechaAsignacion: updatedData.fechaAsignacion || new Date()
      };
      
      // Solo agregar entrenadoId si asignadoId existe y no está vacío
      if (rutinaToSave.asignadoId) {
        rutinaToSave.entrenadoId = rutinaToSave.asignadoId;
      }
      
      await this.rutinaService.save(rutinaToSave);
      
      let logMessage = `Rutina ${this.isRutinaCreating() ? 'creada' : 'actualizada'}: ${updatedData.nombre}`;
      
      if (updatedData.creadorId) {
        const creador = this.usuarios().find(u => u.uid === updatedData.creadorId);
        logMessage += ` - Creador: ${creador?.nombre || creador?.email || updatedData.creadorId}`;
      }
      
      if (updatedData.asignadoId) {
        const asignado = this.usuarios().find(u => u.uid === updatedData.asignadoId);
        logMessage += ` - Asignado a: ${asignado?.nombre || asignado?.email || updatedData.asignadoId}`;
      }
      
      this.toastService.log(logMessage);
      
      this.closeRutinaModal();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      this.toastService.log(`ERROR al guardar rutina: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  getRutinaFormFields(): FormFieldConfig[] {
    const rutinaData = this.rutinaModalData();
    const creadorId = rutinaData?.creadorId;
    
    // Filtrar ejercicios: solo mostrar los creados por el entrenador seleccionado
    const ejerciciosDelEntrenador = creadorId 
      ? this.ejercicios().filter(ej => ej.creadorId === creadorId && ej.creadorTipo === 'entrenador')
      : this.ejercicios();
    
    // Si el creadorId está seteado, obtener el nombre del entrenador
    const creadorNombre = creadorId 
      ? this.usuarios().find(u => u.uid === creadorId)?.nombre || 
        this.usuarios().find(u => u.uid === creadorId)?.email || 
        'Entrenador'
      : '';
    
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
        label: `Ejercicios Disponibles (${ejerciciosDelEntrenador.length})`,
        colSpan: 2,
        options: ejerciciosDelEntrenador.map(ejercicio => ({
          value: ejercicio.id,
          label: ejercicio.nombre,
          extra: `${ejercicio.series}x${ejercicio.repeticiones}`
        }))
      },
      {
        name: 'creadorId',
        type: 'text',
        label: 'Entrenador',
        placeholder: creadorNombre || 'Sin entrenador',
        readonly: true,
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


  addMensaje(remitenteId?: string) {
    // Si estamos editando un entrenador, usar su ID como remitente
    const entrenadorActual = this.modalData();
    const remitenteIdFinal = remitenteId || entrenadorActual?.id || '';
      
    const newMensaje = {
      id: 'm' + Date.now(),
      conversacionId: 'conv-' + Date.now(),
      remitenteId: remitenteIdFinal,
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

  responderMensaje(datos: any) {
    // Si recibimos un mensajeId directamente (desde botón de notificación)
    if (datos.mensajeId) {
      const mensaje = this.mensajes().find(m => m.id === datos.mensajeId);
      if (!mensaje) {
        this.toastService.log('ERROR: Mensaje no encontrado');
        return;
      }
      
      // Cerrar modales abiertos
      this.mensajeManager.closeModal();
      this.closeModal();
      
      // Crear un nuevo mensaje de respuesta con los datos invertidos
      const nuevoMensaje: Mensaje = {
        id: 'msg-' + Date.now(),
        conversacionId: mensaje.conversacionId, // Mantener el mismo conversacionId
        remitenteId: mensaje.destinatarioId,    // Invertir: quien recibió ahora envía
        remitenteTipo: mensaje.destinatarioTipo, // Invertir
        destinatarioId: mensaje.remitenteId,    // Invertir: quien envió ahora recibe
        destinatarioTipo: mensaje.remitenteTipo, // Invertir
        contenido: '',
        tipo: TipoMensaje.TEXTO,
        leido: false,
        entregado: false,
        fechaEnvio: new Date()
      };
      
      // Abrir el modal en modo creación con los datos pre-rellenados
      this.mensajeManager.openCreateModal(nuevoMensaje);
      return;
    }
    
    // Formato antiguo (desde modal de mensaje abierto)
    if (datos.conversacionId) {
      // Cerrar el modal actual
      this.mensajeManager.closeModal();
      
      // Crear un nuevo mensaje de respuesta con los datos invertidos
      const nuevoMensaje: Mensaje = {
        id: 'msg-' + Date.now(),
        conversacionId: datos.conversacionId, // Mantener el mismo conversacionId
        remitenteId: datos.remitenteId,       // Ya viene invertido del modal
        remitenteTipo: this.usuarios().find(u => u.uid === datos.remitenteId)?.role || Rol.ENTRENADOR,
        destinatarioId: datos.destinatarioId, // Ya viene invertido del modal
        destinatarioTipo: this.usuarios().find(u => u.uid === datos.destinatarioId)?.role || Rol.ENTRENADO,
        contenido: '',
        tipo: TipoMensaje.TEXTO,
        leido: false,
        entregado: false,
        fechaEnvio: new Date()
      };
      
      // Abrir el modal en modo creación con los datos pre-rellenados
      this.mensajeManager.openCreateModal(nuevoMensaje);
    }
  }

  private createMensajeEditForm(item: Mensaje): any {
    // Si el remitenteId ya está pre-rellenado (viene del botón del modal), deshabilitar el campo
    const remitenteDisabled = !!item.remitenteId;
    
    const formConfig = {
      remitenteId: [
        { value: item.remitenteId || '', disabled: remitenteDisabled },
        Validators.required
      ],
      destinatarioId: [item.destinatarioId || '', Validators.required],
      contenido: [item.contenido || '', Validators.required],
      tipo: [item.tipo || 'texto', Validators.required]
    };
    
    return formConfig;
  }

  async saveMensaje() {
    this.isLoading.set(true);
    
    const form = this.mensajeManager.editForm();
    if (form) {
      // Usar getRawValue() para obtener también los campos deshabilitados
      const formValues = form.getRawValue();
      
      // Validar que se haya seleccionado un destinatario
      if (!formValues.destinatarioId) {
        this.isLoading.set(false);
        this.toastService.log('ERROR: Debe seleccionar un destinatario');
        return;
      }
      
      const remitenteUser = this.usuarios().find(u => u.uid === formValues.remitenteId);
      const destinatarioUser = this.usuarios().find(u => u.uid === formValues.destinatarioId);
      
      const isCreating = this.mensajeManager.isCreating();
      const mensajeActual = this.mensajeManager.modalData();
      
      const result = await this.mensajeManager.save({
        remitenteTipo: remitenteUser?.role || Rol.ENTRENADOR,
        destinatarioTipo: destinatarioUser?.role || Rol.ENTRENADO,
        leido: false,
        entregado: true,
        fechaEnvio: new Date()
      });
      
      this.isLoading.set(false);
      
      if (result.success) {
        // Actualizar o crear conversación
        if (isCreating && mensajeActual?.id) {
          await this.actualizarOCrearConversacion(
            mensajeActual.conversacionId,
            formValues.remitenteId,
            formValues.destinatarioId,
            remitenteUser?.role || Rol.ENTRENADOR,
            destinatarioUser?.role || Rol.ENTRENADO,
            mensajeActual.contenido
          );
        }
        
        // Si es un mensaje nuevo, crear notificación automáticamente
        if (isCreating && mensajeActual?.id) {
          try {
            const remitenteNombre = remitenteUser?.nombre || remitenteUser?.email || 'Usuario';
            
            const notificacion: Notificacion = {
              id: 'notif-' + Date.now(),
              usuarioId: formValues.destinatarioId, // La notificación es para el destinatario
              tipo: TipoNotificacion.MENSAJE_NUEVO,
              titulo: 'Nuevo mensaje',
              mensaje: `${remitenteNombre} te ha enviado un mensaje`,
              leida: false,
              fechaCreacion: new Date(),
              datos: {
                mensajeId: mensajeActual.id,
                remitenteId: formValues.remitenteId
              }
            };
            
            await this.notificacionService.save(notificacion);
          } catch (error) {
            console.error('Error al crear notificación:', error);
          }
        }
        
        this.toastService.log(`Mensaje ${isCreating ? 'creado' : 'actualizado'}`);
      } else {
        this.toastService.log(`ERROR: ${result.error}`);
      }
    } else {
      this.isLoading.set(false);
      this.toastService.log('ERROR: Formulario inválido');
    }
  }

  getMensajeFormFields(): FormFieldConfig[] {
    const fields: FormFieldConfig[] = [];

    // Si estamos viendo un mensaje (no creando), mostrar el hilo de conversación
    if (!this.mensajeManager.isCreating() && this.mensajeManager.modalData()) {
      const mensajeActual = this.mensajeManager.modalData();
      const conversacionId = mensajeActual?.conversacionId;

      if (conversacionId) {
        // Obtener todos los mensajes de la conversación
        const mensajesConversacion = this.mensajes()
          .filter(m => m.conversacionId === conversacionId)
          .sort((a, b) => {
            const fechaA = a.fechaEnvio instanceof Date ? a.fechaEnvio : new Date(a.fechaEnvio);
            const fechaB = b.fechaEnvio instanceof Date ? b.fechaEnvio : new Date(b.fechaEnvio);
            return fechaA.getTime() - fechaB.getTime();
          })
          .map(msg => {
            const remitente = this.usuarios().find(u => u.uid === msg.remitenteId);
            const usuarioActual = this.usuarios().find(u => u.uid === mensajeActual.destinatarioId);
            return {
              ...msg,
              remitenteNombre: remitente?.nombre || remitente?.email || 'Usuario',
              esPropio: msg.remitenteId === usuarioActual?.uid
            };
          });

        fields.push({
          name: 'conversacion-thread',
          type: 'conversacion-thread',
          label: '',
          colSpan: 2,
          mensajesConversacion
        });
      }
    }

    // Campos del formulario
    fields.push(
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
    );
    
    return fields;
  }

  async deleteMensaje(id: string) {
    try {
      // Primero eliminar el mensaje
      const result = await this.mensajeManager.delete(id);
      
      if (result.success) {
        // Luego eliminar todas las notificaciones relacionadas con este mensaje
        const todasNotificaciones = this.notificacionService.notificaciones();
        const notificacionesRelacionadas = todasNotificaciones.filter(notif => 
          notif.datos?.['mensajeId'] === id
        );
        
        // Eliminar cada notificación relacionada
        for (const notif of notificacionesRelacionadas) {
          await this.notificacionService.delete(notif.id);
        }
        
        this.toastService.log(`Mensaje eliminado (con ${notificacionesRelacionadas.length} notificación(es))`);
      } else {
        this.toastService.log(`ERROR: ${result.error}`);
      }
    } catch (error) {
      this.toastService.log('Error al eliminar mensaje');
      console.error('Error al eliminar mensaje:', error);
    }
  }

  // ========================================
  // MÉTODOS PARA CONVERSACIONES
  // ========================================

  async actualizarOCrearConversacion(
    conversacionId: string,
    remitenteId: string,
    destinatarioId: string,
    remitenteTipo: Rol,
    destinatarioTipo: Rol,
    ultimoMensaje: string
  ) {
    try {
      const conversacionExistente = this.conversacionService.conversaciones()
        .find(c => c.id === conversacionId);
      
      const entrenadorId = remitenteTipo === Rol.ENTRENADOR ? remitenteId : destinatarioId;
      const entrenadoId = remitenteTipo === Rol.ENTRENADO ? remitenteId : destinatarioId;
      
      if (conversacionExistente) {
        // Actualizar conversación existente
        await this.conversacionService.save({
          ...conversacionExistente,
          ultimoMensaje: ultimoMensaje.substring(0, 100), // Limitar longitud
          ultimoMensajeFecha: new Date(),
          fechaUltimaActividad: new Date(),
          // Incrementar contador de no leídos del destinatario
          noLeidosEntrenador: destinatarioTipo === Rol.ENTRENADOR 
            ? conversacionExistente.noLeidosEntrenador + 1 
            : conversacionExistente.noLeidosEntrenador,
          noLeidosEntrenado: destinatarioTipo === Rol.ENTRENADO
            ? conversacionExistente.noLeidosEntrenado + 1
            : conversacionExistente.noLeidosEntrenado
        });
      } else {
        // Crear nueva conversación
        const nuevaConversacion: Conversacion = {
          id: conversacionId,
          entrenadorId: entrenadorId,
          entrenadoId: entrenadoId,
          ultimoMensaje: ultimoMensaje.substring(0, 100),
          ultimoMensajeFecha: new Date(),
          noLeidosEntrenador: destinatarioTipo === Rol.ENTRENADOR ? 1 : 0,
          noLeidosEntrenado: destinatarioTipo === Rol.ENTRENADO ? 1 : 0,
          activa: true,
          fechaCreacion: new Date(),
          fechaUltimaActividad: new Date()
        };
        
        await this.conversacionService.save(nuevaConversacion);
      }
    } catch (error) {
      console.error('Error al actualizar conversación:', error);
    }
  }

  addInvitacion() {
    // Obtener el entrenador del modal actual
    const entrenadorActual = this.modalData();
    if (!entrenadorActual || !entrenadorActual.id) {
      this.toastService.log('ERROR: Debe seleccionar un entrenador primero');
      return;
    }

    const newInvitacion = {
      id: 'inv-' + Date.now(),
      entrenadorId: entrenadorActual.id,
      email: '',
      estado: 'pendiente',
      mensaje: '',
      franjaHoraria: 'mañana',
      fechaEnvio: new Date()
    };
    this.invitacionManager.openCreateModal(newInvitacion as any);
  }

  openInvitacionModal(item: any) {
    this.invitacionManager.openEditModal(item as Invitacion);
  }

  private createInvitacionEditForm(item: Invitacion): any {
    return {
      email: [item.email || '', [Validators.required, Validators.email]],
      mensaje: [item.mensaje || ''],
      franjaHoraria: [item.franjaHoraria || 'mañana', Validators.required]
    };
  }

  async saveInvitacion() {
    this.isLoading.set(true);
    
    const isCreating = this.invitacionManager.isCreating();
    const invitacionData = this.invitacionManager.editForm()?.getRawValue();
    
    const result = await this.invitacionManager.save({
      estado: 'pendiente' as const,
      fechaEnvio: new Date()
    });
    
    this.isLoading.set(false);
    
    if (result.success && isCreating && invitacionData) {
      // Crear notificación para el entrenado
      const entrenadorActual = this.authService.currentUser();
      const entrenadoId = invitacionData.entrenadoId;
      
      if (entrenadorActual && entrenadoId) {
        // Obtener el ID de la invitación recién creada del modal data
        const invitacionId = this.invitacionManager.modalData()?.id;
        
        const nuevaNotificacion: Notificacion = {
          id: 'not-inv-' + Date.now(),
          usuarioId: entrenadoId,  // Notificación para el entrenado
          tipo: TipoNotificacion.INVITACION,
          titulo: 'Nueva invitación de entrenador',
          mensaje: invitacionData.mensaje || '¡Un entrenador quiere trabajar contigo!',
          leida: false,
          fechaCreacion: new Date(),
          datos: {
            invitacionId: invitacionId,
            entrenadorId: entrenadorActual.uid,
            entrenadorNombre: entrenadorActual.nombre || entrenadorActual.email
          }
        };
        
        await this.notificacionService.save(nuevaNotificacion);
      }
      
      this.toastService.log('Invitación creada y notificación enviada');
    } else if (result.success) {
      this.toastService.log('Invitación actualizada');
    } else {
      this.toastService.log(`ERROR: ${result.error}`);
    }
  }

  getInvitacionFormFields(): FormFieldConfig[] {
    return [
      {
        name: 'email',
        type: 'text',
        label: 'Email del Invitado',
        placeholder: 'ejemplo@email.com',
        colSpan: 2
      },
      {
        name: 'franjaHoraria',
        type: 'select',
        label: 'Franja Horaria Preferida',
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
        placeholder: '¡Hola! Me gustaría ser tu entrenador...',
        rows: 4,
        colSpan: 2
      }
    ];
  }

  async deleteInvitacion(id: string) {
    const result = await this.invitacionManager.delete(id);
    if (result.success) {
      this.toastService.log('Invitación eliminada');
    } else {
      this.toastService.log(`ERROR: ${result.error}`);
    }
  }

  async aceptarInvitacion(id: string) {
    try {
      await this.invitacionService.aceptar(id);
      this.toastService.log('Invitación aceptada');
    } catch (error) {
      this.toastService.log('ERROR al aceptar invitación');
    }
  }

  async rechazarInvitacion(id: string) {
    try {
      await this.invitacionService.rechazar(id);
      this.toastService.log('Invitación rechazada');
    } catch (error) {
      this.toastService.log('ERROR al rechazar invitación');
    }
  }

  // ========================================
  // MÉTODOS PARA NOTIFICACIONES DE MENSAJES
  // ========================================
  
  getNotificacionesMensajesEntrenador(entrenadorId: string): any[] {
    if (!entrenadorId) return [];
    
    const todasLasNotificaciones = this.notificacionService.notificaciones();
    
    const mensajesDelEntrenador = this.mensajes().filter(m => 
      m.destinatarioId === entrenadorId || m.remitenteId === entrenadorId
    );
    
    const notificacionesDelEntrenador = todasLasNotificaciones.filter((notif: Notificacion) => {
      const esParaEsteEntrenador = notif.usuarioId === entrenadorId;
      
      const tipoStr = String(notif.tipo).toLowerCase();
      const tituloStr = String(notif.titulo).toLowerCase();
      const esRelacionadaConMensajes = 
        tipoStr.includes('mensaje') || 
        tituloStr.includes('mensaje');
      
      return esParaEsteEntrenador && esRelacionadaConMensajes;
    });
    
    return notificacionesDelEntrenador.map((notif: Notificacion) => {
      const mensajeId = notif.datos?.['mensajeId'];
      const mensajeInfo = mensajeId 
        ? mensajesDelEntrenador.find(m => m.id === mensajeId)
        : mensajesDelEntrenador.find(m => 
            m.destinatarioId === entrenadorId || m.remitenteId === entrenadorId
          );

      let noLeidos = 0;
      if (mensajeInfo?.conversacionId) {
        const conversacion = this.conversacionService.conversaciones().find(c => c.id === mensajeInfo.conversacionId);
        if (conversacion) {
          const usuario = this.usuarios().find(u => u.uid === entrenadorId);
          noLeidos = usuario?.role === Rol.ENTRENADOR 
            ? conversacion.noLeidosEntrenador 
            : conversacion.noLeidosEntrenado;
        }
      }
      
      if (mensajeInfo) {
        const remitente = this.usuarios().find(u => u.uid === mensajeInfo.remitenteId);
        return {
          ...notif,
          noLeidos,
          mensajeInfo: {
            id: mensajeInfo.id,
            remitenteNombre: remitente?.nombre || remitente?.email || 'Usuario desconocido'
          }
        };
      }
      
      return { ...notif, noLeidos };
    });
  }

  getConversacionesEntrenador(entrenadorId: string) {
    
    if (!entrenadorId) {
      console.error('⚠️ No hay entrenadorId, retornando array vacío');
      return [];
    }
    
    // Obtener todas las conversaciones donde participa el entrenador
    const todasConversaciones = this.conversacionService.conversaciones();
    
    const conversaciones = todasConversaciones.filter(c => c.entrenadorId === entrenadorId);
    const resultado = conversaciones.map(conversacion => {
      // Obtener información del entrenado
      const entrenado = this.usuarios().find(u => u.uid === conversacion.entrenadoId);
      
      // Obtener todos los mensajes de esta conversación
      const mensajes = this.mensajeService.mensajes()
        .filter(m => m.conversacionId === conversacion.id)
        .sort((a, b) => {
          const fechaA = a.fechaEnvio instanceof Date ? a.fechaEnvio : new Date(a.fechaEnvio);
          const fechaB = b.fechaEnvio instanceof Date ? b.fechaEnvio : new Date(b.fechaEnvio);
          return fechaA.getTime() - fechaB.getTime();
        });
      
      return {
        id: conversacion.id,
        participantes: {
          entrenado: entrenado ? (entrenado.displayName || entrenado.nombre || 'Entrenado') : 'Entrenado',
          entrenadorId: conversacion.entrenadorId,
          entrenadoId: conversacion.entrenadoId
        },
        ultimoMensaje: conversacion.ultimoMensaje,
        ultimoMensajeFecha: conversacion.ultimoMensajeFecha,
        noLeidos: conversacion.noLeidosEntrenador,
        fechaUltimaActividad: conversacion.fechaUltimaActividad,
        mensajes: mensajes
      };
    }).sort((a, b) => {
      const fechaA = a.fechaUltimaActividad instanceof Date ? a.fechaUltimaActividad : new Date(a.fechaUltimaActividad);
      const fechaB = b.fechaUltimaActividad instanceof Date ? b.fechaUltimaActividad : new Date(b.fechaUltimaActividad);
      return fechaB.getTime() - fechaA.getTime();
    });
    
    return resultado;
  }

  async marcarNotificacionComoLeida(notifId: string) {
    try {
      // Marcar la notificación como leída usando el método del servicio
      await this.notificacionService.marcarComoLeida(notifId);
      
      this.toastService.log('✓ Notificación marcada como leída');
    } catch (error) {
      this.toastService.log('ERROR al marcar notificación como leída');
      console.error('Error al marcar notificación como leída:', error);
    }
  }

  abrirMensaje(mensajeId: string) {
    const mensaje = this.mensajes().find(m => m.id === mensajeId);
    if (mensaje) {
      // Marcar notificación como leída
      this.marcarNotificacionesComoLeidas(mensajeId);
      
      // Decrementar contador de no leídos en la conversación
      if (mensaje.conversacionId) {
        this.decrementarNoLeidos(mensaje.conversacionId, mensaje.destinatarioId);
      }
      
      // En lugar de abrir el modal de edición, solo mostramos la conversación
      // El usuario puede usar el botón "Responder" desde las notificaciones para responder
      this.toastService.log('✓ Mensaje marcado como leído. Usa "Responder" para contestar.');
    } else {
      this.toastService.log('ERROR: Mensaje no encontrado');
    }
  }

  abrirConversacion(conversacionId: string) {
    // Obtener la conversación
    const conversacion = this.conversacionService.conversaciones().find(c => c.id === conversacionId);
    if (!conversacion) {
      this.toastService.log('Conversación no encontrada');
      return;
    }

    // Obtener todos los mensajes de la conversación
    const mensajes = this.mensajes()
      .filter(m => m.conversacionId === conversacionId)
      .sort((a, b) => {
        const fechaA = a.fechaEnvio instanceof Date ? a.fechaEnvio : new Date(a.fechaEnvio);
        const fechaB = b.fechaEnvio instanceof Date ? b.fechaEnvio : new Date(b.fechaEnvio);
        return fechaA.getTime() - fechaB.getTime();
      });

    if (mensajes.length === 0) {
      this.toastService.log('No hay mensajes en esta conversación');
      return;
    }

    // Abrir el modal del primer mensaje para mostrar el hilo completo
    this.openMensajeModal(mensajes[0]);
  }

  async marcarConversacionLeida(conversacionId: string) {
    // Obtener la conversación
    const conversacion = this.conversacionService.conversaciones().find(c => c.id === conversacionId);
    if (!conversacion) {
      this.toastService.log('Conversación no encontrada');
      return;
    }

    // Resetear el contador de no leídos del entrenado (ya que estamos en la página de entrenadores)
    await this.conversacionService.save({
      ...conversacion,
      noLeidosEntrenado: 0
    });

    // Marcar todas las notificaciones relacionadas con esta conversación como leídas
    const notificacionesConversacion = this.notificacionService.notificaciones()
      .filter(n => {
        const mensajeId = n.datos?.['mensajeId'];
        if (!mensajeId) return false;
        const mensaje = this.mensajes().find(m => m.id === mensajeId);
        return mensaje?.conversacionId === conversacionId && !n.leida;
      });
    
    for (const notif of notificacionesConversacion) {
      await this.notificacionService.save({ ...notif, leida: true });
    }

    this.toastService.log('✓ Conversación marcada como leída');
  }

  responderConversacion(conversacionId: string) {
    // Obtener la conversación
    const conversacion = this.conversacionService.conversaciones().find(c => c.id === conversacionId);
    if (!conversacion) {
      this.toastService.log('Conversación no encontrada');
      return;
    }

    // Cerrar el modal principal si está abierto
    this.closeModal();

    // Crear un nuevo mensaje de respuesta
    // En la página de entrenadores, el entrenado responde al entrenador
    const nuevoMensaje: Mensaje = {
      id: 'msg-' + Date.now(),
      conversacionId: conversacion.id,
      remitenteId: conversacion.entrenadoId,
      remitenteTipo: Rol.ENTRENADO,
      destinatarioId: conversacion.entrenadorId,
      destinatarioTipo: Rol.ENTRENADOR,
      contenido: '',
      tipo: TipoMensaje.TEXTO,
      leido: false,
      entregado: false,
      fechaEnvio: new Date()
    };

    // Abrir el modal en modo creación con los datos pre-rellenados
    this.mensajeManager.openCreateModal(nuevoMensaje);
  }

  private async marcarNotificacionesComoLeidas(mensajeId: string) {
    const notificacionesMensaje = this.notificacionService.notificaciones()
      .filter(n => n.datos?.['mensajeId'] === mensajeId && !n.leida);
    
    for (const notif of notificacionesMensaje) {
      await this.notificacionService.save({ ...notif, leida: true });
    }
  }

  private async decrementarNoLeidos(conversacionId: string, destinatarioId: string) {
    const conversacion = this.conversacionService.conversaciones().find(c => c.id === conversacionId);
    if (!conversacion) return;
    
    const destinatario = this.usuarios().find(u => u.uid === destinatarioId);
    if (!destinatario) return;
    
    // Decrementar el contador según el rol del destinatario
    if (destinatario.role === Rol.ENTRENADOR && conversacion.noLeidosEntrenador > 0) {
      await this.conversacionService.save({
        ...conversacion,
        noLeidosEntrenador: conversacion.noLeidosEntrenador - 1
      });
    } else if (destinatario.role === Rol.ENTRENADO && conversacion.noLeidosEntrenado > 0) {
      await this.conversacionService.save({
        ...conversacion,
        noLeidosEntrenado: conversacion.noLeidosEntrenado - 1
      });
    }
  }
}
