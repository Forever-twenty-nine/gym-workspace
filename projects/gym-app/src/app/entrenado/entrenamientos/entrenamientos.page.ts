import { Component, OnInit, signal, inject, computed, effect, Injector, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  fitnessOutline, 
  playOutline, 
  timeOutline, 
  flameOutline, 
  calendarOutline, 
  bodyOutline,
  trophyOutline,
  checkmarkCircle,
  chevronForwardOutline,
  close,
  checkmarkCircleOutline,
  closeCircleOutline,
  listOutline,
  documentTextOutline,
  pauseOutline,
  stopOutline,
  timerOutline
} from 'ionicons/icons';
import { RutinaService, AuthService, EjercicioService, Rol, Rutina, Ejercicio } from 'gym-library';

@Component({
  selector: 'app-entrenamientos',
  templateUrl: './entrenamientos.page.html',
  styleUrls: ['./entrenamientos.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonChip
  ],
})
export class EntrenamientosPage implements OnInit, OnDestroy {
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private ejercicioService = inject(EjercicioService);
  private injector = inject(Injector);

  // Señal para todas las rutinas
  private todasLasRutinas = signal<Rutina[]>([]);

  // Señales para el modal
  rutinaSeleccionada = signal<any>(null);
  modalAbierto = signal<boolean>(false);

  // Señales para el cronómetro
  cronometroActivo = signal<boolean>(false);
  cronometroPausado = signal<boolean>(false);
  tiempoTranscurrido = signal<number>(0); // en segundos
  rutinaEnCurso = signal<any>(null);
  private intervaloId: any = null;
  private tiempoInicio: number = 0;

  // Computed para rutinas del entrenado actual
  rutinas = computed(() => {
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.uid;
    const rutinas = this.todasLasRutinas();
    
    if (!userId || !rutinas.length) return [];
    
    // Filtrar rutinas asignadas a este entrenado
    // Buscar en ambos campos: asignadoId (nuevo) y entrenadoId (legacy)
    return rutinas.filter(rutina => {
      const coincideId = rutina.asignadoId === userId || rutina.entrenadoId === userId;
      const coincideTipo = !rutina.asignadoTipo || rutina.asignadoTipo === Rol.ENTRENADO;
      return coincideId && coincideTipo;
    });
  });

  constructor() {
    addIcons({ 
      fitnessOutline, 
      playOutline, 
      timeOutline, 
      flameOutline, 
      calendarOutline, 
      bodyOutline,
      trophyOutline,
      checkmarkCircle,
      chevronForwardOutline,
      close,
      checkmarkCircleOutline,
      closeCircleOutline,
      listOutline,
      documentTextOutline,
      pauseOutline,
      stopOutline,
      timerOutline
    });
  }

  ngOnInit() {
    // Sincronizar rutinas del servicio
    effect(() => {
      const rutinas = this.rutinaService.rutinas();
      this.todasLasRutinas.set(rutinas);
    }, { injector: this.injector });
  }

  /**
   * Formatea los días de la semana de números a nombres
   */
  formatearDiasSemana(dias?: number[]): string {
    if (!dias || dias.length === 0) return 'Sin días asignados';
    
    const diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias.map(dia => diasNombres[dia] || 'N/A').join(', ');
  }

  /**
   * Formatea una fecha
   */
  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'Sin fecha';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Calcula las calorías estimadas basado en duración
   */
  calcularCaloriasEstimadas(duracion?: number): number {
    if (!duracion) return 0;
    // Estimación aproximada: 7-8 calorías por minuto de entrenamiento
    return Math.round(duracion * 7.5);
  }

  /**
   * Obtiene el objeto ejercicio completo a partir de su ID
   */
  getEjercicioById(ejercicioId: string): Ejercicio | undefined {
    return this.ejercicioService.ejercicios().find(ej => ej.id === ejercicioId);
  }

