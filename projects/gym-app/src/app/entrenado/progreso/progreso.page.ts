import { Component, OnInit, signal, inject, computed } from '@angular/core';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonText,
  AlertController
} from '@ionic/angular/standalone';
import { RutinaService } from '../../core/services/rutina.service';
import { AuthService } from '../../core/services/auth.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { SesionRutinaService } from '../../core/services/sesion-rutina.service';
import { ProgresoEstadisticasComponent } from './components/progreso-estadisticas/progreso-estadisticas.component';
import { ProgresoHistorialComponent } from './components/progreso-historial/progreso-historial.component';

@Component({
  selector: 'app-progreso',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonText,
    ProgresoEstadisticasComponent,
    ProgresoHistorialComponent
  ],
  templateUrl: './progreso.page.html',
})
export class ProgresoPage implements OnInit {
  private readonly rutinaService = inject(RutinaService);
  private readonly authService = inject(AuthService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly sesionRutinaService = inject(SesionRutinaService);
  private readonly alertController = inject(AlertController);

  // Estado de carga
  readonly isLoading = signal(false);

  constructor() { }

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

    if (!userId || !rutinas().length || !entrenado?.rutinasAsignadasIds) return [];

    return rutinas().filter(rutina => entrenado.rutinasAsignadasIds!.includes(rutina.id));
  });

  historialSesiones = computed(() => {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return [];

    const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(userId)();

    // Ordenar de más reciente a más antigua
    return sesiones.sort((a, b) => {
      const dateA = a.fechaInicio instanceof Date ? a.fechaInicio : new Date(a.fechaInicio);
      const dateB = b.fechaInicio instanceof Date ? b.fechaInicio : new Date(b.fechaInicio);
      return dateB.getTime() - dateA.getTime();
    });
  });

  estadisticasGenerales = computed(() => {
    const sesiones = this.historialSesiones();
    const rutinasAsignadas = this.rutinasAsignadas();

    const sesionesCompletadas = sesiones.filter(s => s.completada).length;
    const sesionesEnProgreso = sesiones.filter(s => !s.completada).length;

    // Calcular tiempo total entrenado (asumiendo duracion en segundos en las sesiones completadas, pasar a minutos)
    const tiempoTotalSegundos = sesiones.reduce((total: number, sesion) => {
      return total + (sesion.duracion || 0);
    }, 0);

    const tiempoTotal = Math.round(tiempoTotalSegundos / 60);

    // Consideramos una generalización para ejercicios totales basados en lo asignado,
    // o simplemente las stats de las sesiones hechas.
    const totalEntrenamientosRealizados = sesiones.length;

    return {
      rutinasAsignadas: rutinasAsignadas.length,
      sesionesTotales: totalEntrenamientosRealizados,
      completadas: sesionesCompletadas,
      enProgreso: sesionesEnProgreso,
      tiempoTotal
    };
  });

  async confirmarEliminacion(sesionId: string) {
    const alert = await this.alertController.create({
      header: '¿Eliminar entrenamiento?',
      message: 'Esta acción no se puede deshacer y los datos no sumarán a tu estadística.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'medium'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          cssClass: 'text-red-500',
          handler: async () => {
            await this.sesionRutinaService.eliminarSesion(sesionId);
          }
        }
      ]
    });

    await alert.present();
  }
}
