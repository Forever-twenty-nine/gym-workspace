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
  IonPopover,
  ToastController,
  SegmentCustomEvent
} from '@ionic/angular/standalone';

import { EntrenadosPage } from '../entrenados/entrenados.page';
import { RutinasPage } from '../rutinas/rutinas.page';
import { EjerciciosPage } from '../ejercicios/ejercicios.page';
import { BackgroundComponent } from '../../shared/components/background/background.component';

import { AuthService } from '../../core/services/auth.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
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
    IonPopover,
    BackgroundComponent,
    EntrenadosPage,
    RutinasPage,
    EjerciciosPage
  ]
})
export class CreacionesPage implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private entrenadorService = inject(EntrenadorService);
  private entrenadoService = inject(EntrenadoService);
  private toastController = inject(ToastController);

  @ViewChild(EntrenadosPage) entrenadosComponent?: EntrenadosPage;
  @ViewChild(RutinasPage) rutinasComponent?: RutinasPage;
  @ViewChild(EjerciciosPage) ejerciciosComponent?: EjerciciosPage;

  selectedTab = signal<'entrenados' | 'rutinas' | 'ejercicios'>('entrenados');

  // --- Límites de Plan ---
  readonly plan = computed(() => this.authService.currentUser()?.plan || Plan.FREE);

  readonly entrenadosAsociados = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadoService.entrenados().filter(e => e.entrenadoresId?.includes(entrenadorId)) : [];
  });

  readonly rutinasCreadas = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadorService.getRutinasByEntrenador(entrenadorId)() : [];
  });

  readonly ejerciciosCreados = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadorService.getEjerciciosByEntrenador(entrenadorId)() : [];
  });

  // Client Limits
  readonly hasReachedClientLimit = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return false;
    const limits = this.entrenadorService.getLimits(entrenadorId);
    return this.entrenadosAsociados().length >= limits.maxClients;
  });

  readonly clientLimitMessage = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return '';
    const limits = this.entrenadorService.getLimits(entrenadorId);
    return `Clientes activos: ${this.entrenadosAsociados().length}/${limits.maxClients}`;
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
      case 'entrenados':
        return `Gestiona tus alumnos asociados. Puedes enviarles invitaciones de correo para unirse a tu equipo.\n\nLímite actual:\n${this.clientLimitMessage()}`;
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
      if (tab === 'entrenados' || tab === 'rutinas' || tab === 'ejercicios') {
        this.selectedTab.set(tab);
      }
    });

    this.entrenadorService.initializeListener();
    this.entrenadoService.initializeListener();
  }

  segmentChanged(event: SegmentCustomEvent) {
    const val = event.detail.value as 'entrenados' | 'rutinas' | 'ejercicios' | undefined;
    if (val) {
      this.selectedTab.set(val);
    }
  }

  async onFabCreate() {
    switch (this.selectedTab()) {
      case 'entrenados':
        if (this.hasReachedClientLimit()) {
          this.mostrarLimitToast('Límite de entrenados alcanzado para tu plan.');
        } else {
          this.entrenadosComponent?.openInvitacionModal();
        }
        break;
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
