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
  changeDetection: ChangeDetectionStrategy.Default,
  host: {
    '(document:click)': 'onDocumentClick()',
    '(keydown.escape)': 'cerrarMenuCompartir()'
  }
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
  readonly compartiendoRutina = signal(false);
  readonly cronometroCorriendo = signal(false);
  readonly tiempoTranscurrido = signal(0); // en segundos
  readonly intervaloCronometro: any = null;
  readonly cargandoEjercicios = signal(false);
  readonly mostrarMenuCompartir = signal(false);

  // Estado de error
  readonly errorSesion = signal<string | null>(null);

  // Reintentos de carga inicial
  private intentosCarga = 0;
  private readonly maxIntentosCarga = 6; // ~ varios segundos de espera total
  private cargaTimeout: any = null;

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
    this.cancelarReintentos();
  }

  ngOnChanges(changes: any) {
    // Cuando se abre el modal, preparar la información de la rutina pero NO crear sesión aún
    if (changes.open && changes.open.currentValue === true) {
      // Limpiar estado anterior
      this.ejerciciosSesion.set([]);
      this.sesionActual.set(null);
      this.errorSesion.set(null);
      this.cargandoEjercicios.set(true);
      this.intentosCarga = 0;
      this.cancelarReintentos();
      
      // Cargar ejercicios
      this.prepararInformacionRutina();
    }
    
    // Cuando se cierra el modal, limpiar estado
    if (changes.open && changes.open.currentValue === false) {
      this.detenerCronometro();
      this.reiniciarCronometro();
      this.ejerciciosSesion.set([]);
      this.sesionActual.set(null);
      this.errorSesion.set(null);
      this.cargandoEjercicios.set(false);
      this.intentosCarga = 0;
      this.cancelarReintentos();
      this.mostrarMenuCompartir.set(false);
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
    this.ejerciciosSesion.set([]);
    this.errorSesion.set(null);
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
    // Guardas básicas: requerimos IDs válidos
    if (!this.rutinaId || !this.entrenadoId) {
      return;
    }

    this.errorSesion.set(null);
    this.cargandoEjercicios.set(true);
    this.intentosCarga++;

    try {
      // Obtener los ejercicios de la rutina sin crear sesión
      const ejercicios = await this.sesionRutinaService.getEjerciciosByRutinaId(this.rutinaId);

      if (Array.isArray(ejercicios) && ejercicios.length > 0) {
        this.cargarEjerciciosDesdeDatos(ejercicios);
        this.cargandoEjercicios.set(false);
        return;
      }

      // Si no hay ejercicios, puede ser que la rutina aún no se haya cargado en memoria
      throw new Error('NO_EJERCICIOS');
    } catch (error: any) {
      // Si aún está abierto el modal, reintentar con backoff antes de mostrar error
      const puedeReintentar = this.open && this.intentosCarga < this.maxIntentosCarga;
      if (puedeReintentar) {
        const delay = 200 * Math.pow(2, this.intentosCarga - 1); // 200, 400, 800, 1600, ...
        this.programarReintento(delay);
        return;
      }

      console.error('Error al preparar información de rutina:', error);
      this.errorSesion.set('Error al cargar la información de la rutina.');
      this.cargandoEjercicios.set(false);
    }
  }

  private programarReintento(delayMs: number) {
    this.cancelarReintentos();
    this.cargaTimeout = setTimeout(() => {
      // Solo reintentar si el modal sigue abierto
      if (this.open) {
        this.prepararInformacionRutina();
      }
    }, Math.min(delayMs, 2000));
  }

  private cancelarReintentos() {
    if (this.cargaTimeout) {
      clearTimeout(this.cargaTimeout);
      this.cargaTimeout = null;
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

  async compartirRutina(platform: 'instagram' | 'facebook' | 'twitter' | 'whatsapp') {
    if (this.compartiendoRutina()) return;

    const sesion = this.sesionActual();
    if (!sesion || !sesion.completada) {
      this.mostrarErrorTemporal('Solo puedes compartir rutinas completadas.');
      return;
    }

    // Ocultar menú al iniciar
    this.mostrarMenuCompartir.set(false);

    this.compartiendoRutina.set(true);

    try {
      // Generar imagen personalizada con datos de la sesión
      const blob = await this.generarImagenSesion(sesion);
      
      // Compartir la imagen
      if (navigator.share && navigator.canShare({ files: [new File([blob], 'sesion-rutina.png', { type: 'image/png' })] })) {
        const file = new File([blob], 'sesion-rutina.png', { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: '¡Rutina completada!',
          text: `¡Completé mi rutina "${sesion.rutinaResumen.nombre}"! 💪`,
        });
      } else {
        // Descargar imagen
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rutina-${sesion.rutinaResumen.nombre.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      console.log('Rutina compartida exitosamente en', platform);
    } catch (error) {
      console.error('Error al compartir rutina:', error);
      this.mostrarErrorTemporal('Error al compartir la rutina. Inténtalo de nuevo.');
    } finally {
      this.compartiendoRutina.set(false);
    }
  }

  // Control del menú de compartir
  toggleMenuCompartir(event?: Event) {
    if (event) event.stopPropagation();
    if (this.compartiendoRutina()) return;
    this.mostrarMenuCompartir.update(v => !v);
  }

  cerrarMenuCompartir() {
    this.mostrarMenuCompartir.set(false);
  }

  onDocumentClick() {
    this.cerrarMenuCompartir();
  }

  private async generarImagenSesion(sesion: SesionRutina): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No se pudo obtener el contexto del canvas');
    }

    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3a8a'); // blue-900
    gradient.addColorStop(1, '#7c3aed'); // purple-600
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('¡Rutina Completada! 🎉', canvas.width / 2, 120);

    // Nombre de la rutina
    ctx.font = 'bold 48px Arial';
    ctx.fillText(sesion.rutinaResumen.nombre, canvas.width / 2, 200);

    // Estadísticas de la sesión
    const stats = [
      { label: 'Tiempo', value: this.formatearTiempo(sesion.duracion || 0), icon: '⏱️' },
      { label: 'Ejercicios', value: `${this.ejerciciosSesion().filter(e => e.completado).length}/${this.ejerciciosSesion().length}`, icon: '💪' },
      { label: 'Completado', value: `${sesion.porcentajeCompletado || 100}%`, icon: '✅' },
      { label: 'Fecha', value: new Date(sesion.fechaFin!).toLocaleDateString('es-AR'), icon: '📅' }
    ];

    let yPos = 320;
    const boxWidth = 450;
    const boxHeight = 100;
    const spacing = 20;

    stats.forEach((stat, index) => {
      if (index % 2 === 0) {
        // Columna izquierda
        this.dibujarCajaStat(ctx, 100, yPos, boxWidth, boxHeight, stat);
      } else {
        // Columna derecha
        this.dibujarCajaStat(ctx, 530, yPos, boxWidth, boxHeight, stat);
        yPos += boxHeight + spacing;
      }
    });

    // Mensaje motivacional
    yPos += 60;
    ctx.font = 'italic 28px Arial';
    ctx.fillStyle = '#fbbf24'; // yellow-400
    ctx.fillText('¡Sigue así! Cada día eres más fuerte 💯', canvas.width / 2, yPos);

    // Watermark
    yPos = canvas.height - 120;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, yPos, canvas.width, 120);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Exportá tu progreso completo en PDF', canvas.width / 2, yPos + 40);
    ctx.fillText('— desbloqueá con Premium', canvas.width / 2, yPos + 75);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al generar la imagen'));
          }
        },
        'image/png',
        0.95
      );
    });
  }

  private dibujarCajaStat(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, stat: { label: string, value: string, icon: string }) {
    // Fondo de la caja
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x, y, width, height);

    // Borde
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Icono
    ctx.font = '32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(stat.icon, x + 20, y + 50);

    // Label
    ctx.font = '20px Arial';
    ctx.fillStyle = '#e5e7eb'; // gray-200
    ctx.fillText(stat.label, x + 70, y + 35);

    // Value
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(stat.value, x + 70, y + 70);
  }

  closeModal() {
    this.detenerCronometro();
    this.openChange.emit(false);
  }
}
