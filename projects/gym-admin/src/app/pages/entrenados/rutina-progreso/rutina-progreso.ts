import { Component, ChangeDetectionStrategy, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  EntrenadoService,
  UserService,
  RutinaService,
  ProgresoService,
  Entrenado,
  Rutina,
  ProgresoRutina,
  EstadisticasEntrenado,
  EjercicioService
} from 'gym-library';
import { ToastComponent } from '../../../components/shared/toast/toast.component';
import { ToastService } from '../../../services/toast.service';
import { PageTitleService } from '../../../services/page-title.service';

@Component({
  selector: 'app-rutina-progreso',
  imports: [
    CommonModule,
    FormsModule,
    ToastComponent
  ],
  templateUrl: './rutina-progreso.html',
  changeDetection: ChangeDetectionStrategy.Default
})
export class RutinaProgresoComponent implements OnInit, OnDestroy {

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly toastService = inject(ToastService);
  private readonly pageTitleService = inject(PageTitleService);
  readonly entrenadoService = inject(EntrenadoService);
  private readonly userService = inject(UserService);
  private readonly rutinaService = inject(RutinaService);
  private readonly progresoService = inject(ProgresoService);
  private readonly ejercicioService = inject(EjercicioService);

  // Parámetros de ruta
  entrenadoId = signal<string>('');
  rutinaId = signal<string>('');

  // Estado del componente
  readonly isLoading = signal(false);
  readonly tiempoTranscurrido = signal('00:00'); // Valor inicial
  readonly cronometroActivo = signal(false);
  readonly rutinaLocalIniciada = signal(false);
  readonly ejerciciosCompletadosLocal = signal<string[]>([]); // Estado optimista local
  private intervaloCronometro?: number;
  private segundosTranscurridos = 0;

  // Datos computados
  entrenado = computed(() => {
    const id = this.entrenadoId();
    const entrenado = this.entrenadoService.entrenados().find(e => e.id === id);
    if (!entrenado) return null;

    const usuario = this.userService.users().find(u => u.uid === entrenado.id);
    return {
      ...entrenado,
      displayName: usuario?.nombre || usuario?.email || `Entrenado ${entrenado.id}`,
      email: usuario?.email || ''
    };
  });

  rutina = computed(() => {
    const id = this.rutinaId();
    return this.rutinaService.rutinas().find(r => r.id === id) || null;
  });

  ejercicios = computed(() => {
    const rutina = this.rutina();
    if (!rutina?.ejerciciosIds) return [];
    return rutina.ejerciciosIds
      .map(id => this.ejercicioService.ejercicios().find(e => e.id === id))
      .filter((e): e is any => e !== undefined); // Filtrar undefined
  });

  progreso = computed(() => {
    const entrenadoId = this.entrenadoId();
    const rutinaId = this.rutinaId();
    return this.progresoService.getProgresoRutina(entrenadoId, rutinaId)();
  });

  estadisticas = computed(() => {
    const id = this.entrenadoId();
    return this.progresoService.getEstadisticas(id)();
  });

  // Estados computados
  readonly rutinaIniciada = computed(() => {
    // Considera inicio local inmediato (optimista) o el progreso persistido
    return this.rutinaLocalIniciada() || !!this.progreso()?.fechaInicio;
  });
  readonly rutinaCompletada = computed(() => !!this.progreso()?.completado);
  readonly ejerciciosTotales = computed(() => this.ejercicios().length);
  readonly ejerciciosCompletados = computed(() => this.ejerciciosCompletadosLocal().length);
  readonly porcentajeProgreso = computed(() => {
    const total = this.ejerciciosTotales();
    const completados = this.ejerciciosCompletados();
    return total > 0 ? Math.round((completados / total) * 100) : 0;
  });

  readonly mostrarCronometro = computed(() => {
    return this.cronometroActivo() || (this.rutinaIniciada() && !this.rutinaCompletada());
  });

