import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ClienteService, RutinaService, EjercicioService, UserService, EntrenadorService, GimnasioService, User, Cliente, Entrenador, Gimnasio } from 'gym-library';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Rutina, Rol, Objetivo } from 'gym-library';
import { CommonModule } from '@angular/common';

// Importar componentes
import { GenericCardComponent, CardConfig } from './components/shared/generic-card/generic-card.component';
import { LogsSectionComponent } from './components/logs-section/logs-section.component';
import { ModalFormComponent, FormFieldConfig } from './components/modal-form/modal-form.component';

// Importar adaptador de autenticación
import { FirebaseAuthAdapter } from './adapters/firebase-auth.adapter';



@Component({
  selector: 'app-root',
  imports: [ 
    CommonModule, 
    ReactiveFormsModule,
    GenericCardComponent,
    LogsSectionComponent,
    ModalFormComponent
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
  readonly rutinas = this.rutinaService.rutinas;
  readonly ejercicios = this.ejercicioService.ejercicios;
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
      return {
        ...cliente,
        displayName: usuario?.nombre || usuario?.email || `Cliente ${cliente.id}`
      };
    });
  });

  readonly entrenadores = computed(() => {
    // Agregar displayName a cada entrenador basado en el usuario asociado
    return this.entrenadorService.entrenadores().map(entrenador => {
      const usuario = this.usuarios().find(u => u.uid === entrenador.id);
      return {
        ...entrenador,
        displayName: usuario?.nombre || usuario?.email || `Entrenador ${entrenador.id}`
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
    counterColor: 'green'
  };

  readonly entrenadoresCardConfig: CardConfig = {
    title: 'Entrenadores',
    createButtonText: 'N/A', // No se usa porque canCreate será false
    createButtonColor: 'orange',
    emptyStateTitle: 'No hay entrenadores registrados',
    displayField: 'displayName', // Mostrar el nombre del entrenador
    showCounter: true,
    counterColor: 'orange'
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
    counterColor: 'purple'
  };

  readonly ejerciciosCardConfig: CardConfig = {
    title: 'Ejercicios',
    createButtonText: 'Crear Ejercicio',
    createButtonColor: 'orange',
    emptyStateTitle: 'No hay ejercicios creados',
    displayField: 'nombre',
    showCounter: true,
    counterColor: 'orange'
  };





  // Signals para el estado del componente
  readonly logs = signal<string[]>([]);
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

  private log(msg: string) {
    this.logs.update(l => [msg, ...l].slice(0, 100));
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
          clienteId: '',
          entrenadorId: '',
          fechaAsignacion: new Date(),
          ejercicios: [],
          activa: true,
          DiasSemana: [],
          completado: false
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
          activo: true
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
            onboarded: [item.onboarded || false]
          };
        }
        break;

      case 'cliente':
        formConfig = {
          // Campo informativo (no se incluye en el form)
          usuarioInfo: [{ value: '', disabled: true }],
          
          // Campos editables
          gimnasioId: [item.gimnasioId || '', [Validators.required]],
          entrenadorId: [item.entrenadorId || '', [Validators.required]],
          activo: [item.activo || false],
          objetivo: [item.objetivo || ''],
          fechaRegistro: [item.fechaRegistro ? new Date(item.fechaRegistro).toISOString().slice(0, 16) : ''],
          
          // Campo para rutinas (solo informativo)
          rutinasAsociadas: [{ value: '', disabled: true }]
        };
        break;

      case 'rutina':
        formConfig = {
          nombre: [item.nombre || '', [Validators.required]],
          clienteId: [item.clienteId || '', [Validators.required]],
          entrenadorId: [item.entrenadorId || '', [Validators.required]],
          activa: [item.activa || false],
          completado: [item.completado || false],
          DiasSemana: [item.DiasSemana || []]
        };
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
          descripcion: [item.descripcion || '']
        };
        break;

      case 'gimnasio':
        formConfig = {
          nombre: [item.nombre || '', [Validators.required]],
          direccion: [item.direccion || '', [Validators.required]],
          activo: [item.activo || true]
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
      const clienteId = form.get('clienteId')?.value;
      const entrenadorId = form.get('entrenadorId')?.value;

      if (!clienteId) {
        this.log('Error: Debes seleccionar un cliente para la rutina');
        return;
      }

      if (!entrenadorId) {
        this.log('Error: Debes seleccionar un entrenador para la rutina');
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

        case 'rutina':
          await this.rutinaService.save(updatedData);
          const clienteNombre = updatedData.clienteId ? this.getClienteName(updatedData.clienteId) : 'Sin cliente';
          const entrenadorNombre = updatedData.entrenadorId ? this.getEntrenadorName(updatedData.entrenadorId) : 'Sin entrenador';
          this.log(`Rutina ${this.isCreating() ? 'creada' : 'actualizada'}: ${updatedData.nombre} - Cliente: ${clienteNombre} - Entrenador: ${entrenadorNombre} - Ejercicios: ${updatedData.ejercicios.length}`);
          break;

        case 'ejercicio':
          await this.ejercicioService.save(updatedData);
          this.log(`Ejercicio ${this.isCreating() ? 'creado' : 'actualizado'}: ${updatedData.nombre}`);
          break;

        case 'gimnasio':
          await this.gimnasioService.save(updatedData);
          this.log(`Gimnasio ${this.isCreating() ? 'creado' : 'actualizado'}: ${updatedData.nombre}`);
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
    return this.getClientesDisponibles().length > 0 && this.getEntrenadoresDisponibles().length > 0;
  }

  /**
   * Obtiene el mensaje de validación para crear rutinas
   * @return string
   */
  getRutinaValidationMessage(): string {
    const clientes = this.getClientesDisponibles().length;
    const entrenadores = this.getEntrenadoresDisponibles().length;

    if (clientes === 0 && entrenadores === 0) {
      return 'Necesitas crear al menos un cliente y un entrenador para poder crear rutinas';
    } else if (clientes === 0) {
      return 'Necesitas crear al menos un cliente para poder crear rutinas';
    } else if (entrenadores === 0) {
      return 'Necesitas crear al menos un entrenador para poder crear rutinas';
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
            }
          ];
        }

      case 'cliente':
        const clienteData = this.modalData();
        const usuarioAsociado = this.usuarios().find(u => u.uid === clienteData?.id);
        const rutinasCliente = this.rutinas().filter(r => r.clienteId === clienteData?.id);
        
        return [
          // Información del usuario asociado (solo para mostrar contexto)
          {
            name: 'usuarioInfo',
            type: 'user-info',
            label: 'Usuario Asociado',
            colSpan: 2,
            usuario: usuarioAsociado
          },
          
          // Selección de gimnasio
          {
            name: 'gimnasioId',
            type: 'select',
            label: 'Gimnasio',
            placeholder: 'Seleccionar gimnasio',
            options: this.getGimnasiosDisponibles().map(gimnasio => ({
              value: gimnasio.uid,
              label: gimnasio.nombre || gimnasio.email || `Gimnasio ${gimnasio.uid}`
            })),
            colSpan: 1,
            required: true
          },
          
          // Selección de entrenador
          {
            name: 'entrenadorId',
            type: 'select',
            label: 'Entrenador',
            placeholder: 'Seleccionar entrenador',
            options: this.getEntrenadoresDisponibles().map(entrenador => ({
              value: entrenador.uid,
              label: entrenador.nombre || entrenador.email || `Entrenador ${entrenador.uid}`
            })),
            colSpan: 1,
            required: true
          },
          
          // Información del cliente
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
          
          // Lista de rutinas
          {
            name: 'rutinasAsociadas',
            type: 'rutinas-info',
            label: `Rutinas Asignadas (${rutinasCliente.length})`,
            colSpan: 2,
            rutinas: rutinasCliente
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
            name: 'clienteId',
            type: 'select',
            label: 'Cliente',
            placeholder: 'Seleccionar cliente',
            options: this.getClientesDisponibles().map(cliente => ({
              value: cliente.uid,
              label: cliente.nombre || cliente.email || `Usuario ${cliente.uid}`
            })),
            colSpan: 1
          },
          {
            name: 'entrenadorId',
            type: 'select',
            label: 'Entrenador',
            placeholder: 'Seleccionar entrenador',
            options: this.getEntrenadoresDisponibles().map(entrenador => ({
              value: entrenador.uid,
              label: entrenador.nombre || entrenador.email || `Entrenador ${entrenador.uid}`
            })),
            colSpan: 1
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
          {
            name: 'ejercicios',
            type: 'ejercicios-selector',
            label: `Ejercicios (${this.selectedEjercicios().length} seleccionados)`,
            colSpan: 2
          }
        ];

      case 'ejercicio':
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
          }
        ];

      case 'gimnasio':
        return [
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
        // Para strings vacíos, solo incluir si es un campo requerido
        if (typeof value === 'string' && value === '') {
          const requiredFields = ['id', 'nombre', 'fechaAsignacion', 'activa', 'completado'];
          if (requiredFields.includes(key)) {
            cleaned[key] = value;
          }
        } else {
          cleaned[key] = value;
        }
      }
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