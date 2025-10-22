import { Component, ChangeDetectionStrategy, inject, signal, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, computed, effect } from '@angular/core';
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

  // Estado de la sesión
  readonly sesionActual = signal<SesionRutina | null>(null);
  readonly cronometroCorriendo = signal(false);
  readonly tiempoTranscurrido = signal(0); // en segundos
  readonly intervaloCronometro: any = null;

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
        if (sesion && sesion.rutina && sesion.rutina.ejerciciosIds && Array.isArray(sesion.rutina.ejerciciosIds) && sesion.rutina.ejerciciosIds.length > 0) {
          // Solo cargar si no hay ejercicios ya cargados para evitar sobrescribir progreso
          if (this.ejerciciosSesion().length === 0) {
            this.cargarEjerciciosDesdeIds(sesion.rutina.ejerciciosIds);
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
    // Cuando se abre el modal, crear una nueva sesión si no existe
    if (changes.open && changes.open.currentValue === true && !this.sesionActual()) {
      this.iniciarSesion();
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

  async iniciarSesion() {
    try {
      const nuevaSesion: SesionRutina = {
        id: crypto.randomUUID(),
        entrenadoId: this.entrenadoId,
        rutinaId: this.rutinaId,
        fechaInicio: new Date(),
        ejerciciosCompletados: 0,
        completada: false
      };

      await this.sesionRutinaService.crearSesion(nuevaSesion);
      this.sesionActual.set(nuevaSesion);
      this.iniciarCronometro();
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  }

  toggleEjercicioCompletado(index: number) {
    if (!this.sesionIniciada() || this.sesionCompletada()) return;

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
    const sesion = this.sesionActual();
    if (sesion) {
      sesion.ejerciciosCompletados = ejerciciosCompletados;
      this.sesionRutinaService.actualizarSesion(sesion);
    }
  }

  async completarSesion() {
    if (!this.sesionActual()) return;

    try {
      const fechaFin = new Date();
      const duracion = this.tiempoTranscurrido();

      await this.sesionRutinaService.completarSesion(
        this.sesionActual()!.id,
        fechaFin,
        duracion
      );

      this.detenerCronometro();
      this.sesionActual.update(sesion => sesion ? { ...sesion, completada: true, fechaFin, duracion } : null);
    } catch (error) {
      console.error('Error al completar sesión:', error);
    }
  }

  reiniciarSesion() {
    this.reiniciarCronometro();
    this.sesionActual.set(null);
    this.ejerciciosSesion.update(ejercicios =>
      ejercicios.map(e => ({ ...e, completado: false, seriesCompletadas: 0 }))
    );
  }

  closeModal() {
    this.detenerCronometro();
    this.openChange.emit(false);
  }
}
