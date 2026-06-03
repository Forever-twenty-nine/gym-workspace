import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonBadge,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  paperPlaneOutline, calendarOutline, barbellOutline, 
  lockClosed, trashOutline, close 
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { RutinaService } from '../../core/services/rutina.service';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';
import { CrearConvocatoriaModalComponent } from '../social/components/convocatorias/components/crear-convocatoria-modal/crear-convocatoria-modal.component';

@Component({
  selector: 'app-creaciones',
  templateUrl: './creaciones.page.html',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    IonContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonBadge,
    HeaderTabsComponent,
    CrearConvocatoriaModalComponent
  ]
})
export class CreacionesPage implements OnInit {
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private ejercicioService = inject(EjercicioService);
  private rutinaService = inject(RutinaService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === 'premium');
  readonly userId = computed(() => this.currentUserSignal()?.uid);

  isConvocatoriaModalOpen = signal(false);

  // Ejercicios creados
  ejerciciosCreados = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    const entrenado = this.entrenadoService.getEntrenado(uid)();
    const ids = entrenado?.ejerciciosCreadosIds || [];
    return this.ejercicioService.ejercicios().filter(e => ids.includes(e.id));
  });

  // Rutinas creadas
  rutinasPropias = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    const entrenado = this.entrenadoService.getEntrenado(uid)();
    const ids = entrenado?.rutinasCreadas || [];
    return this.rutinaService.rutinas().filter(r => ids.includes(r.id));
  });

  constructor() {
    addIcons({ 
      paperPlaneOutline, calendarOutline, barbellOutline, 
      lockClosed, trashOutline, close 
    });
  }

  ngOnInit() {}

  abrirModalConvocatoria() {
    this.isConvocatoriaModalOpen.set(true);
  }

  cerrarModalConvocatoria() {
    this.isConvocatoriaModalOpen.set(false);
  }

  onConvocatoriaSaved() {
    // Se actualiza reactivamente por Firestore
  }

  crearRutina() {
    if (this.isPremium()) {
      this.router.navigate(['/entrenado-tabs/mis-rutinas']);
    } else {
      this.showPremiumToast('La creación de rutinas personalizadas es una función Premium 🔒');
    }
  }

  crearEjercicio() {
    if (this.isPremium()) {
      this.router.navigate(['/entrenado-tabs/ejercicios']);
    } else {
      this.showPremiumToast('La creación de ejercicios personalizados es una función Premium 🔒');
    }
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

  getNombreEjercicio(id: string): string {
    const ej = this.ejercicioService.ejercicios().find(e => e.id === id);
    return ej ? ej.nombre : 'Ejercicio';
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

  private async showToast(message: string, color: 'success' | 'danger') {
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
