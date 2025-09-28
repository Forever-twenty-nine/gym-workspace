import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClienteService } from './services/cliente.service';
import { RutinaService } from './services/rutina.service';
import { EjercicioService } from './services/ejercicio.service';
import { UserService } from './services/user.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Rutina, Rol } from 'gym-library';
import { CommonModule } from '@angular/common';
/** 
 * Interfaz para la configuración de campos del formulario dinámico
  */
interface FormFieldConfig {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'dias-semana' | 'ejercicios-selector' | 'rutina-estados';
  label: string;
  icon: string;
  placeholder?: string;
  colSpan?: number;
  inputType?: string;
  min?: number;
  step?: number;
  rows?: number;
  options?: { value: any; label: string }[];
  checkboxLabel?: string;
}


@Component({
  selector: 'app-root',
  imports: [ CommonModule, ReactiveFormsModule],
  templateUrl: './app.html'
})
export class App {
  /**
  * Servicios
  */
  private clienteService = inject(ClienteService);
  private rutinaService = inject(RutinaService);
  private ejercicioService = inject(EjercicioService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  /**
   * Clientes
   */
  clientes = this.clienteService.obtenerClientes();
  rutinas = this.rutinaService.obtenerRutinas();
  ejercicios = this.ejercicioService.obtenerEjercicios();
  usuarios = this.userService.users;

  constructor() {
    // Componente inicializado
  }

  // Logs locales como señal mutable
  logs = signal<string[]>([]);

  // Estado del modal
  isModalOpen = signal(false);
  modalData = signal<any>(null);
  modalType = signal<string>('');
  editForm = signal<FormGroup | null>(null);
  isLoading = signal(false);
  isCreating = signal(false);
  selectedEjercicios = signal<string[]>([]);

  /**
   * Conjunto (Map) reactivo de rutinas indexado por id.
   * Ejemplo de uso: `conjuntoRutinas().get(rutinaId)`
   */
  conjuntoRutinas = computed(() => {
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
    await this.clienteService.eliminarCliente(id);
    this.log(`Cliente eliminado: ${id}`);
  }

  /**
   * Crea una rutina de muestra basado en los ejercicios que ya existen
   * @return void
   */
  async addSampleRutina() {

    if (!this.canCreateRutina()) {
      this.log(`❌ ${this.getRutinaValidationMessage()}`);
      return;
    }

    this.openCreateModal('rutina');
  }

  /**
   * Elimina una rutina por su ID.
   * @param id El ID de la rutina a eliminar.
   */
  async deleteRutina(id: string) {
    await this.rutinaService.eliminarRutina(id);
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
    await this.ejercicioService.eliminarEjercicio(id);
    this.log(`Ejercicio eliminado: ${id}`);
  }

  /**
   * Crea un usuario de muestra
   * @returns void
   */
  async addSampleUsuario() {
    this.openCreateModal('usuario');
  }



  /**
   * Elimina un usuario por su ID.
   * @param id El ID del usuario a eliminar.
   * @returns void
   */
  async deleteUsuario(id: string) {
    await this.userService.removeUser(id);
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
          gimnasioId: 'g-default'
        };
      case 'cliente':
        return {
          id: 'c' + timestamp,
          gimnasioId: 'g-default',
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
          gimnasioId: [item.gimnasioId || '']
        };
        break;

      case 'cliente':
        formConfig = {
          gimnasioId: [item.gimnasioId || ''],
          activo: [item.activo || false],
          objetivo: [item.objetivo || '']
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
      this.log('❌ Formulario inválido o datos faltantes');
      return;
    }

    form.markAllAsTouched();

    if (type === 'rutina' && this.isCreating()) {
      const clienteId = form.get('clienteId')?.value;
      const entrenadorId = form.get('entrenadorId')?.value;

      if (!clienteId) {
        this.log('❌ Debes seleccionar un cliente para la rutina');
        return;
      }

      if (!entrenadorId) {
        this.log('❌ Debes seleccionar un entrenador para la rutina');
        return;
      }
    }

    if (!form.valid) {
      this.log('❌ Por favor, completa todos los campos obligatorios');
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
          this.log(`✅ Usuario ${this.isCreating() ? 'creado' : 'actualizado'}: ${updatedData.nombre}`);
          break;

        case 'cliente':
          await this.clienteService.guardarCliente(updatedData);
          this.log(`✅ Cliente ${this.isCreating() ? 'creado' : 'actualizado'}: ${updatedData.id}`);
          break;

        case 'rutina':
          await this.rutinaService.guardarRutina(updatedData);
          const clienteNombre = updatedData.clienteId ? this.getClienteName(updatedData.clienteId) : 'Sin cliente';
          const entrenadorNombre = updatedData.entrenadorId ? this.getEntrenadorName(updatedData.entrenadorId) : 'Sin entrenador';
          this.log(`✅ Rutina ${this.isCreating() ? 'creada' : 'actualizada'}: ${updatedData.nombre} - Cliente: ${clienteNombre} - Entrenador: ${entrenadorNombre} - Ejercicios: ${updatedData.ejercicios.length}`);
          break;

        case 'ejercicio':
          await this.ejercicioService.guardarEjercicio(updatedData);
          this.log(`✅ Ejercicio ${this.isCreating() ? 'creado' : 'actualizado'}: ${updatedData.nombre}`);
          break;
      }

      this.closeModal();
    } catch (error) {
      console.error('Error al guardar:', error);
      this.log(`❌ Error al guardar los cambios: ${error}`);
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

  /**
   * �🏢 Obtiene los roles disponibles
   */
  getRolesDisponibles() {
    return Object.values(Rol);
  }

  /**
   * 📅 Maneja el toggle de días de la semana en rutinas
   */
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
   * 🏋️ Maneja la selección/deselección de ejercicios para rutinas
   */
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

  /**
   * 🔍 Verifica si un ejercicio está seleccionado
   */
  isEjercicioSelected(ejercicioId: string): boolean {
    return this.selectedEjercicios().includes(ejercicioId);
  }

  /**
   * 🏋️ Obtiene los detalles de un ejercicio por ID
   */
  getEjercicioById(ejercicioId: string) {
    return this.ejercicios().find(e => e.id === ejercicioId);
  }

  /**
   * 🔧 Obtiene la configuración de campos del formulario según el tipo de modal
   */
  getFormFields(): FormFieldConfig[] {
    const type = this.modalType();

    switch (type) {
      case 'usuario':
        return [
          {
            name: 'nombre',
            type: 'text',
            label: 'Nombre',
            icon: '📝',
            placeholder: 'Nombre del usuario',
            colSpan: 2
          },
          {
            name: 'email',
            type: 'text',
            inputType: 'email',
            label: 'Email',
            icon: '📧',
            placeholder: 'email@ejemplo.com',
            colSpan: 2
          },
          {
            name: 'role',
            type: 'select',
            label: 'Rol',
            icon: '👥',
            placeholder: 'Seleccionar rol',
            options: this.getRolesDisponibles().map(rol => ({ value: rol, label: rol })),
            colSpan: 1
          },
          {
            name: 'gimnasioId',
            type: 'text',
            label: 'Gimnasio ID',
            icon: '🏢',
            placeholder: 'ID del gimnasio',
            colSpan: 1
          }
        ];

      case 'cliente':
        return [
          {
            name: 'gimnasioId',
            type: 'text',
            label: 'Gimnasio ID',
            icon: '🏢',
            placeholder: 'ID del gimnasio',
            colSpan: 1
          },
          {
            name: 'activo',
            type: 'checkbox',
            label: 'Estado',
            icon: '✅',
            checkboxLabel: 'Cliente Activo',
            colSpan: 1
          },
          {
            name: 'objetivo',
            type: 'textarea',
            label: 'Objetivo',
            icon: '🎯',
            placeholder: 'Objetivo del cliente...',
            rows: 3,
            colSpan: 2
          }
        ];

      case 'rutina':
        return [
          {
            name: 'nombre',
            type: 'text',
            label: 'Nombre de la Rutina',
            icon: '📋',
            placeholder: 'Nombre de la rutina',
            colSpan: 2
          },
          {
            name: 'clienteId',
            type: 'select',
            label: 'Cliente',
            icon: '👤',
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
            icon: '🏃‍♂️',
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
            icon: '⚙️',
            colSpan: 2
          },
          {
            name: 'DiasSemana',
            type: 'dias-semana',
            label: 'Días de la Semana',
            icon: '📅',
            colSpan: 2
          },
          {
            name: 'ejercicios',
            type: 'ejercicios-selector',
            label: `Ejercicios (${this.selectedEjercicios().length} seleccionados)`,
            icon: '🏋️',
            colSpan: 2
          }
        ];

      case 'ejercicio':
        return [
          {
            name: 'nombre',
            type: 'text',
            label: 'Nombre del Ejercicio',
            icon: '🏋️',
            placeholder: 'Nombre del ejercicio',
            colSpan: 2
          },
          {
            name: 'descripcion',
            type: 'textarea',
            label: 'Descripción',
            icon: '📝',
            placeholder: 'Descripción del ejercicio...',
            rows: 2,
            colSpan: 2
          },
          {
            name: 'series',
            type: 'text',
            inputType: 'number',
            label: 'Series',
            icon: '🔢',
            placeholder: 'Número de series',
            min: 1,
            colSpan: 1
          },
          {
            name: 'repeticiones',
            type: 'text',
            inputType: 'number',
            label: 'Repeticiones',
            icon: '🔁',
            placeholder: 'Repeticiones por serie',
            min: 1,
            colSpan: 1
          },
          {
            name: 'peso',
            type: 'text',
            inputType: 'number',
            label: 'Peso (kg)',
            icon: '⚖️',
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
            icon: '⏱️',
            placeholder: 'Duración por serie',
            min: 0,
            colSpan: 1
          },
          {
            name: 'descansoSegundos',
            type: 'text',
            inputType: 'number',
            label: 'Descanso (seg)',
            icon: '😴',
            placeholder: 'Tiempo de descanso entre series',
            min: 0,
            colSpan: 2
          }
        ];

      default:
        return [];
    }
  }

  /**
   * 🧹 Limpia campos undefined de un objeto
   */
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