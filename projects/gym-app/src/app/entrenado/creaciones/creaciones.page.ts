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
  AlertController
} from '@ionic/angular/standalone';

import { AuthService } from '../../core/services/auth.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { RutinaService } from '../../core/services/rutina.service';
import { ConvocatoriaService } from '../../core/services/convocatoria.service';
import { DesafioService } from '../../core/services/desafio.service';

import { ConvocatoriaModalComponent } from './components/convocatoria/convocatoria-modal/convocatoria-modal.component';
import { DesafioModalComponent } from './components/desafio/desafio-modal/desafio-modal.component';
import { RutinaModalComponent } from './components/rutina/rutina-modal/rutina-modal.component';
import { EjercicioModalComponent } from './components/ejercicio/ejercicio-modal/ejercicio-modal.component';

import { ConvocatoriaListComponent } from './components/convocatoria/convocatoria-list/convocatoria-list.component';
import { DesafioListComponent } from './components/desafio/desafio-list/desafio-list.component';
import { RutinaListComponent } from './components/rutina/rutina-list/rutina-list.component';
import { EjercicioListComponent } from './components/ejercicio/ejercicio-list/ejercicio-list.component';

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
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === 'premium');
  readonly userId = computed(() => this.currentUserSignal()?.uid);

  isConvocatoriaModalOpen = signal(false);
  isDesafioModalOpen = signal(false);
  isRutinaModalOpen = signal(false);

  // Items para edición
  convocatoriaToEdit = signal<any | null>(null);
  desafioToEdit = signal<any | null>(null);
  rutinaToEdit = signal<any | null>(null);
  ejercicioToEdit = signal<any | null>(null);

  selectedTab = signal<'convocatorias' | 'desafios' | 'rutinas' | 'ejercicios'>('convocatorias');

  // Ejercicios creados por el usuario.
  // Combina los que tienen creadorId (creaciones nuevas) + los que están en el array del perfil (legacy).
  ejerciciosCreados = computed(() => {
    const uid = this.userId();
    if (!uid) return [];

    const byCreator = this.ejercicioService.ejercicios().filter(e => e.creadorId === uid);

    const entrenado = this.entrenadoService.getEntrenado(uid)();
    const ids = entrenado?.ejerciciosCreadosIds || [];
    const byIds = this.ejercicioService.ejercicios().filter(e => ids.includes(e.id));

    // Unir sin duplicados por id
    const map = new Map<string, any>();
    [...byCreator, ...byIds].forEach(e => map.set(e.id, e));
    return Array.from(map.values());
  });

  // Rutinas creadas por el usuario.
  // Combina los que tienen creadorId (creaciones nuevas) + los que están en el array del perfil (legacy).
  rutinasPropias = computed(() => {
    const uid = this.userId();
    if (!uid) return [];

    const byCreator = this.rutinaService.rutinas().filter(r => r.creadorId === uid);

    const entrenado = this.entrenadoService.getEntrenado(uid)();
    const ids = entrenado?.rutinasCreadas || [];
    const byIds = this.rutinaService.rutinas().filter(r => ids.includes(r.id));

    // Unir sin duplicados por id
    const map = new Map<string, any>();
    [...byCreator, ...byIds].forEach(r => map.set(r.id, r));
    return Array.from(map.values());
  });

  // Mis Convocatorias (las que yo creé)
  misConvocatorias = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    return this.convocatoriaService.convocatorias()
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
    if (!uid) return new Set<string>();

    const set = new Set<string>();
    const entrenado = this.entrenadoService.getEntrenado(uid)();
    (entrenado?.ejerciciosCreadosIds || []).forEach((id: string) => set.add(id));

    this.ejercicioService.ejercicios().forEach(e => {
      if (e.creadorId === uid) set.add(e.id);
    });
    return set;
  });

  // Lista ordenada para el tab: primero los "Tuyo" (creados por el usuario), luego el resto
  ejerciciosParaMostrar = computed(() => {
    const all = this.ejercicioService.ejercicios();
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
    // Forzar inicialización de listeners para que las listas de rutinas y ejercicios se actualicen reactivamente
    this.rutinaService.rutinas();
    this.ejercicioService.ejercicios();
    const uid = this.userId();
    if (uid) {
      this.entrenadoService.getEntrenado(uid);
    }
  }

  abrirModalConvocatoria() {
    this.isConvocatoriaModalOpen.set(true);
  }

  cerrarModalConvocatoria() {
    this.isConvocatoriaModalOpen.set(false);
    this.convocatoriaToEdit.set(null);
  }

  onConvocatoriaSaved() {
    // Se actualiza reactivamente por Firestore
  }

  abrirModalDesafio() {
    this.isDesafioModalOpen.set(true);
  }

  cerrarModalDesafio() {
    this.isDesafioModalOpen.set(false);
    this.desafioToEdit.set(null);
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
    this.isRutinaModalOpen.set(false);
    this.rutinaToEdit.set(null);
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
    this.isEjercicioModalOpen.set(false);
    this.ejercicioToEdit.set(null);
  }

  onEjercicioSaved() {
    // Se actualiza reactivamente por Firestore
  }

  onEditConvocatoria(item: any) {
    this.convocatoriaToEdit.set(item);
    this.isConvocatoriaModalOpen.set(true);
  }

  onEditDesafio(item: any) {
    this.desafioToEdit.set(item);
    this.isDesafioModalOpen.set(true);
  }

  onEditRutina(item: any) {
    this.rutinaToEdit.set(item);
    this.isRutinaModalOpen.set(true);
  }

  onEditEjercicio(item: any) {
    this.ejercicioToEdit.set(item);
    this.isEjercicioModalOpen.set(true);
  }

  segmentChanged(event: any) {
    this.selectedTab.set(event.detail.value);
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
