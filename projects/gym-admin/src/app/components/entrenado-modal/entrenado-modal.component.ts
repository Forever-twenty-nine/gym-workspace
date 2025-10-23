import { Component, input, output, computed, inject, ChangeDetectionStrategy, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EntrenadoService, UserService, EntrenadorService, Rutina, RutinaAsignadaService, RutinaAsignada } from 'gym-library';

@Component({
  selector: 'app-entrenado-modal',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './entrenado-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadoModalComponent implements OnChanges {
  // Servicios inyectados
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly userService = inject(UserService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly rutinaAsignadaService = inject(RutinaAsignadaService);
  private readonly fb = inject(FormBuilder);

  // Inputs
  isOpen = input<boolean>(false);
  entrenadoId = input<string>('');
  entrenadorId = input<string>('');

  // Outputs
  close = output<void>();

  // Señales para asignación de rutinas
  readonly showAsignacionForm = signal(false);
  readonly rutinaSeleccionada = signal<Rutina | null>(null);
  readonly asignacionForm = signal<FormGroup | null>(null);
  readonly isAsignando = signal(false);

  // Opciones para días de la semana
  readonly diasSemanaOptions = [
    { value: 'lunes', label: 'Lunes' },
    { value: 'martes', label: 'Martes' },
    { value: 'miercoles', label: 'Miércoles' },
    { value: 'jueves', label: 'Jueves' },
    { value: 'viernes', label: 'Viernes' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ];

  // Fecha mínima para el date picker
  readonly today = new Date().toISOString().split('T')[0];

  // Computed para obtener el entrenado con información de usuario
  readonly entrenado = computed(() => {
    const id = this.entrenadoId();
    if (!id) return null;

    const entrenado = this.entrenadoService.entrenados().find(e => e.id === id);
    if (!entrenado) return null;

    const usuario = this.userService.users().find(u => u.uid === entrenado.id);
    return {
      ...entrenado,
      displayName: usuario?.nombre || usuario?.email || `Entrenado ${entrenado.id}`,
      email: usuario?.email || '',
      plan: usuario?.plan || 'free'
    };
  });

  // Método del ciclo de vida para detectar cambios en inputs
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entrenadoId'] && this.entrenadoId()) {
      // Inicializar listener de progreso de rutinas para este entrenado
      // Lógica de progreso eliminada. Si se requiere, usar SesionRutinaService o EstadisticasEntrenadoService.
    }
  }

  // Computed para obtener las rutinas del entrenador
  readonly rutinasEntrenador = computed(() => {
    const entrenadorId = this.entrenadorId();
    if (!entrenadorId) return [];
    return this.entrenadorService.getRutinasByEntrenador(entrenadorId)();
  });

  // Computed para separar rutinas asignadas y disponibles
  readonly rutinasAsignadas = computed(() => {
    const entrenadoId = this.entrenadoId();
    if (!entrenadoId) return [];
    return this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(entrenadoId)();
  });

  readonly rutinasDisponibles = computed(() => {
    const entrenado = this.entrenado();
    const rutinasEntrenador = this.rutinasEntrenador();
    if (!rutinasEntrenador) return [];

    const asignadasIds = this.rutinasAsignadas().map(ra => ra.rutinaId);
    return rutinasEntrenador.filter(rutina => !asignadasIds.includes(rutina.id));
  });

  // Computed para rutinas asignadas con información completa
  readonly rutinasAsignadasConInfo = computed(() => {
    const rutinasAsignadas = this.rutinasAsignadas();
    const rutinasEntrenador = this.rutinasEntrenador();

    return rutinasAsignadas.map(ra => {
      const rutina = rutinasEntrenador.find(r => r.id === ra.rutinaId);
      return {
        ...ra,
        rutina: rutina || null
      };
    }).filter(item => item.rutina !== null);
  });

  // Computed para rutinas completadas con información completa
  readonly rutinasCompletadasConInfo = computed(() => {
    const rutinasAsignadas = this.rutinasAsignadas();
    const rutinasEntrenador = this.rutinasEntrenador();

    return rutinasAsignadas
      .filter(ra => !ra.activa)
      .map(ra => {
        const rutina = rutinasEntrenador.find(r => r.id === ra.rutinaId);
        return {
          ...ra,
          rutina: rutina || null
        };
      })
      .filter(item => item.rutina !== null);
  });

    // Método para verificar si una rutina está asignada al entrenado
  isRutinaAsignada(rutinaId: string): boolean {
    return this.rutinasAsignadas().some(ra => ra.rutinaId === rutinaId);
  }

  // Mostrar formulario de asignación para una rutina
  onAsignarRutina(rutina: Rutina) {
    this.rutinaSeleccionada.set(rutina);
    this.asignacionForm.set(this.createAsignacionForm());
    this.showAsignacionForm.set(true);
  }

  // Ocultar formulario de asignación
  onCancelarAsignacion() {
    this.showAsignacionForm.set(false);
    this.rutinaSeleccionada.set(null);
    this.asignacionForm.set(null);
  }

  // Crear formulario de asignación
  private createAsignacionForm(): FormGroup {
    return this.fb.group({
      tipoAsignacion: ['dia', Validators.required], // 'dia' o 'fecha'
      diaSemana: [''],
      fechaEspecifica: ['']
    });
  }

  // Verificar si un día está seleccionado
  isDiaSelected(dia: string): boolean {
    const form = this.asignacionForm();
    if (!form) return false;
    const diasSeleccionados = form.get('diaSemana')?.value || [];
    return diasSeleccionados.includes(dia);
  }

  // Toggle día de la semana
  onToggleDia(dia: string) {
    const form = this.asignacionForm();
    if (!form) return;

    const diasActuales = form.get('diaSemana')?.value || [];
    let nuevosDias;
    if (diasActuales.includes(dia)) {
      nuevosDias = diasActuales.filter((d: string) => d !== dia);
    } else {
      nuevosDias = [...diasActuales, dia];
    }
    form.get('diaSemana')?.setValue(nuevosDias);
  }

  // Asignar rutina al entrenado
  async onConfirmarAsignacion() {
    const form = this.asignacionForm();
    const rutina = this.rutinaSeleccionada();
    const entrenadoId = this.entrenadoId();
    const entrenadorId = this.entrenadorId();

    if (!form?.valid || !rutina || !entrenadoId || !entrenadorId) {
      return;
    }

    const formValue = form.value;
    this.isAsignando.set(true);

    try {
      if (formValue.tipoAsignacion === 'dia') {
        // Si se seleccionaron múltiples días, crear una asignación para cada día
        const diasSeleccionados = Array.isArray(formValue.diaSemana) ? formValue.diaSemana : [formValue.diaSemana];

        for (const dia of diasSeleccionados) {
          if (dia) { // Solo crear asignación si el día no está vacío
            const rutinaAsignada: RutinaAsignada = {
              id: `ra${Date.now()}_${dia}`,
              rutinaId: rutina.id,
              entrenadoId: entrenadoId,
              entrenadorId: entrenadorId,
              fechaAsignacion: new Date(),
              activa: true,
              diaSemana: dia,
              fechaEspecifica: undefined
            };

            await this.rutinaAsignadaService.save(rutinaAsignada);
          }
        }
      } else {
        // Asignación por fecha específica
        const rutinaAsignada: RutinaAsignada = {
          id: `ra${Date.now()}`,
          rutinaId: rutina.id,
          entrenadoId: entrenadoId,
          entrenadorId: entrenadorId,
          fechaAsignacion: new Date(),
          activa: true,
          diaSemana: undefined,
          fechaEspecifica: formValue.tipoAsignacion === 'fecha' ? new Date(formValue.fechaEspecifica) : undefined
        };

        await this.rutinaAsignadaService.save(rutinaAsignada);
      }

      this.onCancelarAsignacion();
    } catch (error) {
      console.error('Error al asignar rutina:', error);
    } finally {
      this.isAsignando.set(false);
    }
  }

  // Desasignar rutina del entrenado
  async onDesasignarRutina(rutinaAsignada: RutinaAsignada) {
    if (!confirm('¿Estás seguro de que quieres desasignar esta rutina?')) {
      return;
    }

    try {
      await this.rutinaAsignadaService.delete(rutinaAsignada.id);
    } catch (error) {
      console.error('Error al desasignar rutina:', error);
    }
  }
}