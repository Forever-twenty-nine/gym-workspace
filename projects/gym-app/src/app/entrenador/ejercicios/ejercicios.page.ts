import { Component, OnInit, inject, computed, Signal, signal } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  ToastController, IonText } from '@ionic/angular/standalone';
import { NgOptimizedImage } from '@angular/common';
import { addIcons } from 'ionicons';
import { barbellOutline, close, add, pencil, trash, barbell, informationCircleOutline, lockClosed, star } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { UserService } from '../../core/services/user.service';

import { EjerciciosListComponent } from '../components/ejercicios-list/ejercicios-list.component';
import { EjercicioModalComponent } from '../components/ejercicio-modal/ejercicio-modal.component';

@Component({
  selector: 'app-ejercicios',
  templateUrl: './ejercicios.page.html',
  standalone: true,
  imports: [IonText,
    IonContent,
    IonButton,
    IonIcon,
    NgOptimizedImage,
    EjerciciosListComponent,
    EjercicioModalComponent]
})
export class EjerciciosPage implements OnInit {
  private authService = inject(AuthService);
  private ejercicioService = inject(EjercicioService);
  private entrenadorService = inject(EntrenadorService);
  private userService = inject(UserService);
  private toastController = inject(ToastController);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === 'premium');

  ejerciciosCreados: Signal<any[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadorService.getEjerciciosByEntrenador(entrenadorId)() : [];
  });

  // Computed signals para límites de plan
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

  readonly isFreePlan = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return false;
    const user = this.userService.users().find(u => u.uid === entrenadorId);
    return user?.plan === 'free';
  });
  readonly isEjercicioModalOpen = signal(false);
  readonly ejercicioModalData = signal<any>(null);
  readonly isEjercicioCreating = signal(false);

  constructor() {
    addIcons({ barbellOutline, close, add, pencil, trash, barbell, informationCircleOutline, lockClosed, star });
  }

  ngOnInit() {
    this.entrenadorService.initializeListener();
  }

  verEjercicio(ejercicio: any) {
    this.openEjercicioModal(ejercicio);
  }

  crearEjercicio() {
    this.openCreateEjercicioModal();
  }

  // ========================================
  // MÉTODOS PARA EJERCICIOS
  // ========================================

  async deleteEjercicio(id: string) {
    await this.ejercicioService.delete(id);
  }

  openEjercicioModal(item: any) {
    this.ejercicioModalData.set(item);
    this.isEjercicioModalOpen.set(true);
    this.isEjercicioCreating.set(false);
  }

  openCreateEjercicioModal() {
    const newItem = this.createEmptyEjercicio();
    this.ejercicioModalData.set(newItem);
    this.isEjercicioModalOpen.set(true);
    this.isEjercicioCreating.set(true);
  }

  closeEjercicioModal() {
    this.isEjercicioModalOpen.set(false);
    this.ejercicioModalData.set(null);
    this.isEjercicioCreating.set(false);
  }

  private createEmptyEjercicio(): any {
    const timestamp = Date.now();
    const entrenadorId = this.authService.currentUser()?.uid;

    return {
      id: 'e' + timestamp,
      nombre: '',
      series: 1,
      repeticiones: 1,
      peso: 0,
      serieSegundos: 0,
      descansoSegundos: 0,
      descripcion: '',
      creadorId: entrenadorId,
      creadorTipo: 'entrenador'
    };
  }

  async saveEjercicioChanges(formValue: any) {
    const originalData = this.ejercicioModalData();

    if (!formValue || !originalData) return;

    // Validar límite de ejercicios para creación
    if (this.isEjercicioCreating()) {
      const entrenadorId = this.authService.currentUser()?.uid;
      if (entrenadorId) {
        const limits = this.entrenadorService.getLimits(entrenadorId);
        const currentCount = this.entrenadorService.getEjerciciosByEntrenador(entrenadorId)().length;
        if (currentCount >= limits.maxExercises) {
          const toast = await this.toastController.create({
            message: 'Has alcanzado el límite de ejercicios para tu plan. Actualiza para crear más.',
            duration: 3000,
            color: 'warning',
            position: 'top'
          });
          await toast.present();
          return;
        }
      }
    }

    try {
      const ejercicioData: any = {
        ...originalData,
        nombre: formValue.nombre,
        descripcion: formValue.descripcion,
        series: formValue.series,
        repeticiones: formValue.repeticiones,
        peso: formValue.peso,
        fechaModificacion: new Date()
      };

      // Solo incluir campos premium si no es plan free
      if (!this.isFreePlan()) {
        ejercicioData.descansoSegundos = formValue.descansoSegundos ?? 60;
        ejercicioData.serieSegundos = formValue.serieSegundos ?? 0;
      }

      if (this.isEjercicioCreating()) {
        ejercicioData.fechaCreacion = new Date();
      }

      await this.ejercicioService.save(ejercicioData);

      // Si es creación, agregar el ejercicio al entrenador
      if (this.isEjercicioCreating() && ejercicioData.id) {
        const entrenadorId = this.authService.currentUser()?.uid;
        if (entrenadorId) {
          await this.entrenadorService.addEjercicioCreado(entrenadorId, ejercicioData.id);
        }
      }

      this.closeEjercicioModal();
    } catch (error) {
      console.error('Error guardando ejercicio:', error);
    }
  }
}
