import { Component, OnInit, signal, inject, computed, effect, Injector } from '@angular/core';
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
  listOutline
} from 'ionicons/icons';
import { RutinaService, AuthService, Rol, Rutina } from 'gym-library';

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
    IonModal
  ],
})
export class EntrenamientosPage implements OnInit {
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private injector = inject(Injector);

  // Señal para todas las rutinas
  private todasLasRutinas = signal<Rutina[]>([]);

  // Señales para el modal
  rutinaSeleccionada = signal<any>(null);
  modalAbierto = signal<boolean>(false);

  // Computed para rutinas del entrenado actual
  rutinas = computed(() => {
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.uid;
    const rutinas = this.todasLasRutinas();
    
    if (!userId || !rutinas.length) return [];
    
    // Filtrar solo las rutinas asignadas a este entrenado
    return rutinas.filter(rutina => 
      rutina.asignadoId === userId && rutina.asignadoTipo === Rol.ENTRENADO
    );
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
      listOutline
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
    // Lógica para iniciar la rutina
    console.log('Iniciar rutina:', rutina);
    // Cerrar modal si está abierto
    if (this.modalAbierto()) {
      this.cerrarModal();
    }
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
}
