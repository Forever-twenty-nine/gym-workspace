import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonProgressBar,
  IonText,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  statsChartOutline,
  timeOutline,
  flameOutline,
  calendarOutline,
  checkmarkCircleOutline,
  fitnessOutline,
  trophyOutline
} from 'ionicons/icons';
import {
  ProgresoService,
  RutinaService,
  AuthService,
  EntrenadoService
} from 'gym-library';

@Component({
  selector: 'app-progreso',
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
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonProgressBar,
    IonText,
    IonIcon
  ],
  templateUrl: './progreso.page.html',
  styleUrls: ['./progreso.page.css']
})
export class ProgresoPage implements OnInit {
  private readonly progresoService = inject(ProgresoService);
  private readonly rutinaService = inject(RutinaService);
  private readonly authService = inject(AuthService);
  private readonly entrenadoService = inject(EntrenadoService);

  // Estado de carga
  readonly isLoading = signal(false);

  constructor() {
    addIcons({
      statsChartOutline,
      timeOutline,
      flameOutline,
      calendarOutline,
      checkmarkCircleOutline,
      fitnessOutline,
      trophyOutline
    });
  }

  ngOnInit() {
    // Los datos se cargan automáticamente a través de los computed signals
  }

  // Datos computados
  rutinasAsignadas = computed(() => {
    const currentUser = this.authService.currentUser;
    const userId = currentUser()?.uid;
    const rutinas = this.rutinaService.rutinas;
    const entrenados = this.entrenadoService.entrenados;
    const entrenado = entrenados().find((e: any) => e.id === userId);

    if (!userId || !rutinas().length || !entrenado?.rutinasAsignadas) return [];

    return rutinas().filter(rutina => entrenado.rutinasAsignadas!.includes(rutina.id));
  });

  progresoRutinas = computed(() => {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return [];

    return this.rutinasAsignadas().map(rutina => {
      const progreso = this.progresoService.getProgresoRutina(userId, rutina.id);
      return {
        rutina,
        progreso
      };
    });
  });

  estadisticasGenerales = computed(() => {
    const progresoData = this.progresoRutinas();
    const rutinasAsignadas = this.rutinasAsignadas();

    const rutinasCompletadas = progresoData.filter(p => p.progreso()?.completado).length;
    const rutinasEnProgreso = progresoData.filter(p => p.progreso() && !p.progreso()?.completado).length;
    const rutinasNoIniciadas = rutinasAsignadas.length - rutinasCompletadas - rutinasEnProgreso;

    // Calcular tiempo total entrenado
    const tiempoTotal = progresoData.reduce((total: number, p) => {
      const progresoValue = p.progreso();
      if (progresoValue?.sesiones) {
        return total + progresoValue.sesiones.reduce((sesionTotal: number, sesion: any) => sesionTotal + (sesion.duracion || 0), 0);
      }
      return total;
    }, 0);

    // Calcular porcentaje general de progreso
    const totalEjercicios = rutinasAsignadas.reduce((total: number, rutina) => {
      return total + (rutina.ejerciciosIds?.length || 0);
    }, 0);

    const ejerciciosCompletados = progresoData.reduce((total: number, p) => {
      return total + (p.progreso()?.ejerciciosCompletados?.length || 0);
    }, 0);

    const porcentajeGeneral = totalEjercicios > 0 ? Math.round((ejerciciosCompletados / totalEjercicios) * 100) : 0;

    return {
      rutinasAsignadas: rutinasAsignadas.length,
      rutinasCompletadas,
      rutinasEnProgreso,
      rutinasNoIniciadas,
      tiempoTotal,
      porcentajeGeneral,
      totalEjercicios,
      ejerciciosCompletados
    };
  });

  // Utilidades
  formatearTiempo(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    if (horas > 0) {
      return `${horas}h ${mins}m`;
    }
    return `${mins}m`;
  }

  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'Sin fecha';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getEstadoRutina(progreso: any): string {
    const progresoValue = progreso?.();
    if (progresoValue?.completado) return 'Completada';
    if (progresoValue?.fechaInicio) return 'En progreso';
    return 'No iniciada';
  }

  getColorEstado(progreso: any): string {
    const progresoValue = progreso?.();
    if (progresoValue?.completado) return 'success';
    if (progresoValue?.fechaInicio) return 'primary';
    return 'medium';
  }

  getProgresoRutina(progreso: any, rutina: any): number {
    const progresoValue = progreso?.();
    if (!progresoValue?.ejerciciosCompletados || !rutina?.ejerciciosIds) return 0;
    const total = rutina.ejerciciosIds.length;
    const completados = progresoValue.ejerciciosCompletados.length;
    return total > 0 ? Math.round((completados / total) * 100) : 0;
  }
}