  ngOnInit() {
    const entrenadoId = this.route.snapshot.paramMap.get('entrenadoId');
    const rutinaId = this.route.snapshot.paramMap.get('rutinaId');

    if (entrenadoId && rutinaId) {
      this.entrenadoId.set(entrenadoId);
      this.rutinaId.set(rutinaId);

      // Inicializar estado local desde la base de datos con polling para asegurar que esté disponible
      this.inicializarEstadoLocal();

      // Iniciar cronómetro si la rutina está en progreso
      if (this.progreso()?.fechaInicio && !this.progreso()?.completado) {
        this.iniciarCronometro();
      }

      // Actualizar título de página
      const entrenado = this.entrenado();
      const rutina = this.rutina();
      if (entrenado && rutina) {
        this.pageTitleService.setTitle(`${rutina.nombre} - ${entrenado.displayName}`);
      }
    } else {
      this.router.navigate(['/entrenados']);
    }
  }

  ngOnDestroy() {
    if (this.intervaloCronometro) {
      clearInterval(this.intervaloCronometro);
    }
  }

  // --------------------------------------------
  // Inicialización de estado local
  // --------------------------------------------

  private async inicializarEstadoLocal() {
    // Esperar hasta que el progreso esté disponible (máximo 2 segundos)
    const maxRetries = 20;
    const delayMs = 100;

    for (let i = 0; i < maxRetries; i++) {
      const progresoActual = this.progreso();
      if (progresoActual) {
        // Inicializar estado local desde la base de datos
        if (progresoActual.ejerciciosCompletados) {
          this.ejerciciosCompletadosLocal.set([...progresoActual.ejerciciosCompletados]);
        }

        // Inicializar estado de rutina
        if (progresoActual.fechaInicio && !progresoActual.completado) {
          this.rutinaLocalIniciada.set(true);
        }

        console.log('Estado local inicializado desde base de datos:', {
          ejerciciosCompletados: this.ejerciciosCompletadosLocal(),
          rutinaIniciada: this.rutinaLocalIniciada()
        });
        break;
      }

      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // --------------------------------------------
  // Gestión de la rutina
  // --------------------------------------------

  async iniciarRutina() {
    try {
      await this.progresoService.iniciarRutina(this.entrenadoId(), this.rutinaId());
      this.toastService.log('Rutina iniciada correctamente');
      // Marcar inicio localmente para que la UI reaccione inmediatamente
      this.rutinaLocalIniciada.set(true);
      this.iniciarCronometro();
    } catch (error: any) {
      console.error('Error al iniciar rutina:', error);
      this.toastService.log(`ERROR: ${error.message}`);
    }
  }

  async completarRutina() {
    if (!this.rutinaIniciada()) {
      this.toastService.log('No puedes completar una rutina que no ha sido iniciada');
      return;
    }

    // Verificar que todos los ejercicios estén completados usando estado local
    if (this.ejerciciosCompletados() < this.ejerciciosTotales()) {
      this.toastService.log('Debes completar todos los ejercicios antes de finalizar la rutina');
      return;
    }

    try {
      // calcular duración en minutos basados en el cronómetro local
      const duracionMinutos = Math.round(this.segundosTranscurridos / 60);
      await this.progresoService.completarRutina(this.entrenadoId(), this.rutinaId(), duracionMinutos);
      this.toastService.log('¡Rutina completada! 🎉');
      this.detenerCronometro();
      // Reset del estado del cronómetro al completar
      this.tiempoTranscurrido.set('00:00');
      this.segundosTranscurridos = 0;
      // limpiar el inicio local
      this.rutinaLocalIniciada.set(false);
      // Reset de ejercicios completados
      this.ejerciciosCompletadosLocal.set([]);
    } catch (error: any) {
      console.error('Error al completar rutina:', error);
      this.toastService.log(`ERROR: ${error.message}`);
    }
  }

  async reiniciarRutina() {
    try {
      await this.progresoService.reiniciarRutina(this.entrenadoId(), this.rutinaId());
      this.toastService.log('Rutina reiniciada');
      this.detenerCronometro();
      // Reset completo del estado del cronómetro
      this.cronometroActivo.set(false);
      this.tiempoTranscurrido.set('00:00');
      this.segundosTranscurridos = 0;
      // limpiar el inicio local
      this.rutinaLocalIniciada.set(false);
      // Reset de ejercicios completados
      this.ejerciciosCompletadosLocal.set([]);
    } catch (error: any) {
      console.error('Error al reiniciar rutina:', error);
      this.toastService.log(`ERROR: ${error.message}`);
    }
  }

  // --------------------------------------------
  // Gestión de ejercicios
  // --------------------------------------------

  async toggleEjercicio(ejercicioId: string) {
    if (!this.rutinaIniciada()) {
      this.toastService.log('Primero debes iniciar la rutina');
      return;
    }

    // Actualización optimista local inmediata
    const completadosActuales = this.ejerciciosCompletadosLocal();
    const estaCompletado = completadosActuales.includes(ejercicioId);
    const nuevosCompletados = estaCompletado
      ? completadosActuales.filter(id => id !== ejercicioId)
      : [...completadosActuales, ejercicioId];

    // Actualizar estado local inmediatamente para UI responsiva
    this.ejerciciosCompletadosLocal.set(nuevosCompletados);

    // Mostrar feedback inmediato
    this.toastService.log(estaCompletado ? 'Ejercicio desmarcado' : 'Ejercicio completado ✓');

    // Sincronización en segundo plano con el servicio
    try {
      // Asegurarnos de que el progreso existe antes de sincronizar
      let progresoActual = this.progreso();
      if (!progresoActual) {
        console.log('Creando progreso automáticamente antes de sincronizar ejercicio...');
        await this.progresoService.iniciarRutina(this.entrenadoId(), this.rutinaId());
        
        // Esperar un poco a que se propague
        await new Promise(resolve => setTimeout(resolve, 100));
        progresoActual = this.progreso();
      }

      if (progresoActual) {
        if (estaCompletado) {
          await this.progresoService.descompletarEjercicio(
            this.entrenadoId(),
            this.rutinaId(),
            ejercicioId,
            this.ejerciciosTotales()
          );
        } else {
          await this.progresoService.completarEjercicio(
            this.entrenadoId(),
            this.rutinaId(),
            ejercicioId,
            this.ejerciciosTotales()
          );
        }
      } else {
        throw new Error('No se pudo crear el progreso automáticamente');
      }
    } catch (error: any) {
      console.error('Error al sincronizar ejercicio:', error, {
        entrenadoId: this.entrenadoId(),
        rutinaId: this.rutinaId(),
        ejercicioId,
        progresoActual: this.progreso()
      });
      // Revertir cambio local si falla la sincronización
      this.ejerciciosCompletadosLocal.set(completadosActuales);
      // Mostrar error más prominente
      this.toastService.log(`⚠️ Error de sincronización: ${error.message}. Cambios revertidos.`);
      // Restaurar mensaje anterior
      this.toastService.log(estaCompletado ? 'Ejercicio completado ✓' : 'Ejercicio desmarcado');
    }
  }

  isEjercicioCompletado(ejercicioId: string): boolean {
    return this.ejerciciosCompletadosLocal().includes(ejercicioId);
  }

  // --------------------------------------------
  // Cronómetro
  // --------------------------------------------

  private iniciarCronometro() {
    if (this.intervaloCronometro) {
      clearInterval(this.intervaloCronometro);
    }

    this.cronometroActivo.set(true);
    this.tiempoTranscurrido.set('00:00');
    this.segundosTranscurridos = 0;

    this.intervaloCronometro = setInterval(() => {
      this.segundosTranscurridos++;
      const minutos = Math.floor(this.segundosTranscurridos / 60);
      const segundos = this.segundosTranscurridos % 60;
      const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
      this.tiempoTranscurrido.set(tiempoFormateado);
    }, 1000);
  }

  private detenerCronometro() {
    if (this.intervaloCronometro) {
      clearInterval(this.intervaloCronometro);
      this.intervaloCronometro = undefined;
    }
    this.cronometroActivo.set(false);
  }

  // --------------------------------------------
  // Navegación
  // --------------------------------------------

  goBack() {
    this.router.navigate(['/entrenados', this.entrenadoId()]);
  }

  // --------------------------------------------
  // Utilidades
  // --------------------------------------------

  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'Sin fecha';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoRutina(): string {
    if (this.rutinaCompletada()) return 'Completada';
    if (this.rutinaIniciada()) return 'En progreso';
    return 'No iniciada';
  }

  getColorEstado(): string {
    if (this.rutinaCompletada()) return 'text-green-600';
    if (this.rutinaIniciada()) return 'text-blue-600';
    return 'text-gray-500';
  }
}