  /**
   * Computed que convierte los IDs de ejercicios de la rutina seleccionada a objetos completos
   */
  ejerciciosCompletos = computed(() => {
    const rutina = this.rutinaSeleccionada();
    if (!rutina?.ejercicios) return [];
    
    const todosEjercicios = this.ejercicioService.ejercicios();
    
    // Si los ejercicios son strings (IDs), buscar los objetos completos
    return rutina.ejercicios
      .map((ej: any) => {
        if (typeof ej === 'string') {
          return todosEjercicios.find(ejercicio => ejercicio.id === ej);
        }
        return ej; // Ya es un objeto completo
      })
      .filter((ej: any) => ej !== undefined); // Filtrar ejercicios no encontrados
  });

  /**
   * Abre el modal con los detalles de la rutina
   */
  abrirDetalles(rutina: any): void {
    this.rutinaSeleccionada.set(rutina);
    this.modalAbierto.set(true);
  }

  /**
   * Abre el modal desde el botón "Ver más" (previene propagación)
   */
  verDetalles(event: Event, rutina: any): void {
    event.stopPropagation();
    this.abrirDetalles(rutina);
  }

  /**
   * Cierra el modal
   */
  cerrarModal(): void {
    this.modalAbierto.set(false);
    // Pequeño delay antes de limpiar la rutina para evitar parpadeos
    setTimeout(() => {
      this.rutinaSeleccionada.set(null);
    }, 300);
  }

  iniciarEntrenamiento(rutina: any) {
    // Iniciar cronómetro
    this.rutinaEnCurso.set(rutina);
    this.cronometroActivo.set(true);
    this.cronometroPausado.set(false);
    this.tiempoTranscurrido.set(0);
    this.tiempoInicio = Date.now();
    
    // Iniciar el intervalo del cronómetro
    this.intervaloId = setInterval(() => {
      if (!this.cronometroPausado()) {
        const tiempoActual = Math.floor((Date.now() - this.tiempoInicio) / 1000);
        this.tiempoTranscurrido.set(tiempoActual);
      }
    }, 1000);
    
    // Cerrar modal si está abierto
    if (this.modalAbierto()) {
      this.cerrarModal();
    }
  }

  pausarCronometro() {
    this.cronometroPausado.set(!this.cronometroPausado());
    
    if (!this.cronometroPausado()) {
      // Al reanudar, ajustar el tiempo de inicio
      const tiempoTranscurridoMs = this.tiempoTranscurrido() * 1000;
      this.tiempoInicio = Date.now() - tiempoTranscurridoMs;
    }
  }

  detenerCronometro() {
    if (this.intervaloId) {
      clearInterval(this.intervaloId);
      this.intervaloId = null;
    }
    
    this.cronometroActivo.set(false);
    this.cronometroPausado.set(false);
    this.tiempoTranscurrido.set(0);
    this.rutinaEnCurso.set(null);
  }

  finalizarEntrenamiento() {
    const tiempoFinal = this.tiempoTranscurrido();
    const rutina = this.rutinaEnCurso();
    
    // Detener cronómetro
    this.detenerCronometro();
    
    // Marcar rutina como completada
    if (rutina) {
      this.marcarCompletado(rutina);
    }
    
    console.log(`✅ Entrenamiento finalizado en ${this.formatearTiempoCronometro(tiempoFinal)}`);
  }

  /**
   * Formatea el tiempo del cronómetro en formato HH:MM:SS
   */
  formatearTiempoCronometro(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    const horasStr = horas.toString().padStart(2, '0');
    const minutosStr = minutos.toString().padStart(2, '0');
    const segsStr = segs.toString().padStart(2, '0');
    
    return `${horasStr}:${minutosStr}:${segsStr}`;
  }

  async marcarCompletado(rutina: any) {
    try {
      // Actualizar el estado de completado
      const rutinaActualizada: Rutina = {
        ...rutina,
        completado: !rutina.completado
      };
      
      await this.rutinaService.save(rutinaActualizada);
      
      // Si el modal está abierto, actualizar la rutina seleccionada
      if (this.modalAbierto() && this.rutinaSeleccionada()?.id === rutina.id) {
        this.rutinaSeleccionada.set(rutinaActualizada);
      }
    } catch (error) {
      console.error('Error al marcar rutina como completada:', error);
    }
  }

  ngOnDestroy() {
    // Limpiar el intervalo del cronómetro al destruir el componente
    if (this.intervaloId) {
      clearInterval(this.intervaloId);
    }
  }
}
