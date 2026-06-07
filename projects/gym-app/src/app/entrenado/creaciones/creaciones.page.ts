import { Component, OnInit, inject, computed, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  ToastController,
  AlertController,
  SegmentCustomEvent
} from '@ionic/angular/standalone';

import { AuthService } from '../../core/services/auth.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { RutinaService } from '../../core/services/rutina.service';
import { ConvocatoriaService } from '../../core/services/convocatoria.service';
import { DesafioService } from '../../core/services/desafio.service';
import { Plan, Convocatoria, Desafio, Rutina, Ejercicio } from 'gym-library';

import { ConvocatoriaModalComponent } from './components/convocatoria/convocatoria-modal/convocatoria-modal.component';
import { DesafioModalComponent } from './components/desafio/desafio-modal/desafio-modal.component';
import { RutinaModalComponent } from './components/rutina/rutina-modal/rutina-modal.component';
import { EjercicioModalComponent } from './components/ejercicio/ejercicio-modal/ejercicio-modal.component';

import { ConvocatoriaListComponent } from './components/convocatoria/convocatoria-list/convocatoria-list.component';
import { DesafioListComponent } from './components/desafio/desafio-list/desafio-list.component';
import { RutinaListComponent } from './components/rutina/rutina-list/rutina-list.component';
import { EjercicioListComponent } from './components/ejercicio/ejercicio-list/ejercicio-list.component';
import { closeModalWithAnimation, blurActiveElement } from '../../core/utils/modal.utils';

