import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  EntrenadoService, 
  UserService, 
  GimnasioService, 
  EntrenadorService, 
  RutinaService, 
  EjercicioService, 
  NotificacionService,
  MensajeService,
  ConversacionService,
  Notificacion,
  Mensaje,
  Conversacion,
  Entrenado, 
  Rol, 
  Objetivo,
  TipoNotificacion,
  TipoMensaje
} from 'gym-library';
import { GenericCardComponent } from '../../components/shared/generic-card/generic-card.component';
import { CardConfig } from '../../components/shared/generic-card/generic-card.types';
import { ModalFormComponent, FormFieldConfig } from '../../components/modal-form/modal-form.component';
import { ToastService } from '../../services/toast.service';
import { GenericModalManager } from '../../helpers/modal-manager.helper';
import { DisplayHelperService } from '../../services/display-helper.service';

@Component({
  selector: 'app-entrenados-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenericCardComponent,
    ModalFormComponent
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
  private readonly rutinaService = inject(RutinaService);
  private readonly ejercicioService = inject(EjercicioService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly mensajeService = inject(MensajeService);
  private readonly conversacionService = inject(ConversacionService);
  private readonly fb = inject(FormBuilder);
  readonly toastService = inject(ToastService);
  private readonly displayHelper = inject(DisplayHelperService);

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

  readonly mensajesCardConfig: CardConfig = {
    title: 'Mensajes de Entrenados',
    createButtonText: 'N/A',
    createButtonColor: 'purple',
    emptyStateTitle: 'No hay mensajes de entrenados',
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

  // Signals para mensajes
  readonly isMensajeModalOpen = signal(false);
  readonly mensajeModalData = signal<any>(null);
  readonly mensajeEditForm = signal<FormGroup | null>(null);
  readonly isMensajeCreating = signal(false);

  // Signals para mensajes (desde el servicio)
  readonly mensajes = computed(() => {
    return this.mensajeService.mensajes().map(mensaje => {
      const remitente = this.usuarios().find(u => u.uid === mensaje.remitenteId);
      const destinatario = this.usuarios().find(u => u.uid === mensaje.destinatarioId);
      
      const remitenteNombre = remitente?.nombre || remitente?.email || `Usuario ${mensaje.remitenteId}`;
      const destinatarioNombre = destinatario?.nombre || destinatario?.email || `Usuario ${mensaje.destinatarioId}`;
      
      // Generar título mostrando solo el tipo de mensaje
      let titulo = 'texto';
      switch (mensaje.tipo) {
        case 'texto':
          titulo = 'texto';
          break;
        case 'imagen':
          titulo = 'imagen';
          break;
        case 'video':
          titulo = 'video';
          break;
        case 'audio':
          titulo = 'audio';
          break;
        default:
          titulo = 'texto';
      }
      
      return {
        ...mensaje,
        titulo,
        remitenteChip: remitenteNombre,
        destinatarioChip: destinatarioNombre
      };
    });
  });

  // Mensajes filtrados: solo mostrar mensajes donde el remitente es ENTRENADO
  readonly mensajesFiltrados = computed(() => {
    return this.mensajes().filter(mensaje => {
      const remitente = this.usuarios().find(u => u.uid === mensaje.remitenteId);
      return remitente?.role === Rol.ENTRENADO;
    });
  });

  async deleteEntrenado(id: string) {
    await this.entrenadoService.delete(id);
    this.toastService.log(`Entrenado eliminado: ${id}`);
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
      delete clienteDataToSave.rutinasAsociadas;
      
      await this.entrenadoService.save(clienteDataToSave);
      
      const usuarioNombre = this.usuarios().find(u => u.uid === updatedData.id)?.nombre || updatedData.id;
      const gimnasioNombre = this.usuarios().find(u => u.uid === updatedData.gimnasioId)?.nombre || 'Gimnasio desconocido';
      const entrenadorClienteNombre = this.usuarios().find(u => u.uid === updatedData.entrenadorId)?.nombre || 'Entrenador desconocido';
      
      this.toastService.log(`Cliente ${this.isCreating() ? 'creado' : 'actualizado'}: ${usuarioNombre} - Gimnasio: ${gimnasioNombre} - Entrenador: ${entrenadorClienteNombre}`);
      
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

  getRutinasAsignadasAlCliente(clienteId: string) {
    // Por ahora retorna array vacío, puedes implementar la lógica completa después
    return [];
  }

  getFormFields(): FormFieldConfig[] {
    const clienteData = this.modalData();
    
    // Si no hay datos, retornar array vacío
    if (!clienteData || !clienteData.id) {
      return [];
    }
    
    const usuarioAsociado = this.usuarios().find(u => u.uid === clienteData?.id);
    const rutinasAsignadasAlCliente = this.getRutinasAsignadasAlCliente(clienteData?.id || '');
    const gimnasioAsociado = clienteData?.gimnasioId ? this.gimnasios().find(g => g.id === clienteData.gimnasioId) : null;
    const entrenadorAsociado = clienteData?.entrenadorId ? this.entrenadores().find(e => e.id === clienteData.entrenadorId) : null;
    
    // Obtener notificaciones relacionadas con mensajes del entrenado (SOLO NO LEÍDAS)
    const notificacionesEntrenado = this.getNotificacionesMensajesEntrenado(clienteData.id).filter(n => !n.leida);
    
    // Obtener conversaciones del entrenado
    const conversacionesEntrenado = this.getConversacionesEntrenado(clienteData.id);
    
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
        name: 'notificacionesMensajes',
        type: 'notificaciones-mensajes',
        label: 'Notificaciones Pendientes',
        colSpan: 2,
        notificaciones: notificacionesEntrenado
      },
      {
        name: 'conversaciones',
        type: 'conversaciones',
        label: 'Conversaciones',
        colSpan: 2,
        conversaciones: conversacionesEntrenado
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
    this.toastService.log(`Ejercicio eliminado: ${id}`);
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
  // MÉTODOS PARA MENSAJES
  // ========================================

  addMensaje(remitenteId?: string) {
    // Si estamos editando un entrenado, usar su ID como remitente
    const entrenadoActual = this.modalData();
    const remitenteIdFinal = remitenteId || entrenadoActual?.id || '';
    
    this.openCreateMensajeModal(remitenteIdFinal);
  }

  openCreateMensajeModal(remitenteId: string = '') {
    const newMensaje = {
      id: 'm' + Date.now(),
      conversacionId: 'conv-' + Date.now(),
      remitenteId: remitenteId,
      remitenteTipo: 'entrenado',
      destinatarioId: '',
      destinatarioTipo: 'entrenador',
      contenido: '',
      tipo: 'texto',
      leido: false,
      entregado: false,
      fechaEnvio: new Date()
    };
    
    this.mensajeModalData.set(newMensaje);
    this.isMensajeModalOpen.set(true);
    this.isMensajeCreating.set(true);
    this.createMensajeEditForm(newMensaje);
  }

  openMensajeModal(item: any) {
    this.mensajeModalData.set(item);
    this.isMensajeModalOpen.set(true);
    this.isMensajeCreating.set(false);
    this.createMensajeEditForm(item);
  }

  closeMensajeModal() {
    this.isMensajeModalOpen.set(false);
    this.mensajeModalData.set(null);
    this.mensajeEditForm.set(null);
    this.isMensajeCreating.set(false);
  }

  responderMensaje(datos: any) {
    // Si recibimos un mensajeId directamente (desde botón de notificación)
    if (datos.mensajeId) {
      const mensaje = this.mensajeService.mensajes().find(m => m.id === datos.mensajeId);
      
      if (!mensaje) {
        this.toastService.log('Mensaje no encontrado');
        return;
      }
      
      // Cerrar modales abiertos
      this.closeMensajeModal();
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
      this.mensajeModalData.set(nuevoMensaje);
      this.isMensajeModalOpen.set(true);
      this.isMensajeCreating.set(true);
      this.createMensajeEditForm(nuevoMensaje);
      return;
    }
    
    // Formato antiguo (desde modal de mensaje abierto)
    if (datos.conversacionId) {
      // Cerrar el modal actual
      this.closeMensajeModal();
      
      // Crear un nuevo mensaje de respuesta con los datos invertidos
      const nuevoMensaje: Mensaje = {
        id: 'msg-' + Date.now(),
        conversacionId: datos.conversacionId, // Mantener el mismo conversacionId
        remitenteId: datos.remitenteId,       // Ya viene invertido del modal
        remitenteTipo: this.usuarios().find(u => u.uid === datos.remitenteId)?.role || Rol.ENTRENADO,
        destinatarioId: datos.destinatarioId, // Ya viene invertido del modal
        destinatarioTipo: this.usuarios().find(u => u.uid === datos.destinatarioId)?.role || Rol.ENTRENADOR,
        contenido: '',
        tipo: TipoMensaje.TEXTO,
        leido: false,
        entregado: false,
        fechaEnvio: new Date()
      };
      
      // Abrir el modal en modo creación con los datos pre-rellenados
      this.mensajeModalData.set(nuevoMensaje);
      this.isMensajeModalOpen.set(true);
      this.isMensajeCreating.set(true);
      this.createMensajeEditForm(nuevoMensaje);
    }
  }

  private createMensajeEditForm(item: any) {
    // Si el remitenteId ya está pre-rellenado (viene del botón del modal), deshabilitar el campo
    const remitenteDisabled = !!item.remitenteId;
    
    const formConfig: any = {
      remitenteId: [
        { value: item.remitenteId || '', disabled: remitenteDisabled },
        Validators.required
      ],
      destinatarioId: [item.destinatarioId || '', Validators.required],
      contenido: [item.contenido || '', Validators.required],
      tipo: [item.tipo || 'texto', Validators.required]
    };
    
    this.mensajeEditForm.set(this.fb.group(formConfig));
  }

  async saveMensajeChanges() {
    const form = this.mensajeEditForm();
    const originalData = this.mensajeModalData();

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
      // Usar getRawValue() para obtener también los campos deshabilitados
      const formValues = form.getRawValue();
      const remitenteUser = this.usuarios().find(u => u.uid === formValues.remitenteId);
      const destinatarioUser = this.usuarios().find(u => u.uid === formValues.destinatarioId);

      // Validar que hay un destinatario
      if (!formValues.destinatarioId) {
        this.toastService.log('Error: Debes seleccionar un destinatario');
        this.isLoading.set(false);
        return;
      }

      const updatedData = { 
        ...originalData, 
        ...formValues,
        remitenteTipo: remitenteUser?.role || 'entrenador',
        destinatarioTipo: destinatarioUser?.role || 'entrenado',
        leido: false,
        entregado: true,
        fechaEnvio: new Date()
      };
      
      await this.mensajeService.save(updatedData);
      
      // Actualizar o crear conversación
      if (this.isMensajeCreating()) {
        await this.actualizarOCrearConversacion(
          updatedData.conversacionId,
          formValues.remitenteId,
          formValues.destinatarioId,
          remitenteUser?.role || Rol.ENTRENADO,
          destinatarioUser?.role || Rol.ENTRENADOR,
          updatedData.contenido
        );
      }
      
      // Crear notificación para el destinatario si es un mensaje nuevo
      if (this.isMensajeCreating()) {
        const remitenteNombre = remitenteUser?.nombre || remitenteUser?.email || 'Usuario';
        const notificacion: Notificacion = {
          id: 'notif-' + Date.now(),
          usuarioId: formValues.destinatarioId,  // Usar el destinatario del mensaje
          tipo: TipoNotificacion.MENSAJE_NUEVO,
          titulo: 'Nuevo mensaje',
          mensaje: `${remitenteNombre} te ha enviado un mensaje`,
          leida: false,
          fechaCreacion: new Date(),
          datos: {
            mensajeId: updatedData.id,
            remitenteId: formValues.remitenteId
          }
        };
        
        await this.notificacionService.save(notificacion);
      }
      
      this.toastService.log(`Mensaje ${this.isMensajeCreating() ? 'creado' : 'actualizado'}`);
      this.closeMensajeModal();
    } catch (error: any) {
      console.error('Error al guardar:', error);
      this.toastService.log(`ERROR al guardar mensaje: ${error.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  getMensajeFormFields(): FormFieldConfig[] {
    const fields: FormFieldConfig[] = [
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
    
    return fields;
  }

  async deleteMensaje(id: string) {
    try {
      // Primero eliminar el mensaje
      await this.mensajeService.delete(id);
      
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

  // ========================================
  // MÉTODOS PARA NOTIFICACIONES EN MODAL
  // ========================================

  getNotificacionesMensajesEntrenado(entrenadoId: string): any[] {
    if (!entrenadoId) return [];
    
    const todasNotificaciones = this.notificacionService.notificaciones();

    const notificacionesRelacionadas = todasNotificaciones.filter(notif => {

      const esParaEsteEntrenado = notif.usuarioId === entrenadoId;

      const tipoStr = String(notif.tipo).toLowerCase();
      const tituloStr = String(notif.titulo).toLowerCase();
      const esRelacionadaConMensajes = 
        tipoStr.includes('mensaje') || 
        tituloStr.includes('mensaje');
    
      return esParaEsteEntrenado && esRelacionadaConMensajes;
    });
    
    return notificacionesRelacionadas.map(notif => {
      const remitenteId = notif.datos?.['remitenteId'];
      const mensajeId = notif.datos?.['mensajeId'];
      
      // Obtener mensaje para encontrar conversacionId
      const mensaje = mensajeId ? this.mensajeService.mensajes().find(m => m.id === mensajeId) : null;
      const conversacionId = mensaje?.conversacionId;
      
      // Obtener contador de no leídos de la conversación
      let noLeidos = 0;
      if (conversacionId) {
        const conversacion = this.conversacionService.conversaciones().find(c => c.id === conversacionId);
        if (conversacion) {
          const usuario = this.usuarios().find(u => u.uid === entrenadoId);
          // Obtener el contador según el rol del usuario
          noLeidos = usuario?.role === Rol.ENTRENADOR 
            ? conversacion.noLeidosEntrenador 
            : conversacion.noLeidosEntrenado;
        }
      }
      
      if (remitenteId) {
        const remitente = this.usuarios().find(u => u.uid === remitenteId);
        return {
          ...notif,
          noLeidos,
          mensajeInfo: {
            id: mensajeId,
            remitenteNombre: remitente?.nombre || remitente?.email || 'Usuario desconocido'
          }
        };
      }
      
      return { ...notif, noLeidos };
    });
  }

  getConversacionesEntrenado(entrenadoId: string) {
    console.log('🔍 getConversacionesEntrenado - entrenadoId:', entrenadoId);
    
    // Si no hay ID, retornar array vacío
    if (!entrenadoId) {
      console.log('⚠️ No hay entrenadoId, retornando array vacío');
      return [];
    }
    
    // Obtener todas las conversaciones donde participa el entrenado
    const todasConversaciones = this.conversacionService.conversaciones();
    console.log('📚 Total conversaciones en sistema:', todasConversaciones.length);
    
    const conversaciones = todasConversaciones.filter(c => c.entrenadoId === entrenadoId);
    console.log('💬 Conversaciones del entrenado:', conversaciones.length, conversaciones);
    
    const resultado = conversaciones.map(conversacion => {
      // Obtener información del entrenador
      const entrenador = this.usuarios().find(u => u.uid === conversacion.entrenadorId);
      
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
          entrenador: entrenador ? (entrenador.displayName || entrenador.nombre || 'Entrenador') : 'Entrenador',
          entrenadorId: conversacion.entrenadorId,
          entrenadoId: conversacion.entrenadoId
        },
        ultimoMensaje: conversacion.ultimoMensaje,
        ultimoMensajeFecha: conversacion.ultimoMensajeFecha,
        noLeidos: conversacion.noLeidosEntrenado,
        fechaUltimaActividad: conversacion.fechaUltimaActividad,
        mensajes: mensajes
      };
    }).sort((a, b) => {
      const fechaA = a.fechaUltimaActividad instanceof Date ? a.fechaUltimaActividad : new Date(a.fechaUltimaActividad);
      const fechaB = b.fechaUltimaActividad instanceof Date ? b.fechaUltimaActividad : new Date(b.fechaUltimaActividad);
      return fechaB.getTime() - fechaA.getTime();
    });
    
    console.log('✅ Resultado final:', resultado);
    console.table(resultado.map(r => ({
      id: r.id,
      entrenador: r.participantes.entrenador,
      ultimoMensaje: r.ultimoMensaje?.substring(0, 50),
      noLeidos: r.noLeidos,
      fecha: r.ultimoMensajeFecha
    })));
    return resultado;
  }

  marcarNotificacionComoLeida(notifId: string) {
    this.notificacionService.marcarComoLeida(notifId);
    this.toastService.log('Notificación marcada como leída');
  }

  abrirMensaje(mensajeId: string) {
    const mensaje = this.mensajeService.mensajes().find(m => m.id === mensajeId);
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
      this.toastService.log('Mensaje no encontrado');
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
    const mensajes = this.mensajeService.mensajes()
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
