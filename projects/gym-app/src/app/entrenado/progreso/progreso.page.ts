import { Component, OnInit, OnDestroy, signal, inject, computed, effect } from '@angular/core';

import {
  IonContent,
  IonText,
  IonCard
} from '@ionic/angular/standalone';
import { NgOptimizedImage } from '@angular/common';
import { RutinaService } from '../../core/services/rutina.service';
import { AuthService } from '../../core/services/auth.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { SesionRutinaService } from '../../core/services/sesion-rutina.service';
import { EstadisticasEntrenadoService } from '../../core/services/estadisticas-entrenado.service';
import { ProgresoEstadisticasComponent } from './components/progreso-estadisticas/progreso-estadisticas.component';


@Component({
  selector: 'app-progreso',
  standalone: true,
  imports: [
    IonContent,
    IonText,
    NgOptimizedImage,
    ProgresoEstadisticasComponent
  ],
  templateUrl: './progreso.page.html',
})
export class ProgresoPage implements OnInit, OnDestroy {
  private readonly rutinaService = inject(RutinaService);
  private readonly authService = inject(AuthService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly sesionRutinaService = inject(SesionRutinaService);
  private readonly estadisticasService = inject(EstadisticasEntrenadoService);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === 'premium');

  readonly isLoading = signal(false);

  private userListenerInitialized = false;

  constructor() {
    // Auto init listener when user changes
    effect(() => {
      const user = this.currentUserSignal();
      if (user?.uid && !this.userListenerInitialized) {
        this.estadisticasService.initializeListener(user.uid);
        this.userListenerInitialized = true;
      }
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    const uid = this.currentUserSignal()?.uid;
    if (uid) {
      this.estadisticasService.stopListener(uid);
    }
  }

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

    const tiempoTotalSegundos = sesiones.reduce((total: number, sesion) => {
      return total + (sesion.duracion || 0);
    }, 0);

    const tiempoTotal = Math.round(tiempoTotalSegundos / 60);

    const totalEntrenamientosRealizados = sesiones.length;

    return {
      rutinasAsignadas: rutinasAsignadas.length,
      sesionesTotales: totalEntrenamientosRealizados,
      completadas: sesionesCompletadas,
      enProgreso: sesionesEnProgreso,
      tiempoTotal
    };
  });

  dbEstadisticas = computed(() => {
    const uid = this.currentUserSignal()?.uid;
    if (!uid) return null;
    return this.estadisticasService.getEstadisticas(uid)();
  });
}