@Component({
  selector: 'app-creaciones',
  templateUrl: './creaciones.page.html',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    IonContent,
    IonHeader,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    ConvocatoriaModalComponent,
    DesafioModalComponent,
    RutinaModalComponent,
    EjercicioModalComponent,
    ConvocatoriaListComponent,
    DesafioListComponent,
    RutinaListComponent,
    EjercicioListComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CreacionesPage implements OnInit {
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private ejercicioService = inject(EjercicioService);
  private rutinaService = inject(RutinaService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private convocatoriaService = inject(ConvocatoriaService);
  private desafioService = inject(DesafioService);
  private alertCtrl = inject(AlertController);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === Plan.PREMIUM);
  readonly userId = computed(() => this.currentUserSignal()?.uid);

  isConvocatoriaModalOpen = signal(false);
  isDesafioModalOpen = signal(false);
  isRutinaModalOpen = signal(false);

  // Items para edición (tipados)
  convocatoriaToEdit = signal<Convocatoria | null>(null);
  desafioToEdit = signal<Desafio | null>(null);
  rutinaToEdit = signal<Rutina | null>(null);
  ejercicioToEdit = signal<Ejercicio | null>(null);

  selectedTab = signal<'convocatorias' | 'desafios' | 'rutinas' | 'ejercicios'>('convocatorias');

  // Ejercicios creados por el usuario (usa helper centralizado en el servicio)
  ejerciciosCreados = computed(() => {
    const uid = this.userId();
    if (!uid) return [];

    const entrenado = this.entrenadoService.getEntrenado(uid)();
    const legacyIds = entrenado?.ejerciciosCreadosIds || [];
    return this.ejercicioService.getCreatedByUser(uid, legacyIds)();
  });

  // Rutinas creadas por el usuario (usa helper centralizado en el servicio)
  rutinasPropias = computed(() => {
    const uid = this.userId();
    if (!uid) return [];

    const entrenado = this.entrenadoService.getEntrenado(uid)();
    const legacyIds = entrenado?.rutinasCreadas || [];
    return this.rutinaService.getCreatedByUser(uid, legacyIds)();
  });

  // Mis Convocatorias (las que yo creé)
  misConvocatorias = computed(() => {
    const uid = this.userId();
    const gymId = this.currentUserSignal()?.gimnasioId;
    if (!uid) return [];

    const list = gymId 
      ? this.convocatoriaService.getConvocatoriasForGym(gymId)() 
      : this.convocatoriaService.convocatorias();

    return list
      .filter(c => c.creadorId === uid)
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  });

  // Mis Desafíos (los que yo creé)
  misDesafios = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    return this.desafioService.getDesafiosByCreador(uid)();
  });

  isEjercicioModalOpen = signal(false);

  // IDs de los ejercicios que pertenecen al usuario actual (para mostrar botón de eliminar)
  misEjercicioIds = computed(() => {
    const uid = this.userId();
    const gymId = this.currentUserSignal()?.gimnasioId;
    if (!uid) return new Set<string>();

    const entrenado = this.entrenadoService.getEntrenado(uid)();
    const legacy = entrenado?.ejerciciosCreadosIds || [];
    const owned = this.ejercicioService.getCreatedByUser(uid, legacy)();

    return new Set(owned.map(e => e.id));
  });

  // Lista ordenada para el tab: primero los "Tuyo" (creados por el usuario), luego el resto
  ejerciciosParaMostrar = computed(() => {
    const gymId = this.currentUserSignal()?.gimnasioId;
    const all = gymId 
      ? this.ejercicioService.getEjerciciosForGym(gymId)() 
      : this.ejercicioService.ejercicios();
    const mis = this.misEjercicioIds();
    return [...all].sort((a, b) => {
      const aMine = mis.has(a.id) ? 0 : 1;
      const bMine = mis.has(b.id) ? 0 : 1;
      if (aMine !== bMine) return aMine - bMine;
      return (a.nombre || '').localeCompare(b.nombre || '');
    });
  });

  constructor() {
  }

  ngOnInit() {
    // Forzar inicialización de listeners gym-scoped para reducir datos cargados
    const gymId = this.currentUserSignal()?.gimnasioId;
    if (gymId) {
      this.rutinaService.getRutinasForGym(gymId);
      this.ejercicioService.getEjerciciosForGym(gymId);
    } else {
      this.rutinaService.rutinas();
      this.ejercicioService.ejercicios();
    }
    const uid = this.userId();
    if (uid) {
      this.entrenadoService.getEntrenado(uid);
    }
  }

  abrirModalConvocatoria() {
    this.isConvocatoriaModalOpen.set(true);
  }

  cerrarModalConvocatoria() {
    closeModalWithAnimation(this.isConvocatoriaModalOpen, this.convocatoriaToEdit);
    // nota: el modal interno también puede limpiar, pero centralizamos aquí
  }

  onConvocatoriaSaved() {
    // Se actualiza reactivamente por Firestore
  }

  abrirModalDesafio() {
    this.isDesafioModalOpen.set(true);
  }

  cerrarModalDesafio() {
    closeModalWithAnimation(this.isDesafioModalOpen, this.desafioToEdit);
  }

  onDesafioSaved() {
    // Se actualiza reactivamente por Firestore
  }

  abrirModalRutina() {
    if (this.isPremium()) {
      this.isRutinaModalOpen.set(true);
    } else {
      this.showPremiumToast('La creación de rutinas personalizadas es una función Premium 🔒');
    }
  }

  cerrarModalRutina() {
    closeModalWithAnimation(this.isRutinaModalOpen, this.rutinaToEdit);
  }

  onRutinaSaved() {
    // Se actualiza reactivamente por Firestore
  }

  abrirModalEjercicio() {
    if (this.isPremium()) {
      this.isEjercicioModalOpen.set(true);
    } else {
      this.showPremiumToast('La creación de ejercicios personalizados es una función Premium 🔒');
    }
  }

  cerrarModalEjercicio() {
    closeModalWithAnimation(this.isEjercicioModalOpen, this.ejercicioToEdit);
  }

  onEjercicioSaved() {
    // Se actualiza reactivamente por Firestore
  }

  onEditConvocatoria(item: Convocatoria) {
    this.convocatoriaToEdit.set(item);
    this.isConvocatoriaModalOpen.set(true);
  }

  onEditDesafio(item: Desafio) {
    this.desafioToEdit.set(item);
    this.isDesafioModalOpen.set(true);
  }

  onEditRutina(item: Rutina) {
    if (!this.isPremium()) {
      this.showPremiumToast('La edición de rutinas personalizadas es una función Premium 🔒');
      return;
    }
    this.rutinaToEdit.set(item);
    this.isRutinaModalOpen.set(true);
  }

  onEditEjercicio(item: Ejercicio) {
    if (!this.isPremium()) {
      this.showPremiumToast('La edición de ejercicios personalizados es una función Premium 🔒');
      return;
    }
    this.ejercicioToEdit.set(item);
    this.isEjercicioModalOpen.set(true);
  }

  segmentChanged(event: SegmentCustomEvent) {
    const val = event.detail.value as 'convocatorias' | 'desafios' | 'rutinas' | 'ejercicios' | undefined;
    if (val) this.selectedTab.set(val);
  }

  async eliminarConvocatoria(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar convocatoria',
      message: '¿Estás seguro de que deseas eliminar esta convocatoria?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.convocatoriaService.delete(id);
              this.showToast('Convocatoria eliminada', 'success');
            } catch (e) {
              console.error(e);
              this.showToast('Error al eliminar la convocatoria', 'danger');
            }
          }
        }
      ],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }

  async eliminarDesafio(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar desafío',
      message: '¿Estás seguro de que deseas eliminar este desafío?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.desafioService.delete(id);
              this.showToast('Desafío eliminado', 'success');
            } catch (e) {
              console.error(e);
              this.showToast('Error al eliminar el desafío', 'danger');
            }
          }
        }
      ],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }

  async eliminarEjercicio(id: string) {
    try {
      await this.ejercicioService.delete(id);
      const uid = this.userId();
      if (uid) {
        await this.entrenadoService.removeEjercicioCreado(uid, id);
      }
      this.showToast('Ejercicio eliminado', 'success');
    } catch (e) {
      console.error(e);
      this.showToast('Error al eliminar el ejercicio', 'danger');
    }
  }

  async eliminarRutina(id: string) {
    try {
      await this.rutinaService.delete(id);
      const uid = this.userId();
      if (uid) {
        await this.entrenadoService.removeRutinaCreada(uid, id);
      }
      this.showToast('Rutina eliminada', 'success');
    } catch (e) {
      console.error(e);
      this.showToast('Error al eliminar la rutina', 'danger');
    }
  }

  private async showPremiumToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'warning',
      cssClass: 'premium-toast'
    });
    await toast.present();
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
      cssClass: 'premium-toast'
    });
    await toast.present();
  }
}
