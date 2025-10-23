import { Component, ChangeDetectionStrategy, inject, signal, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, computed, effect, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SesionRutinaService } from 'gym-library';
import { SesionRutina, Ejercicio } from 'gym-library';

interface EjercicioSesion {
  ejercicio: Ejercicio;
  completado: boolean;
  seriesCompletadas: number;
}

@Component({
  selector: 'app-rutina-sesion-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rutina-sesion.modal.html',
  changeDetection: ChangeDetectionStrategy.Default
})
export class RutinaSesionModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) rutinaId!: string;
  @Input({ required: true }) entrenadoId!: string;
  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();

  private readonly sesionRutinaService = inject(SesionRutinaService);
  private readonly ngZone = inject(NgZone);

  // Estado de la sesión
  readonly sesionActual = signal<SesionRutina | null>(null);
  readonly cronometroCorriendo = signal(false);
  readonly tiempoTranscurrido = signal(0); // en segundos
  readonly intervaloCronometro: any = null;

  // Estado de error
  readonly errorSesion = signal<string | null>(null);

  // Método para mostrar errores temporales
  private mostrarErrorTemporal(mensaje: string, duracionMs: number = 5000) {
    this.errorSesion.set(mensaje);
    setTimeout(() => {
      this.errorSesion.set(null);
    }, duracionMs);
  }

  // Sesión completa con rutina y ejercicios
  readonly sesionCompleta = computed(() => {
    const sesion = this.sesionActual();
    return sesion; // Ya incluye la rutina completa
  });

  readonly ejerciciosSesion = signal<EjercicioSesion[]>([]);

  // Computed signals
  readonly tiempoFormateado = computed(() => {
    try {
      return this.formatearTiempo(this.tiempoTranscurrido());
    } catch (error) {
      console.error('Error en tiempoFormateado:', error);
      return '00:00';
    }
  });

  readonly progresoSesion = computed(() => {
    try {
      const ejercicios = this.ejerciciosSesion();
      if (!Array.isArray(ejercicios)) return 0;

      const total = ejercicios.length;
      const completados = ejercicios.filter(e => e && e.completado).length;
      return total > 0 ? Math.round((completados / total) * 100) : 0;
    } catch (error) {
      console.error('Error en progresoSesion:', error);
      return 0;
    }
  });

  readonly sesionIniciada = computed(() => {
    try {
      return this.sesionActual() !== null;
    } catch (error) {
      console.error('Error en sesionIniciada:', error);
      return false;
    }
  });

  readonly sesionCompletada = computed(() => {
    try {
      const sesion = this.sesionActual();
      return sesion ? (sesion.completada ?? false) : false;
    } catch (error) {
      console.error('Error en sesionCompletada:', error);
      return false;
    }
  });

  readonly hayEjercicios = computed(() => {
    try {
      const ejercicios = this.ejerciciosSesion();
      return Array.isArray(ejercicios) && ejercicios.length > 0;
    } catch (error) {
      console.error('Error en hayEjercicios:', error);
      return false;
    }
  });

  // Estado del componente
  private componenteInicializado = false;

  constructor() {
    // Marcar como inicializado después de que todos los servicios estén disponibles
    this.componenteInicializado = true;

    // Efecto para cargar ejercicios cuando cambia la sesión
    effect(() => {
      // Solo ejecutar si el componente está completamente inicializado
      if (!this.componenteInicializado) return;

      const sesion = this.sesionCompleta();

      try {
        if (sesion && sesion.rutinaResumen && sesion.rutinaResumen.ejercicios && Array.isArray(sesion.rutinaResumen.ejercicios) && sesion.rutinaResumen.ejercicios.length > 0) {
          // Solo cargar si no hay ejercicios ya cargados para evitar sobrescribir progreso
          if (this.ejerciciosSesion().length === 0) {
            this.cargarEjerciciosDesdeDatos(sesion.rutinaResumen.ejercicios);
          }
        }
      } catch (error) {
        console.error('Error en effect de sesión:', error);
      }
    });
  }

  ngOnInit() {
    // Marcar como completamente inicializado
    this.componenteInicializado = true;
  }

  ngOnDestroy() {
    this.detenerCronometro();
  }

  ngOnChanges(changes: any) {
    // Cuando se abre el modal, preparar la información de la rutina pero NO crear sesión aún
    if (changes.open && changes.open.currentValue === true) {
      this.prepararInformacionRutina();
    }
  }

  private cargarEjerciciosDesdeDatos(ejercicios: Ejercicio[]) {
    if (!ejercicios || !Array.isArray(ejercicios) || ejercicios.length === 0) {
      console.warn('No hay ejercicios para cargar');
      return;
    }

    const ejerciciosSesion: EjercicioSesion[] = ejercicios.map(ejercicio => ({
      ejercicio,
      completado: false,
      seriesCompletadas: 0
    }));

    this.ejerciciosSesion.set(ejerciciosSesion);
  }

  // Método público para recargar ejercicios (útil para debugging)
  recargarEjercicios() {
    try {
      // Forzar recarga limpiando los ejercicios actuales
      this.ejerciciosSesion.set([]);
      // El effect reactivo se encargará de recargar automáticamente desde la sesión completa
    } catch (error) {
      console.error('Error en recargarEjercicios:', error);
    }
  }

  // Método público para recargar la información de la rutina
  recargarRutina() {
    this.prepararInformacionRutina();
  }

  private formatearTiempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  }

  private iniciarCronometro() {
    if (!this.cronometroCorriendo()) {
      this.cronometroCorriendo.set(true);
      const intervalo = setInterval(() => {
        this.tiempoTranscurrido.update(t => t + 1);
      }, 1000);
      (this as any).intervaloCronometro = intervalo;
    }
  }

  private detenerCronometro() {
    if (this.cronometroCorriendo()) {
      this.cronometroCorriendo.set(false);
      if ((this as any).intervaloCronometro) {
        clearInterval((this as any).intervaloCronometro);
        (this as any).intervaloCronometro = null;
      }
    }
  }

  private reiniciarCronometro() {
    this.detenerCronometro();
    this.tiempoTranscurrido.set(0);
  }

  private async prepararInformacionRutina() {
    try {
      this.errorSesion.set(null);
      // Obtener los ejercicios de la rutina sin crear sesión
      const ejercicios = await this.sesionRutinaService.getEjerciciosByRutinaId(this.rutinaId);
      if (ejercicios && ejercicios.length > 0) {
        this.cargarEjerciciosDesdeDatos(ejercicios);
      }
    } catch (error) {
      console.error('Error al preparar información de rutina:', error);
      this.errorSesion.set('Error al cargar la información de la rutina.');
    }
  }

  private async prepararSesion() {
    try {
      await this.ngZone.run(async () => {
        const nuevaSesion = await this.sesionRutinaService.inicializarSesionRutina(this.entrenadoId, this.rutinaId);
        await this.sesionRutinaService.crearSesion(nuevaSesion);
        this.sesionActual.set(nuevaSesion);
        // NO iniciar cronómetro automáticamente
      });
    } catch (error) {
      console.error('Error al preparar sesión:', error);
    }
  }

  async iniciarSesion() {
    try {
      // Si no hay sesión creada, crearla primero
      if (!this.sesionActual()) {
        await this.prepararSesion();
      }

      // Iniciar el cronómetro
      this.iniciarCronometro();
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  }

  toggleEjercicioCompletado(index: number) {
    if (!this.cronometroCorriendo() || this.sesionCompletada()) return;

    this.ejerciciosSesion.update(ejercicios => {
      const nuevosEjercicios = [...ejercicios];
      const ejercicio = nuevosEjercicios[index];

      if (!ejercicio.completado) {
        ejercicio.completado = true;
        ejercicio.seriesCompletadas = ejercicio.ejercicio.series;
      } else {
        ejercicio.completado = false;
        ejercicio.seriesCompletadas = 0;
      }

      return nuevosEjercicios;
    });

    // Actualizar contador de ejercicios completados en la sesión
    this.actualizarProgresoSesion();
  }

  private actualizarProgresoSesion() {
    const ejerciciosCompletados = this.ejerciciosSesion().filter(e => e.completado).length;
    const totalEjercicios = this.ejerciciosSesion().length;
    const porcentaje = totalEjercicios > 0 ? Math.round((ejerciciosCompletados / totalEjercicios) * 100) : 0;
    const sesion = this.sesionActual();
    if (sesion) {
      sesion.porcentajeCompletado = porcentaje;
      this.ngZone.run(() => {
        this.sesionRutinaService.actualizarSesion(sesion);
      });
    }
  }

  async completarSesion() {
    if (!this.sesionActual()) return;

    try {
      // Limpiar cualquier error anterior
      this.errorSesion.set(null);

      const fechaFin = new Date();
      const duracion = this.tiempoTranscurrido();

      await this.ngZone.run(async () => {
        await this.sesionRutinaService.completarSesion(
          this.sesionActual()!,
          fechaFin,
          duracion
        );
      });

      this.detenerCronometro();
      this.sesionActual.update(sesion => sesion ? { ...sesion, completada: true, fechaFin, duracion } : null);
    } catch (error) {
      console.error('Error al completar sesión:', error);
      this.mostrarErrorTemporal('Error al completar la sesión. Verifica tu conexión e inténtalo de nuevo.');
      // No detener el cronómetro ni cambiar el estado de la sesión en caso de error
    }
  }

  reiniciarSesion() {
    this.reiniciarCronometro();
    this.sesionActual.set(null);
    this.ejerciciosSesion.update(ejercicios =>
      ejercicios.map(e => ({ ...e, completado: false, seriesCompletadas: 0 }))
    );
    this.errorSesion.set(null);
  }

  closeModal() {
    this.detenerCronometro();
    this.openChange.emit(false);
  }
}
