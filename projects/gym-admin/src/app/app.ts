import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ClienteService, RutinaService, EjercicioService, UserService } from 'gym-library';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Rutina, Rol, Objetivo } from 'gym-library';
import { CommonModule } from '@angular/common';

// Importar componentes
import { GenericCardComponent, CardConfig } from './components/shared/generic-card/generic-card.component';
import { LogsSectionComponent } from './components/logs-section/logs-section.component';
import { ModalFormComponent, FormFieldConfig } from './components/modal-form/modal-form.component';



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
  private readonly fb = inject(FormBuilder);

  // Signals reactivas para datos
  readonly rutinas = this.rutinaService.rutinas;
  readonly ejercicios = this.ejercicioService.ejercicios;
  readonly usuarios = computed(() => {
    // Agregar un campo displayName para mostrar en el card
    return this.userService.users().map(user => ({
      ...user,
      displayName: user.nombre || user.email || `Usuario ${user.uid}`
    }));
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
    createButtonText: 'Crear Cliente',
    createButtonColor: 'green',
    emptyStateTitle: 'No hay clientes registrados',
    displayField: 'displayName', // Mostrar el nombre del cliente
    showCounter: true,
    counterColor: 'green'
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
          nombre: '',
          email: '',
          role: '',
          emailVerified: false,
          onboarded: false
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
        formConfig = {
          nombre: [item.nombre || ''],
          email: [item.email || ''],
          role: [item.role || ''],
          emailVerified: [item.emailVerified || false],
          onboarded: [item.onboarded || false]
        };
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
          await this.userService.addUser(updatedData);
          this.log(`Usuario ${this.isCreating() ? 'creado' : 'actualizado'}: ${updatedData.nombre}`);
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
            colSpan: 2
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
}