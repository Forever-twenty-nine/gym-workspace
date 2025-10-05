import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ClienteService, RutinaService, EjercicioService, UserService, EntrenadorService, GimnasioService, User, Cliente, Entrenador, Gimnasio } from 'gym-library';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Rutina, Rol, Objetivo } from 'gym-library';
import { CommonModule } from '@angular/common';

// Importar componentes
import { GenericCardComponent, CardConfig } from './components/shared/generic-card/generic-card.component';
import { ModalFormComponent, FormFieldConfig } from './components/modal-form/modal-form.component';
import { ToastComponent, Toast } from './components/shared/toast/toast.component';

// Importar adaptador de autenticación
import { FirebaseAuthAdapter } from './adapters/firebase-auth.adapter';

@Component({
  selector: 'app-root',
  imports: [ 
    CommonModule, 
    ReactiveFormsModule,
    GenericCardComponent,
    ModalFormComponent,
    ToastComponent
  ],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  // Servicios inyectados
  private readonly clienteService = inject(ClienteService);
  private readonly rutinaService = inject(RutinaService);
  private readonly ejercicioService = inject(EjercicioService);
  private readonly userService = inject(UserService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly gimnasioService = inject(GimnasioService);
  private readonly fb = inject(FormBuilder);
  private readonly firebaseAuthAdapter = inject(FirebaseAuthAdapter);

  // Signals reactivas para datos
  readonly rutinas = computed(() => {
    // Agregar información del creador a cada rutina
    return this.rutinaService.rutinas().map(rutina => {
      let creadorName = null;
      let asignadoName = null;
      
      // Información del creador
      if (rutina.creadorId) {
        const usuario = this.usuarios().find(u => u.uid === rutina.creadorId);
        creadorName = usuario?.nombre || usuario?.email || `Usuario ${rutina.creadorId}`;
      }
      
      // Información del asignado
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
  readonly ejercicios = computed(() => {
    // Agregar información del creador a cada ejercicio
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
  readonly usuarios = computed(() => {
    // Agregar un campo displayName para mostrar en el card y detectar usuarios incompletos
    return this.userService.users().map(user => {
      // Un usuario necesita revisión si le falta nombre o rol
      const needsReview = !user.nombre || !user.role;
      
      return {
        ...user,
        displayName: user.nombre || user.email || `Usuario ${user.uid}`,
        needsReview
      };
    });
  });
  
  readonly clientes = computed(() => {
    // Agregar displayName a cada cliente basado en el usuario asociado
    return this.clienteService.clientes().map(cliente => {
      const usuario = this.usuarios().find(u => u.uid === cliente.id);
      
      // Obtener información del entrenador asociado
      const entrenador = this.entrenadoresBase().find(e => e.id === cliente.entrenadorId);
      const entrenadorName = entrenador?.displayName || (cliente.entrenadorId ? `Entrenador ${cliente.entrenadorId}` : null);
      
      // Obtener información del gimnasio asociado
      const gimnasio = this.gimnasios().find(g => g.id === cliente.gimnasioId);
      const gimnasioName = gimnasio?.displayName || (cliente.gimnasioId ? `Gimnasio ${cliente.gimnasioId}` : null);
      
      return {
        ...cliente,
        displayName: usuario?.nombre || usuario?.email || `Cliente ${cliente.id}`,
        entrenadorName,
        gimnasioName
      };
    });
  });

  readonly entrenadoresBase = computed(() => {
    // Signal base para entrenadores sin métricas
    return this.entrenadorService.entrenadores().map(entrenador => {
      const usuario = this.usuarios().find(u => u.uid === entrenador.id);
      return {
        ...entrenador,
        displayName: usuario?.nombre || usuario?.email || `Entrenador ${entrenador.id}`
      };
    });
  });

  readonly entrenadores = computed(() => {
    // Agregar métricas a cada entrenador
    return this.entrenadoresBase().map(entrenador => {
      // Calcular métricas del entrenador usando los datos base
      const ejerciciosCreados = this.ejercicios().filter(e => 
        e.creadorId === entrenador.id && e.creadorTipo === 'entrenador'
      ).length;
      
      const clientesAsignados = this.clienteService.clientes().filter(c => 
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

  readonly gimnasios = computed(() => {
    // Agregar displayName a cada gimnasio usando el nombre
    return this.gimnasioService.gimnasios().map(gimnasio => ({
      ...gimnasio,
      displayName: gimnasio.nombre || `Gimnasio ${gimnasio.id}`
    }));
  });

  // Configuraciones simples para los cards
  readonly usuariosCardConfig: CardConfig = {
    title: 'Usuarios',
    createButtonText: 'Crear Usuario',
    createButtonColor: 'blue',
    emptyStateTitle: 'No hay usuarios creados',
    displayField: 'displayName', // Usar el campo display personalizado
    showCounter: true,
    counterColor: 'blue'
  };

  readonly clientesCardConfig: CardConfig = {
    title: 'Clientes',
    createButtonText: 'N/A', // No se usa porque canCreate será false
    createButtonColor: 'green',
    emptyStateTitle: 'No hay clientes registrados',
    displayField: 'displayName', // Mostrar el nombre del cliente
    showCounter: true,
    counterColor: 'green',
    showChips: ['gimnasioName', 'entrenadorName'] // Primero gimnasio, después entrenador
  };

  readonly entrenadoresCardConfig: CardConfig = {
    title: 'Entrenadores',
    createButtonText: 'N/A', // No se usa porque canCreate será false
    createButtonColor: 'orange',
    emptyStateTitle: 'No hay entrenadores registrados',
    displayField: 'displayName', // Mostrar el nombre del entrenador
    showCounter: true,
    counterColor: 'orange',
    showChips: ['ejerciciosCount', 'clientesCount', 'rutinasCount']
  };

  readonly gimnasiosCardConfig: CardConfig = {
    title: 'Gimnasios',
    createButtonText: 'N/A', // No se usa porque canCreate será false
    createButtonColor: 'purple',
    emptyStateTitle: 'No hay gimnasios registrados',
    displayField: 'displayName', // Mostrar el nombre del gimnasio
    showCounter: true,
    counterColor: 'purple'
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

  readonly ejerciciosCardConfig: CardConfig = {
    title: 'Ejercicios',
    createButtonText: 'Crear Ejercicio',
    createButtonColor: 'orange',
    emptyStateTitle: 'No hay ejercicios creados',
    displayField: 'nombre',
    showCounter: true,
    counterColor: 'orange',
    showChips: ['creadorName']
  };





  // Signals para el estado del componente
  readonly toasts = signal<Toast[]>([]);
  readonly isModalOpen = signal(false);
  readonly modalData = signal<any>(null);
  readonly modalType = signal<string>('');
  readonly editForm = signal<FormGroup | null>(null);
  readonly isLoading = signal(false);
  readonly isCreating = signal(false);
  readonly selectedEjercicios = signal<string[]>([]);

  // Computed signal para rutinas indexadas por ID
  readonly conjuntoRutinas = computed(() => {
    const m = new Map<string, Rutina>();
    for (const r of this.rutinas()) {
      if (r?.id) m.set(r.id, r as Rutina);
    }
    return m;
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

    // Agregar el toast
    this.toasts.update(toasts => [...toasts, toast]);

    // Hacer visible el toast después de un frame para la animación
    setTimeout(() => {
      this.toasts.update(toasts => 
        toasts.map(t => t.id === id ? { ...t, isVisible: true } : t)
      );
    }, 10);

    // Auto-remover después de la duración
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

  private showWarning(message: string, duration?: number) {
    this.showToast(message, 'warning', duration);
  }

  private showInfo(message: string, duration?: number) {
    this.showToast(message, 'info', duration);
  }

  removeToast(id: string) {
    // Primero ocultar con animación
    this.toasts.update(toasts => 
      toasts.map(t => t.id === id ? { ...t, isVisible: false } : t)
    );

    // Luego remover después de la animación
    setTimeout(() => {
      this.toasts.update(toasts => toasts.filter(t => t.id !== id));
    }, 300);
  }

  // Método de compatibilidad para reemplazar log()
  private log(msg: string) {
    // Limpiar emojis para toasts más limpios
    const cleanMsg = msg.replace(/✅|❌|⚠️/g, '').trim();
    
    // Determinar el tipo de mensaje basado en el contenido
    if (msg.includes('Error') || msg.includes('ERROR') || msg.includes('❌')) {
      this.showError(cleanMsg);
    } else if (msg.includes('⚠️') || msg.includes('Warning')) {
      this.showWarning(cleanMsg);
    } else if (msg.includes('✅') || msg.includes('creado') || msg.includes('actualizado') || msg.includes('eliminado')) {
      this.showSuccess(cleanMsg);
    } else {
      this.showInfo(cleanMsg);
    }
  }

  /**
   * Obtiene el nombre del cliente a partir de su ID
   * @param clienteId ID del cliente
   * @returns Nombre del cliente o 'Cliente no encontrado' si no existe
   */
  getClienteName(clienteId: string): string {
    if (!clienteId) return 'Sin cliente asignado';

    const usuario = this.usuarios().find(u => u.uid === clienteId);
    if (usuario) {
      return usuario.nombre || usuario.email || `Usuario ${usuario.uid}`;
    }

    const cliente = this.clientes().find(c => c.id === clienteId);
    if (cliente) {
      return `Cliente ${cliente.id}`;
    }

    return `Cliente ${clienteId}`;
  }

  /**
   * Obtiene el nombre del entrenador a partir de su ID
   * @param entrenadorId ID del entrenador
   * @returns Nombre del entrenador o 'Entrenador no encontrado' si no existe
   */
  getEntrenadorName(entrenadorId: string): string {
    if (!entrenadorId) return 'Sin entrenador asignado';

    const entrenador = this.usuarios().find(u => u.uid === entrenadorId);
    if (entrenador) {
      return entrenador.nombre || entrenador.email || `Entrenador ${entrenador.uid}`;
    }

    return `Entrenador ${entrenadorId}`;
  }

  /**
   * Obtiene los clientes asignados a un entrenador específico
   * @param entrenadorId ID del entrenador
   * @returns Lista de clientes asociados al entrenador
   */
  getClientesByEntrenador(entrenadorId: string) {
    return this.clientes().filter(cliente => cliente.entrenadorId === entrenadorId);
  }

  /**
   * Obtiene las rutinas creadas por un entrenador específico
   * @param entrenadorId ID del entrenador
   * @returns Lista de rutinas creadas por el entrenador
   */
  getRutinasByEntrenador(entrenadorId: string) {
    return this.rutinas().filter(rutina => rutina.creadorId === entrenadorId);
  }

  /**
   * Obtiene los ejercicios creados por un entrenador específico
   * @param entrenadorId ID del entrenador
   * @returns Lista de ejercicios creados por el entrenador
   */
  getEjerciciosByEntrenador(entrenadorId: string) {
    if (!entrenadorId) return [];
    
    // Filtrar ejercicios que tienen como creador a este entrenador
    return this.ejercicios().filter(ejercicio => 
      ejercicio.creadorId === entrenadorId && ejercicio.creadorTipo === 'entrenador'
    );
  }

  /**
   * Obtiene las rutinas asignadas a un cliente específico
   * 
   * ℹ️ LÓGICA DE ASIGNACIÓN (ESTRICTA):
   * - Las rutinas se crean individualmente y se asignan a clientes específicos
   * - La asignación DEBE tener: rutina.asignadoId = clienteId Y rutina.asignadoTipo = 'cliente'
   * - NO se usa el campo legacy 'clienteId' para evitar datos corruptos
   * - Solo se incluyen rutinas con asignación EXPLÍCITA y válida
   * 
   * @param clienteId ID del cliente
   * @returns Lista de rutinas explícitamente asignadas al cliente
   */
  getRutinasAsignadasAlCliente(clienteId: string) {
    if (!clienteId) return [];
    
    const todasLasRutinas = this.rutinas();
    
    // Buscar rutinas que fueron asignadas a este cliente específico
    // SOLO usar la lógica nueva (asignadoId + asignadoTipo) - más confiable y precisa
    return todasLasRutinas.filter(rutina => {
      const tieneAsignadoIdValido = rutina.asignadoId && rutina.asignadoId.trim() !== '';
      const tieneAsignadoTipoValido = rutina.asignadoTipo === Rol.CLIENTE;
      
      // Solo incluir rutinas que están EXPLÍCITAMENTE asignadas a este cliente
      return tieneAsignadoIdValido && 
             tieneAsignadoTipoValido && 
             rutina.asignadoId === clienteId;
    });
  }

  /**
   * Obtiene la información del gimnasio asociado a un entrenador
   * @param gimnasioId ID del gimnasio
   * @returns Datos del gimnasio o null si no existe
   */
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

  /**
   * Obtiene los entrenadores asociados a un gimnasio específico
   * @param gimnasioId ID del gimnasio
   * @returns Lista de entrenadores del gimnasio
   */
  getEntrenadoresByGimnasio(gimnasioId: string) {
    return this.entrenadores().filter(entrenador => entrenador.gimnasioId === gimnasioId);
  }

  /**
   * Obtiene todos los entrenadores disponibles (usuarios con rol ENTRENADOR)
   * @returns Lista de usuarios entrenadores
   */
  getEntrenadoresDisponiblesParaGimnasio() {
    return this.usuarios().filter(u => u.role === Rol.ENTRENADOR);
  }

  /**
   * Obtiene los clientes asociados a un gimnasio específico
   * @param gimnasioId ID del gimnasio
   * @returns Lista de clientes del gimnasio
   */
  getClientesByGimnasio(gimnasioId: string) {
    return this.clientes().filter(cliente => cliente.gimnasioId === gimnasioId);
  }

  /**
   * Obtiene todos los clientes disponibles (usuarios con rol CLIENTE)
   * @returns Lista de usuarios clientes
   */
  getClientesDisponiblesParaGimnasio() {
    return this.usuarios().filter(u => u.role === Rol.CLIENTE);
  }

  /**
   * Crea un cliente de muestra
   * @return void
   */
  async addSampleCliente() {
    this.openCreateModal('cliente');
  }

  /**
   * Elimina un cliente por su ID.
   * @param id El ID del cliente a eliminar.
   * @return void
   */
  async deleteCliente(id: string) {
    await this.clienteService.delete(id);
    this.log(`Cliente eliminado: ${id}`);
  }

  /**
   * Elimina un entrenador por su ID.
   * @param id El ID del entrenador a eliminar.
   * @return void
   */
  async deleteEntrenador(id: string) {
    await this.entrenadorService.delete(id);
    this.log(`Entrenador eliminado: ${id}`);
  }

  /**
   * Crea un gimnasio de muestra
   * @returns void
   */
  addSampleGimnasio() {
    // Abrir modal para crear un nuevo gimnasio
    this.openCreateModal('gimnasio');
  }

  /**
   * Elimina un gimnasio por su ID.
   * @param id El ID del gimnasio a eliminar.
   * @return void
   */
  async deleteGimnasio(id: string) {
    await this.gimnasioService.delete(id);
    this.log(`Gimnasio eliminado: ${id}`);
  }

  /**
   * Crea una rutina de muestra basado en los ejercicios que ya existen
   * @return void
   */
  async addSampleRutina() {

    if (!this.canCreateRutina()) {
      this.log(`Error: ${this.getRutinaValidationMessage()}`);
      return;
    }

    this.openCreateModal('rutina');
  }

  /**
   * Elimina una rutina por su ID.
   * @param id El ID de la rutina a eliminar.
   */
  async deleteRutina(id: string) {
    await this.rutinaService.delete(id);
    this.log(`Rutina eliminada: ${id}`);
  }

  /**
   * Crea un ejercicio de muestra
   * @return void
   */
  async addSampleEjercicio() {
    this.openCreateModal('ejercicio');
  }

  /**
   * Elimina un ejercicio por su ID.
   * @param id El ID del ejercicio a eliminar.
   * @return void
   */
  async deleteEjercicio(id: string) {
    await this.ejercicioService.delete(id);
    this.log(`Ejercicio eliminado: ${id}`);
  }

  /**
   * Crea un usuario de muestra
   * @returns void
   */
  addSampleUsuario() {
    // Abrir modal para crear un nuevo usuario
    this.openCreateModal('usuario');
  }



  /**
   * Elimina un usuario por su ID.
   * @param id El ID del usuario a eliminar.
   * @returns void
   */
  async deleteUsuario(id: string) {
    await this.userService.deleteUser(id);
    this.log(`Usuario eliminado: ${id}`);
  }

  /** 
   * Abre el modal de edición con el elemento seleccionado
   * @param item El elemento a editar
   * @param type El tipo de elemento ('usuario', 'cliente', 'rutina', 'ejercicio')
   * @returns void
   */
  openDetailsModal(item: any, type: string) {
    this.modalData.set(item);
    this.modalType.set(type);
    this.isModalOpen.set(true);
    this.isCreating.set(false);
    this.createEditForm(item, type);

    if (type === 'rutina' && item.ejercicios) {
      this.selectedEjercicios.set(Array.isArray(item.ejercicios) ? item.ejercicios : []);
    }
  }

  /** 
   * Abre el modal para crear un nuevo elemento
   * @param type El tipo de elemento a crear ('usuario', 'cliente', 'rutina', 'ejercicio')
   * @returns void
   */
  openCreateModal(type: string) {
    const newItem = this.createEmptyItem(type);
    this.modalData.set(newItem);
    this.modalType.set(type);
    this.isModalOpen.set(true);
    this.isCreating.set(true);
    this.selectedEjercicios.set([]);
    this.createEditForm(newItem, type);
  }

  /**
   * Crea un elemento vacío según el tipo
   * @param type El tipo de elemento ('usuario', 'cliente', 'rutina', 'ejercicio')
   * @returns Un objeto vacío con la estructura adecuada
   */
  private createEmptyItem(type: string): any {
    const timestamp = Date.now();

    switch (type) {
      case 'rutina':
        return {
          id: 'r' + timestamp,
          nombre: '',
          fechaAsignacion: new Date(),
          ejercicios: [],
          activa: true,
          DiasSemana: [],
          completado: false,
          // Campos principales (nuevos)
          creadorId: '',
          creadorTipo: '',
          asignadoId: '',
          asignadoTipo: '',
          // Campo de compatibilidad (derivado de asignadoId si asignadoTipo es CLIENTE)
          clienteId: ''
        };
      case 'usuario':
        return {
          uid: 'u' + timestamp,
          email: '',
          password: ''
        };
      case 'cliente':
        return {
          id: 'c' + timestamp,
          gimnasioId: '',
          entrenadorId: '',
          activo: true,
          fechaRegistro: new Date(),
          objetivo: '',
          rutinas: []
        };
      case 'ejercicio':
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
      case 'gimnasio':
        return {
          id: 'g' + timestamp,
          nombre: '',
          direccion: '',
          activo: true,
          entrenadores: []
        };
      case 'entrenador':
        return {
          id: 'e' + timestamp,
          gimnasioId: '',
          activo: true,
          clientes: [],
          rutinas: [],
          ejercicios: []
        };
      default:
        return {};
    }
  }

  /** 
   * Cierra el modal de edición
   * 
   */
  closeModal() {
    this.isModalOpen.set(false);
    this.modalData.set(null);
    this.modalType.set('');
    this.editForm.set(null);
    this.isLoading.set(false);
    this.isCreating.set(false);
    this.selectedEjercicios.set([]);
  }

  /**
   * Crea el formulario de edición según el tipo de elemento
   * @param item El elemento a editar
   * @param type El tipo de elemento ('usuario', 'cliente', 'rutina', 'ejercicio')
   * @return FormGroup configurado
   */
  private createEditForm(item: any, type: string) {
    let formConfig: any = {};

    switch (type) {
      case 'usuario':
        if (this.isCreating()) {
          // Formulario simplificado para creación
          formConfig = {
            email: [item.email || '', [Validators.required, Validators.email]],
            password: [item.password || '', [Validators.required, Validators.minLength(6)]]
          };
        } else {
          // Formulario completo para edición
          formConfig = {
            nombre: [item.nombre || ''],
            email: [{ value: item.email || '', disabled: true }], // Email no editable
            role: [item.role || ''],
            emailVerified: [item.emailVerified || false],
            onboarded: [item.onboarded || false],
            plan: [item.plan || '']
          };
        }
        break;

      case 'cliente':
        formConfig = {
          // Campos informativos del usuario (solo lectura)
          nombre: [{ value: '', disabled: true }],
          email: [{ value: '', disabled: true }],
          planInfo: [{ value: '', disabled: true }],
          
          // Campos informativos de asociaciones (solo lectura)
          gimnasioInfo: [{ value: '', disabled: true }],
          entrenadorInfo: [{ value: '', disabled: true }],
          
          // Campos editables del cliente
          activo: [item.activo || false],
          objetivo: [item.objetivo || ''],
          fechaRegistro: [item.fechaRegistro ? new Date(item.fechaRegistro).toISOString().slice(0, 16) : ''],
          
          // Campo para rutinas (solo informativo)
          rutinasAsociadas: [{ value: '', disabled: true }]
        };
        break;

      case 'entrenador':
        formConfig = {
          // Campos informativos del usuario (solo lectura)
          nombre: [{ value: '', disabled: true }],
          email: [{ value: '', disabled: true }],
          planInfo: [{ value: '', disabled: true }],
          
          // Campo informativo del gimnasio (solo lectura)
          gimnasioInfo: [{ value: '', disabled: true }],
          
          // Campos editables
          activo: [item.activo || false],
          
          // Campos para selección múltiple
          rutinasAsociadas: [item.rutinas || []],
          
          // Campos informativos (solo lectura)
          clientesAsignados: [{ value: '', disabled: true }],
          ejerciciosCreados: [{ value: '', disabled: true }]
        };
        break;

      case 'rutina':
        formConfig = {
          nombre: [item.nombre || '', [Validators.required]],
          activa: [item.activa || false],
          completado: [item.completado || false],
          DiasSemana: [item.DiasSemana || []],
          // Campos principales
          creadorId: [item.creadorId || ''],
          creadorTipo: [item.creadorTipo || ''],
          asignadoId: [item.asignadoId || item.clienteId || '', [Validators.required]], // Usar asignadoId como principal, clienteId como fallback
          asignadoTipo: [item.asignadoTipo || (item.clienteId ? 'CLIENTE' : ''), [Validators.required]]
        };
        
        // Agregar gimnasioId solo si existe y no está vacío
        if (item.gimnasioId && item.gimnasioId.trim() !== '') {
          formConfig.gimnasioId = [item.gimnasioId];
        }
        
        // Cargar ejercicios seleccionados si existen
        if (item.ejercicios) {
          this.selectedEjercicios.set(Array.isArray(item.ejercicios) ? item.ejercicios : []);
        }
        break;

      case 'ejercicio':
        formConfig = {
          nombre: [item.nombre || ''],
          series: [item.series || 0],
          repeticiones: [item.repeticiones || 0],
          peso: [item.peso || 0],
          serieSegundos: [item.serieSegundos || 0],
          descansoSegundos: [item.descansoSegundos || 0],
          descripcion: [item.descripcion || ''],
          // Nuevos campos
          creadorId: [item.creadorId || ''],
          creadorTipo: [item.creadorTipo || ''],
          asignadoAId: [item.asignadoAId || ''],
          asignadoATipo: [item.asignadoATipo || '']
        };
        break;

      case 'gimnasio':
        // Obtener entrenadores ya asociados a este gimnasio
        const entrenadoresAsociados = this.getEntrenadoresByGimnasio(item.id || '').map(e => e.id);
        // Obtener clientes ya asociados a este gimnasio
        const clientesAsociados = this.getClientesByGimnasio(item.id || '').map(c => c.id);
        
        formConfig = {
          // Campo informativo del usuario asociado
          usuarioInfo: [{ value: '', disabled: true }],
          
          // Campos editables
          nombre: [item.nombre || '', [Validators.required]],
          direccion: [item.direccion || '', [Validators.required]],
          activo: [item.activo || true],
          
          // Campo para selección múltiple de entrenadores (pre-cargado con los ya asociados)
          entrenadoresAsociados: [entrenadoresAsociados],
          // Campo para selección múltiple de clientes (pre-cargado con los ya asociados)
          clientesAsociados: [clientesAsociados]
        };
        break;

      default:
        formConfig = {};
    }

    this.editForm.set(this.fb.group(formConfig));
  }

  /**
   * Guarda los cambios del formulario de edición
   * @return void
   */
  async saveChanges() {
    const form = this.editForm();
    const type = this.modalType();
    const originalData = this.modalData();

    if (!form || !originalData) {
      this.log('Error: Formulario inválido o datos faltantes');
      return;
    }

    form.markAllAsTouched();

    if (type === 'rutina' && this.isCreating()) {
      const asignadoId = form.get('asignadoId')?.value;
      const asignadoTipo = form.get('asignadoTipo')?.value;

      if (!asignadoId) {
        this.log('Error: Debes seleccionar a quién se asigna la rutina');
        return;
      }

      if (!asignadoTipo) {
        this.log('Error: Debes especificar el tipo de asignado');
        return;
      }
    }

    if (!form.valid) {
      this.log('Error: Por favor, completa todos los campos obligatorios');
      return;
    }

    this.isLoading.set(true);

    try {
      let updatedData = { ...originalData, ...form.value };

      if (type === 'rutina') {
        updatedData.ejercicios = this.selectedEjercicios();
      }

      updatedData = this.cleanUndefinedFields(updatedData);

      switch (type) {
        case 'usuario':
          if (this.isCreating()) {
            // Extraer contraseña y preparar datos para creación
            const password = updatedData.password;
            delete updatedData.password;
            
            // Para creación, solo tenemos email y password
            // Firebase Auth creará el usuario y inferirá el nombre del email
            const userDataForCreation = {
              email: updatedData.email,
              // Se inferirá automáticamente en el adaptador:
              // - nombre desde email
              // - role desde email 
              // - emailVerified: false
              // - onboarded: false
            };
            
            await (this.userService as any).addUser(userDataForCreation, password);
            this.log(`✅ Usuario creado con Firebase Auth: ${updatedData.email}`);
          } else {
            // Para edición, actualizar usuario existente
            // Remover campos que no se pueden actualizar
            delete updatedData.password;
            
            // Detectar si cambió el rol para crear documentos específicos
            const originalRole = originalData.role;
            const newRole = updatedData.role;
            
            if (originalRole !== newRole && newRole) {
              await this.handleRoleChange(updatedData.uid, newRole, updatedData);
            }
            
            await this.userService.updateUser(updatedData.uid, updatedData);
            this.log(`✅ Usuario actualizado: ${updatedData.nombre || updatedData.email}`);
          }
          break;

        case 'cliente':
          // Limpiar campos informativos antes de guardar
          const clienteDataToSave = {
            ...updatedData,
            fechaRegistro: updatedData.fechaRegistro ? new Date(updatedData.fechaRegistro) : undefined
          };
          
          // Remover campos informativos
          delete clienteDataToSave.usuarioInfo;
          delete clienteDataToSave.rutinasAsociadas;
          
          await this.clienteService.save(clienteDataToSave);
          
          // Obtener nombres para el log
          const usuarioNombre = this.usuarios().find(u => u.uid === updatedData.id)?.nombre || updatedData.id;
          const gimnasioNombre = this.usuarios().find(u => u.uid === updatedData.gimnasioId)?.nombre || 'Gimnasio desconocido';
          const entrenadorClienteNombre = this.usuarios().find(u => u.uid === updatedData.entrenadorId)?.nombre || 'Entrenador desconocido';
          
          this.log(`Cliente ${this.isCreating() ? 'creado' : 'actualizado'}: ${usuarioNombre} - Gimnasio: ${gimnasioNombre} - Entrenador: ${entrenadorClienteNombre}`);
          break;

        case 'entrenador':
          // Limpiar campos informativos antes de guardar
          const entrenadorDataToSave = {
            ...updatedData
          };
          
          // Remover campos informativos
          delete entrenadorDataToSave.usuarioInfo;
          delete entrenadorDataToSave.clientesAsociados;
          delete entrenadorDataToSave.gimnasioInfo;
          
          // Los campos rutinasAsociadas y ejerciciosAsociados se mantienen como arrays
          // que se guardarán en el documento del entrenador
          
          if (this.isCreating()) {
            // Usar la misma lógica que en handleRoleChange para crear entrenadores
            const entrenadorServiceAdapter = (this.entrenadorService as any).adapter;
            if (entrenadorServiceAdapter && entrenadorServiceAdapter.createWithId) {
              await entrenadorServiceAdapter.createWithId(entrenadorDataToSave.id, entrenadorDataToSave);
            } else {
              // Fallback: crear con ID temporal y luego actualizar
              const tempId = await this.entrenadorService.create(entrenadorDataToSave);
              // Eliminar el documento temporal
              await this.entrenadorService.delete(tempId);
              // Crear el documento con el ID correcto usando el adaptador
              if (entrenadorServiceAdapter) {
                await entrenadorServiceAdapter.update(entrenadorDataToSave.id, entrenadorDataToSave);
              }
            }
          } else {
            await this.entrenadorService.update(entrenadorDataToSave.id, entrenadorDataToSave);
          }
          
          // Obtener nombres para el log
          const usuarioEntrenadorNombre = this.usuarios().find(u => u.uid === updatedData.id)?.nombre || updatedData.id;
          const gimnasioEntrenadorNombre = this.usuarios().find(u => u.uid === updatedData.gimnasioId)?.nombre || 'Gimnasio desconocido';
          const clientesCount = this.getClientesByEntrenador(updatedData.id).length;
          const rutinasCount = this.getRutinasByEntrenador(updatedData.id).length;
          
          this.log(`Entrenador ${this.isCreating() ? 'creado' : 'actualizado'}: ${usuarioEntrenadorNombre} - Gimnasio: ${gimnasioEntrenadorNombre} - Clientes: ${clientesCount} - Rutinas: ${rutinasCount}`);
          break;

        case 'rutina':
          // Limpieza específica para rutina: remover campos undefined o vacíos
          const rutinaDataToSave = { ...updatedData };
          
          // Sincronizar clienteId con asignadoId para compatibilidad hacia atrás
          if (rutinaDataToSave.asignadoId && rutinaDataToSave.asignadoTipo === 'CLIENTE') {
            rutinaDataToSave.clienteId = rutinaDataToSave.asignadoId;
          } else if (rutinaDataToSave.asignadoId && rutinaDataToSave.asignadoTipo === Rol.CLIENTE) {
            rutinaDataToSave.clienteId = rutinaDataToSave.asignadoId;
          } else {
            // Si no hay asignado cliente, limpiar clienteId
            rutinaDataToSave.clienteId = '';
          }
          
          // Remover campos opcionales si están undefined o vacíos
          if (!rutinaDataToSave.gimnasioId || rutinaDataToSave.gimnasioId.trim() === '') {
            delete rutinaDataToSave.gimnasioId;
          }
          if (!rutinaDataToSave.notas || rutinaDataToSave.notas.trim() === '') {
            delete rutinaDataToSave.notas;
          }
          if (!rutinaDataToSave.duracion || rutinaDataToSave.duracion === 0) {
            delete rutinaDataToSave.duracion;
          }
          
          await this.rutinaService.save(rutinaDataToSave);
          
          // Log con información usando los nuevos campos
          let logMessage = `Rutina ${this.isCreating() ? 'creada' : 'actualizada'}: ${updatedData.nombre} - Ejercicios: ${updatedData.ejercicios.length}`;
          
          // Información del asignado (principal)
          if (updatedData.asignadoId) {
            const asignado = this.usuarios().find(u => u.uid === updatedData.asignadoId);
            logMessage += ` - Asignado a: ${asignado?.nombre || asignado?.email || updatedData.asignadoId} (${updatedData.asignadoTipo || 'N/A'})`;
          }
          
          // Información del creador si existe
          if (updatedData.creadorId) {
            const creador = this.usuarios().find(u => u.uid === updatedData.creadorId);
            logMessage += ` - Creador: ${creador?.nombre || creador?.email || updatedData.creadorId} (${updatedData.creadorTipo || 'N/A'})`;
          }
          
          this.log(logMessage);
          break;

        case 'ejercicio':
          try {
            // El servicio se encarga de:
            // - Validar las reglas de negocio (solo CLIENTE/ENTRENADOR pueden crear)
            // - Validar que solo se asigne a CLIENTE
            // - Normalizar campos vacíos
            // - Agregar/actualizar fechas de metadatos
            await this.ejercicioService.save(updatedData);
            
            // Log con información del creador y asignado
            let logMessage = `Ejercicio ${this.isCreating() ? 'creado' : 'actualizado'}: ${updatedData.nombre}`;
            
            if (updatedData.creadorId) {
              const creador = this.usuarios().find(u => u.uid === updatedData.creadorId);
              logMessage += ` - Creador: ${creador?.nombre || creador?.email || updatedData.creadorId} (${updatedData.creadorTipo})`;
            }
            
            if (updatedData.asignadoAId) {
              const asignado = this.usuarios().find(u => u.uid === updatedData.asignadoAId);
              logMessage += ` - Asignado a: ${asignado?.nombre || asignado?.email || updatedData.asignadoAId} (Cliente)`;
            }
            
            this.log(logMessage);
          } catch (error: any) {
            this.log(`ERROR al guardar ejercicio: ${error.message}`);
            return;
          }
          break;


        case 'gimnasio':
          // Limpiar campos informativos antes de guardar
          const gimnasioDataToSave = {
            ...updatedData
          };
          
          // Remover campos informativos y los arrays de entrenadores y clientes (no se guardan en el modelo de gimnasio)
          delete gimnasioDataToSave.usuarioInfo;
          const entrenadoresSeleccionados = updatedData.entrenadoresAsociados || [];
          const clientesSeleccionados = updatedData.clientesAsociados || [];
          delete gimnasioDataToSave.entrenadoresAsociados;
          delete gimnasioDataToSave.clientesAsociados;
          
          // Guardar datos del gimnasio
          await this.gimnasioService.save(gimnasioDataToSave);
          
          // Actualizar la relación de entrenadores
          if (!this.isCreating()) {
            // Para edición, primero desasociar todos los entrenadores actuales
            const entrenadoresActuales = this.getEntrenadoresByGimnasio(updatedData.id);
            for (const entrenador of entrenadoresActuales) {
              if (!entrenadoresSeleccionados.includes(entrenador.id)) {
                // Desasociar entrenador (quitar gimnasioId)
                await this.entrenadorService.update(entrenador.id, { 
                  ...entrenador, 
                  gimnasioId: '' 
                });
              }
            }
            
            // Desasociar todos los clientes actuales que no estén en la selección
            const clientesActuales = this.getClientesByGimnasio(updatedData.id);
            for (const cliente of clientesActuales) {
              if (!clientesSeleccionados.includes(cliente.id)) {
                // Desasociar cliente (quitar gimnasioId)
                await this.clienteService.save({ 
                  ...cliente, 
                  gimnasioId: '' 
                });
              }
            }
          }
          
          // Asociar los entrenadores seleccionados
          for (const entrenadorId of entrenadoresSeleccionados) {
            try {
              const entrenadorActual = this.entrenadores().find(e => e.id === entrenadorId);
              if (entrenadorActual) {
                // Actualizar entrenador existente
                await this.entrenadorService.update(entrenadorId, {
                  ...entrenadorActual,
                  gimnasioId: updatedData.id
                });
              } else {
                // Crear nuevo documento de entrenador si no existe
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
          
          // Asociar los clientes seleccionados
          for (const clienteId of clientesSeleccionados) {
            try {
              const clienteActual = this.clientes().find(c => c.id === clienteId);
              if (clienteActual) {
                // Actualizar cliente existente
                await this.clienteService.save({
                  ...clienteActual,
                  gimnasioId: updatedData.id
                });
              } else {
                // Crear nuevo documento de cliente si no existe
                const clienteServiceAdapter = (this.clienteService as any).adapter;
                if (clienteServiceAdapter && clienteServiceAdapter.createWithId) {
                  await clienteServiceAdapter.createWithId(clienteId, {
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
              console.error(`Error al asociar cliente ${clienteId}:`, error);
              this.log(`⚠️ Error al asociar cliente ${clienteId}: ${error}`);
            }
          }
          
          this.log(`Gimnasio ${this.isCreating() ? 'creado' : 'actualizado'}: ${updatedData.nombre} - Entrenadores: ${entrenadoresSeleccionados.length}, Clientes: ${clientesSeleccionados.length}`);
          break;
      }

      this.closeModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      this.log(`Error al guardar los cambios: ${error}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Obtiene los días de la semana disponibles
   */
  getDiasSemanOptions() {
    return [
      { value: 0, label: 'Domingo' },
      { value: 1, label: 'Lunes' },
      { value: 2, label: 'Martes' },
      { value: 3, label: 'Miércoles' },
      { value: 4, label: 'Jueves' },
      { value: 5, label: 'Viernes' },
      { value: 6, label: 'Sábado' }
    ];
  }

  /**
   * Obtiene los clientes disponibles para asignar a rutinas
   * @return Usuario[]
   */
  getClientesDisponibles() {
    return this.usuarios().filter(u => u.role === Rol.CLIENTE);
  }

  /**
   * Obtiene los entrenadores disponibles para asignar a rutinas
   * @return Usuario[]
   */
  getEntrenadoresDisponibles() {
    return this.usuarios().filter(u => u.role === Rol.ENTRENADOR);
  }

  /**
   * Obtiene los gimnasios disponibles para asignar a clientes
   * @return Usuario[]
   */
  getGimnasiosDisponibles() {
    return this.usuarios().filter(u => u.role === Rol.GIMNASIO);
  }

  /**
   * Verifica si hay suficientes usuarios para crear una rutina
   * @return boolean
   */
  canCreateRutina(): boolean {
    // Solo necesitamos clientes para asignar rutinas (los entrenadores son opcionales como creadores)
    return this.getClientesDisponibles().length > 0;
  }

  /**
   * Obtiene el mensaje de validación para crear rutinas
   * @return string
   */
  getRutinaValidationMessage(): string {
    const clientes = this.getClientesDisponibles().length;

    if (clientes === 0) {
      return 'Necesitas crear al menos un cliente para poder asignar rutinas';
    }
    return '';
  }

  // Obtiene los roles disponibles
  getRolesDisponibles() {
    return Object.values(Rol);
  }

  // Obtiene los objetivos disponibles
  getObjetivosDisponibles() {
    return Object.values(Objetivo).map(objetivo => ({
      value: objetivo,
      label: objetivo
    }));
  }

  // Maneja el toggle de días de la semana en rutinas
  toggleDiaSemana(event: Event, diaValue: number) {
    const checkbox = event.target as HTMLInputElement;
    const form = this.editForm();

    if (!form) return;

    const currentDays = form.get('DiasSemana')?.value || [];

    if (checkbox.checked) {
      // Agregar día si no está presente
      if (!currentDays.includes(diaValue)) {
        const newDays = [...currentDays, diaValue].sort((a, b) => a - b);
        form.patchValue({ DiasSemana: newDays });
      }
    } else {
      // Remover día si está presente
      const newDays = currentDays.filter((d: number) => d !== diaValue);
      form.patchValue({ DiasSemana: newDays });
    }
  }

  /**
   * Método adaptador para el modal component
   */
  onToggleDiaSemana(eventData: { event: Event; value: string }) {
    // Convertir el valor de string a número ya que los días están numerados
    const diaMap: Record<string, number> = {
      'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6, 'D': 0
    };
    const diaValue = diaMap[eventData.value];
    this.toggleDiaSemana(eventData.event, diaValue);
  }

  // Maneja la selección/deselección de ejercicios para rutinas
  toggleEjercicio(ejercicioId: string) {
    const current = this.selectedEjercicios();

    if (current.includes(ejercicioId)) {
      // Remover ejercicio
      this.selectedEjercicios.set(current.filter(id => id !== ejercicioId));
    } else {
      // Agregar ejercicio
      this.selectedEjercicios.set([...current, ejercicioId]);
    }
  }

  // Verifica si un ejercicio está seleccionado
  isEjercicioSelected(ejercicioId: string): boolean {
    return this.selectedEjercicios().includes(ejercicioId);
  }

  // Obtiene los detalles de un ejercicio por ID
  getEjercicioById(ejercicioId: string) {
    return this.ejercicios().find(e => e.id === ejercicioId);
  }

  // Obtiene la configuración de campos del formulario según el tipo de modal
  getFormFields(): FormFieldConfig[] {
    const type = this.modalType();

    switch (type) {
      case 'usuario':
        // Formulario simplificado para creación: solo email y contraseña
        if (this.isCreating()) {
          return [
            {
              name: 'email',
              type: 'text',
              inputType: 'email',
              label: 'Email',
              placeholder: 'email@ejemplo.com',
              colSpan: 2,
              required: true
            },
            {
              name: 'password',
              type: 'text',
              inputType: 'password',
              label: 'Contraseña',
              placeholder: 'Mínimo 6 caracteres',
              colSpan: 2,
              required: true
            }
          ];
        } else {
          // Formulario completo para edición
          return [
            {
              name: 'nombre',
              type: 'text',
              label: 'Nombre',
              placeholder: 'Nombre del usuario',
              colSpan: 2
            },
            {
              name: 'email',
              type: 'text',
              inputType: 'email',
              label: 'Email',
              placeholder: 'email@ejemplo.com',
              colSpan: 2,
              readonly: true // El email no se puede cambiar una vez creado
            },
            {
              name: 'role',
              type: 'select',
              label: 'Rol',
              placeholder: 'Seleccionar rol',
              options: this.getRolesDisponibles().map(rol => ({ value: rol, label: rol })),
              colSpan: 2
            },
            {
              name: 'emailVerified',
              type: 'checkbox',
              label: 'Estado del Email',
              checkboxLabel: 'Email Verificado',
              colSpan: 1
            },
            {
              name: 'onboarded',
              type: 'checkbox',
              label: 'Estado de Onboarding',
              checkboxLabel: 'Usuario Completó Onboarding',
              colSpan: 1
            },
            {
              name: 'plan',
              type: 'select',
              label: 'Plan de Suscripción',
              placeholder: 'Seleccionar plan',
              options: [
                { value: 'free', label: 'Gratuito' },
                { value: 'premium', label: 'Premium' }
              ],
              colSpan: 2
            }
          ];
        }

      case 'cliente':
        const clienteData = this.modalData();
        const usuarioAsociado = this.usuarios().find(u => u.uid === clienteData?.id);
        
        // Obtener rutinas asignadas a este cliente usando el método específico
        const rutinasAsignadasAlCliente = this.getRutinasAsignadasAlCliente(clienteData?.id || '');
        
        // Obtener información del gimnasio y entrenador para mostrar
        const gimnasioAsociado = clienteData?.gimnasioId ? this.gimnasios().find(g => g.id === clienteData.gimnasioId) : null;
        const entrenadorAsociado = clienteData?.entrenadorId ? this.entrenadores().find(e => e.id === clienteData.entrenadorId) : null;
        
        return [
          // Información básica del cliente (integrada con usuario)
          {
            name: 'nombre',
            type: 'text',
            label: 'Nombre del Cliente',
            placeholder: usuarioAsociado?.nombre || usuarioAsociado?.email || 'Nombre del cliente',
            readonly: true,
            colSpan: 1
          },
          {
            name: 'email',
            type: 'text',
            label: 'Email',
            placeholder: usuarioAsociado?.email || 'Email del cliente',
            readonly: true,
            colSpan: 1
          },
          
          // Plan del usuario (solo informativo)
          {
            name: 'planInfo',
            type: 'text',
            label: 'Plan de Suscripción',
            placeholder: usuarioAsociado?.plan ? (usuarioAsociado.plan === 'premium' ? 'Premium' : 'Gratuito') : 'Sin plan',
            readonly: true,
            colSpan: 2
          },
          
          // Información del gimnasio (solo lectura)
          {
            name: 'gimnasioInfo',
            type: 'text',
            label: 'Gimnasio Asociado',
            placeholder: gimnasioAsociado?.displayName || 'Sin gimnasio asignado',
            readonly: true,
            colSpan: 1
          },
          
          // Información del entrenador (solo lectura)
          {
            name: 'entrenadorInfo',
            type: 'text',
            label: 'Entrenador Asociado',
            placeholder: entrenadorAsociado?.displayName || 'Sin entrenador asignado',
            readonly: true,
            colSpan: 1
          },
          
          // Información del cliente (campos editables)
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
          
          // Fecha de registro
          {
            name: 'fechaRegistro',
            type: 'text',
            inputType: 'datetime-local',
            label: 'Fecha de Registro',
            placeholder: 'Fecha de registro',
            colSpan: 2
          },
          
          // Lista de rutinas simplificada
          {
            name: 'rutinasAsociadas',
            type: 'rutinas-simple',
            label: `Rutinas Asignadas (${rutinasAsignadasAlCliente.length})`,
            colSpan: 2,
            rutinas: rutinasAsignadasAlCliente
          }
        ];

      case 'entrenador':
        const entrenadorData = this.modalData();
        const usuarioEntrenador = this.usuarios().find(u => u.uid === entrenadorData?.id);
        const clientesEntrenador = this.getClientesByEntrenador(entrenadorData?.id || '');
        const rutinasEntrenador = this.getRutinasByEntrenador(entrenadorData?.id || '');
        const ejerciciosEntrenador = this.getEjerciciosByEntrenador(entrenadorData?.id || '');
        const gimnasioInfo = entrenadorData?.gimnasioId ? this.getGimnasioInfo(entrenadorData.gimnasioId) : null;
        
        return [
          // Información básica del entrenador (integrada con usuario)
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
          
          // Plan del usuario (solo informativo)
          {
            name: 'planInfo',
            type: 'text',
            label: 'Plan de Suscripción',
            placeholder: usuarioEntrenador?.plan ? (usuarioEntrenador.plan === 'premium' ? 'Premium' : 'Gratuito') : 'Sin plan',
            readonly: true,
            colSpan: 1
          },
          
          // Información del gimnasio (solo lectura)
          {
            name: 'gimnasioInfo',
            type: 'text',
            label: 'Gimnasio Asociado',
            placeholder: gimnasioInfo?.nombre || 'Sin gimnasio asignado',
            readonly: true,
            colSpan: 1
          },
          
          // Estado del entrenador
          {
            name: 'activo',
            type: 'checkbox',
            label: 'Estado',
            checkboxLabel: 'Entrenador Activo',
            colSpan: 2
          },
          
          // Lista de clientes asignados (solo nombres)
          {
            name: 'clientesAsignados',
            type: 'clientes-simple',
            label: `Clientes Asignados (${clientesEntrenador.length})`,
            colSpan: 2,
            clientes: clientesEntrenador.map(cliente => {
              const usuario = this.usuarios().find(u => u.uid === cliente.id);
              return {
                id: cliente.id,
                nombre: usuario?.nombre || usuario?.email || `Cliente ${cliente.id}`
              };
            })
          },
          
          // Selección múltiple de rutinas
          {
            name: 'rutinasAsociadas',
            type: 'rutinas-multiselect',
            label: `Rutinas del Entrenador (${rutinasEntrenador.length} disponibles)`,
            colSpan: 2,
            options: rutinasEntrenador.map(rutina => ({
              value: rutina.id,
              label: rutina.nombre,
              extra: this.usuarios().find(u => u.uid === rutina.clienteId)?.nombre || 'Sin cliente'
            }))
          },
          
          // Lista de ejercicios creados (solo lectura)
          {
            name: 'ejerciciosCreados',
            type: 'ejercicios-info',
            label: `Ejercicios Creados (${ejerciciosEntrenador.length})`,
            colSpan: 2,
            ejercicios: ejerciciosEntrenador
          }
        ];

      case 'rutina':
        return [
          {
            name: 'nombre',
            type: 'text',
            label: 'Nombre de la Rutina',
            placeholder: 'Nombre de la rutina',
            colSpan: 2
          },
          {
            name: 'estados',
            type: 'rutina-estados',
            label: 'Estados',
            colSpan: 2
          },
          {
            name: 'DiasSemana',
            type: 'dias-semana',
            label: 'Días de la Semana',
            colSpan: 2
          },
          // Información del creador
          {
            name: 'creadorId',
            type: 'select',
            label: 'Creador de la Rutina',
            placeholder: 'Seleccionar creador (opcional)',
            options: [
              { value: '', label: '-- Sin creador --' },
              // Filtrar usuarios que pueden crear rutinas (CLIENTE y ENTRENADOR)
              ...this.usuarios()
                .filter(user => user.role === Rol.CLIENTE || user.role === Rol.ENTRENADOR)
                .map(user => ({
                  value: user.uid,
                  label: `${user.nombre || user.email || user.uid} (${user.role})`
                }))
            ],
            colSpan: 1
          },
          {
            name: 'creadorTipo',
            type: 'select',
            label: 'Tipo de Creador',
            placeholder: 'Seleccionar tipo (opcional)',
            options: [
              { value: '', label: '-- Sin tipo --' },
              { value: Rol.CLIENTE, label: 'CLIENTE' },
              { value: Rol.ENTRENADOR, label: 'ENTRENADOR' }
            ],
            colSpan: 1
          },
          // Información del asignado (principal - reemplaza clienteId)
          {
            name: 'asignadoId',
            type: 'select',
            label: 'Asignado A (Cliente) *',
            placeholder: 'Seleccionar cliente',
            options: [
              // Solo clientes pueden ser asignados a rutinas
              ...this.usuarios()
                .filter(user => user.role === Rol.CLIENTE)
                .map(user => ({
                  value: user.uid,
                  label: `${user.nombre || user.email || user.uid}`
                }))
            ],
            colSpan: 1,
            required: true
          },
          {
            name: 'asignadoTipo',
            type: 'select',
            label: 'Tipo de Asignado',
            placeholder: 'Automático: Cliente',
            options: [
              { value: Rol.CLIENTE, label: 'CLIENTE' }
            ],
            colSpan: 1,
            required: true
          },
          {
            name: 'ejercicios',
            type: 'ejercicios-selector',
            label: `Ejercicios (${this.selectedEjercicios().length} seleccionados)`,
            colSpan: 2
          }
        ];

      case 'ejercicio':
        const ejercicioData = this.modalData();
        
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
          // Información del creador (solo clientes y entrenadores)
          {
            name: 'creadorId',
            type: 'select',
            label: 'Creador del Ejercicio',
            placeholder: 'Seleccionar creador (opcional)',
            options: [
              { value: '', label: '-- Sin creador --' },
              // Filtrar usuarios usando el método estático del servicio
              ...this.usuarios()
                .filter(user => EjercicioService.canCreateEjercicio(user.role as Rol))
                .map(user => ({
                  value: user.uid,
                  label: `${user.nombre || user.email || user.uid} (${user.role})`
                }))
            ],
            colSpan: 1
          },
          {
            name: 'creadorTipo',
            type: 'select',
            label: 'Tipo de Creador',
            placeholder: 'Seleccionar tipo (opcional)',
            options: [
              { value: '', label: '-- Sin tipo --' },
              // Usar método estático del servicio para obtener roles válidos
              ...EjercicioService.getRolesCreadores().map(rol => ({
                value: rol,
                label: rol
              }))
            ],
            colSpan: 1
          },
          // Información del asignado (solo clientes)
          {
            name: 'asignadoAId',
            type: 'select',
            label: 'Asignado A (Cliente)',
            placeholder: 'Seleccionar cliente (opcional)',
            options: [
              { value: '', label: '-- No asignado --' },
              // Filtrar usuarios usando el método estático del servicio
              ...this.usuarios()
                .filter(user => EjercicioService.canBeAssignedToEjercicio(user.role as Rol))
                .map(user => ({
                  value: user.uid,
                  label: `${user.nombre || user.email || user.uid}`
                }))
            ],
            colSpan: 1
          },
          {
            name: 'asignadoATipo',
            type: 'select',
            label: 'Tipo de Asignado',
            placeholder: 'Automático: Cliente',
            options: [
              { value: '', label: '-- Sin tipo --' },
              // Usar método estático del servicio para obtener roles asignables
              ...EjercicioService.getRolesAsignables().map(rol => ({
                value: rol,
                label: rol
              }))
            ],
            colSpan: 1
          }
        ];

      case 'gimnasio':
        const gimnasioData = this.modalData();
        const usuarioGimnasio = this.usuarios().find(u => u.uid === gimnasioData?.id);
        const entrenadoresGimnasio = this.getEntrenadoresByGimnasio(gimnasioData?.id || '');
        const entrenadoresDisponibles = this.getEntrenadoresDisponiblesParaGimnasio();
        const clientesGimnasio = this.getClientesByGimnasio(gimnasioData?.id || '');
        const clientesDisponibles = this.getClientesDisponiblesParaGimnasio();
        
        return [
          // Información del usuario asociado
          {
            name: 'usuarioInfo',
            type: 'user-info',
            label: 'Usuario Asociado',
            colSpan: 2,
            usuario: usuarioGimnasio
          },
          
          // Información básica del gimnasio
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
          
          // Selección múltiple de entrenadores
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
          
          // Selección múltiple de clientes
          {
            name: 'clientesAsociados',
            type: 'clientes-multiselect',
            label: `Clientes del Gimnasio (${clientesDisponibles.length} disponibles)`,
            colSpan: 2,
            options: clientesDisponibles.map(cliente => ({
              value: cliente.uid,
              label: cliente.nombre || cliente.email || `Cliente ${cliente.uid}`,
              extra: cliente.emailVerified ? 'Verificado' : 'Sin verificar'
            }))
          }
        ];

      default:
        return [];
    }
  }

  // Limpia campos undefined de un objeto
  private cleanUndefinedFields(obj: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined && value !== null) {
        // Para strings vacíos, solo incluir si es un campo requerido o si no está vacío
        if (typeof value === 'string' && value.trim() === '') {
          const requiredFields = ['id', 'nombre'];
          if (requiredFields.includes(key)) {
            cleaned[key] = value;
          }
          // Si es un string vacío y no es requerido, no lo incluimos
        } else {
          cleaned[key] = value;
        }
      }
      // Para campos undefined o null, los omitimos completamente
    }
    return cleaned;
  }

  /**
   * Maneja el cambio de rol creando el documento específico correspondiente
   */
  private async handleRoleChange(uid: string, newRole: Rol, userData: any): Promise<void> {
    try {
      switch (newRole) {
        case Rol.CLIENTE:
          // Crear documento cliente - solo campos requeridos y con valor
          const clienteData: any = {
            id: uid,
            activo: true,
            fechaRegistro: new Date(),
            objetivo: Objetivo.MANTENER_PESO
          };
          
          // Solo agregar gimnasioId si tiene un valor válido
          if (userData.gimnasioId && userData.gimnasioId !== '') {
            clienteData.gimnasioId = userData.gimnasioId;
          } else {
            // Si no hay gimnasioId, usar string vacío pero no undefined
            clienteData.gimnasioId = '';
          }
          
          await this.clienteService.save(clienteData);
          
          // Actualizar usuario con clienteId
          userData.clienteId = uid;
          
          this.log(`✅ Documento Cliente creado para usuario: ${userData.nombre || userData.email}`);
          break;

        case Rol.GIMNASIO:
          // Crear documento gimnasio
          const gimnasioData: Gimnasio = {
            id: uid,
            nombre: userData.nombre || userData.email || 'Gimnasio',
            direccion: '',
            activo: true
          };
          
          // Limpiar campos undefined antes de guardar
          const cleanGimnasioData = this.cleanUndefinedFields(gimnasioData);
          await this.gimnasioService.save(cleanGimnasioData);
          
          // Actualizar usuario con gimnasioId
          userData.gimnasioId = uid;
          
          this.log(`✅ Documento Gimnasio creado para usuario: ${userData.nombre || userData.email}`);
          break;

        case Rol.ENTRENADOR:
        case Rol.PERSONAL_TRAINER:
          // Crear documento entrenador usando el adaptador directamente a través del servicio
          const entrenadorData: any = {
            gimnasioId: '', // Se puede establecer después
            activo: true,
            clientes: [],
            rutinas: []
          };
          
          // Acceder al adaptador a través del servicio de forma correcta
          const entrenadorServiceAdapter = (this.entrenadorService as any).adapter;
          if (entrenadorServiceAdapter && entrenadorServiceAdapter.createWithId) {
            await entrenadorServiceAdapter.createWithId(uid, entrenadorData);
          } else {
            // Si no tiene createWithId, usar create normal y luego eliminar/recrear
            this.log(`⚠️ Usando método create normal para entrenador (se generará ID automático)`);
            const tempId = await this.entrenadorService.create(entrenadorData);
            
            // Eliminar el documento con ID temporal
            await this.entrenadorService.delete(tempId);
            
            // Crear nuevo documento con el ID correcto usando el adaptador
            if (entrenadorServiceAdapter) {
              // Usar setDoc a través del adaptador si es posible
              await entrenadorServiceAdapter.update(uid, entrenadorData);
            } else {
              throw new Error('No se puede acceder al adaptador de entrenador');
            }
          }
          
          // Actualizar usuario con entrenadorId
          userData.entrenadorId = uid;
          
          this.log(`✅ Documento Entrenador creado para usuario: ${userData.nombre || userData.email}`);
          break;

        default:
          this.log(`⚠️ Rol ${newRole} no requiere documento específico`);
          break;
      }
    } catch (error) {
      console.error('Error creando documento específico:', error);
      this.log(`❌ Error creando documento para rol ${newRole}: ${error}`);
      throw error;
    }
  }
}