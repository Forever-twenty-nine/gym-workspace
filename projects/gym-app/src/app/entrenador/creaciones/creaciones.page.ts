import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, help } from 'ionicons/icons';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonFab,
  IonFabButton,
  IonIcon,
  ToastController,
  SegmentCustomEvent
} from '@ionic/angular/standalone';

import { RutinasPage } from '../rutinas/rutinas.page';
import { EjerciciosPage } from '../ejercicios/ejercicios.page';
import { BackgroundComponent } from '../../shared/components/background/background.component';
import { HelpFabComponent } from '../../shared/components/help-fab/help-fab.component';

import { AuthService } from '../../core/services/auth.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { Plan } from 'gym-library';

@Component({
  selector: 'app-entrenador-creaciones',
  templateUrl: './creaciones.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonFab,
    IonFabButton,
    IonIcon,
    BackgroundComponent,
    HelpFabComponent,
    RutinasPage,
    EjerciciosPage
  ]
})
export class CreacionesPage implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private entrenadorService = inject(EntrenadorService);
  private toastController = inject(ToastController);

  @ViewChild(RutinasPage) rutinasComponent?: RutinasPage;
  @ViewChild(EjerciciosPage) ejerciciosComponent?: EjerciciosPage;

  selectedTab = signal<'rutinas' | 'ejercicios'>('rutinas');

  // --- Límites de Plan ---
  readonly plan = computed(() => this.authService.currentUser()?.plan || Plan.FREE);

  readonly rutinasCreadas = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadorService.getRutinasByEntrenador(entrenadorId)() : [];
  });

  readonly ejerciciosCreados = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadorService.getEjerciciosByEntrenador(entrenadorId)() : [];
  });

  // Routine Limits
  readonly hasReachedRutinaLimit = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return false;
    const limits = this.entrenadorService.getLimits(entrenadorId);
    return this.rutinasCreadas().length >= limits.maxRoutines;
  });

  readonly rutinaLimitMessage = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return '';
    const limits = this.entrenadorService.getLimits(entrenadorId);
    return `Rutinas creadas: ${this.rutinasCreadas().length}/${limits.maxRoutines}`;
  });

  // Exercise Limits
  readonly hasReachedEjercicioLimit = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return false;
    const limits = this.entrenadorService.getLimits(entrenadorId);
    const currentCount = this.ejerciciosCreados().length;
    return currentCount >= limits.maxExercises;
  });

  readonly ejercicioLimitMessage = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return '';
    const limits = this.entrenadorService.getLimits(entrenadorId);
    const currentCount = this.ejerciciosCreados().length;
    return `Ejercicios creados: ${currentCount}/${limits.maxExercises}`;
  });

  // --- Texto de ayuda contextual ---
  readonly helpText = computed(() => {
    switch (this.selectedTab()) {
      case 'rutinas':
        return `Crea y personaliza las rutinas de ejercicios que asignarás a tus alumnos.\n\nLímite actual:\n${this.rutinaLimitMessage()}`;
      case 'ejercicios':
        return `Administra tu catálogo de ejercicios personalizados.\n\nLímite actual:\n${this.ejercicioLimitMessage()}`;
    }
  });

  constructor() {
    addIcons({ add, help });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'rutinas' || tab === 'ejercicios') {
        this.selectedTab.set(tab);
      }
    });

    this.entrenadorService.initializeListener();
  }

  segmentChanged(event: SegmentCustomEvent) {
    const val = event.detail.value as 'rutinas' | 'ejercicios' | undefined;
    if (val) {
      this.selectedTab.set(val);
    }
  }

  async onFabCreate() {
    switch (this.selectedTab()) {
      case 'rutinas':
        if (this.hasReachedRutinaLimit()) {
          this.mostrarLimitToast('Límite de rutinas alcanzado para tu plan.');
        } else {
          this.rutinasComponent?.crearRutina();
        }
        break;
      case 'ejercicios':
        if (this.hasReachedEjercicioLimit()) {
          this.mostrarLimitToast('Límite de ejercicios alcanzado para tu plan. Actualiza para crear más.');
        } else {
          this.ejerciciosComponent?.crearEjercicio();
        }
        break;
    }
  }

  private async mostrarLimitToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'warning',
      position: 'top'
    });
    await toast.present();
  }
}
