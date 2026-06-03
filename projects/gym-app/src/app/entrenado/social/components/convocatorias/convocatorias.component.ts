import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonIcon,
  IonButton,
  IonBadge,
  IonLabel,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  add, close, handRightOutline, handRight, trashOutline, 
  sparkles, timeOutline, personOutline, paperPlaneOutline, chatbubblesOutline 
} from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { ConvocatoriaService } from '../../../../core/services/convocatoria.service';
import { Convocatoria } from 'gym-library';

@Component({
  selector: 'app-convocatorias',
  templateUrl: './convocatorias.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    IonButton,
    IonBadge,
    IonLabel
  ]
})
export class ConvocatoriasComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private convocatoriaService = inject(ConvocatoriaService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private router = inject(Router);

  readonly currentUserSignal = this.authService.currentUser;

  // Obtener convocatorias de Firestore filtradas y ordenadas
  convocatoriasActivas = computed(() => {
    const list = this.convocatoriaService.convocatorias();
    const user = this.currentUserSignal();
    if (!user || !user.gimnasioId) return [];

    const now = new Date();

    return list
      .filter(c => {
        if (c.gimnasioId !== user.gimnasioId) return false;
        if (!c.activo) return false;

        const endTraining = new Date(c.fechaEntrenamiento);
        const [hours, minutes] = c.horaFin.split(':').map(Number);
        endTraining.setHours(hours, minutes, 0, 0);

        const expirationTime = new Date(endTraining.getTime() + 2 * 60 * 60 * 1000);
        return now < expirationTime;
      })
      .sort((a, b) => {
        const dateA = new Date(a.fechaEntrenamiento).getTime();
        const dateB = new Date(b.fechaEntrenamiento).getTime();
        if (dateA !== dateB) return dateA - dateB;

        return a.horaInicio.localeCompare(b.horaInicio);
      });
  });

  constructor() {
    addIcons({ 
      add, close, handRightOutline, handRight, trashOutline, 
      sparkles, timeOutline, personOutline, paperPlaneOutline, chatbubblesOutline 
    });
  }

  irACreaciones() {
    this.router.navigate(['/entrenado-tabs/creaciones']);
  }

  async toggleChocarLos5(convocatoria: Convocatoria) {
    const user = this.currentUserSignal();
    if (!user) return;

    if (convocatoria.creadorId === user.uid) {
      this.showToast('No puedes chocar los 5 en tu propia convocatoria', 'warning');
      return;
    }

    const yaChoco = convocatoria.interesados.includes(user.uid);
    try {
      await this.convocatoriaService.toggleInteres(convocatoria.id, user.uid, !yaChoco);
      
      if (!yaChoco) {
        this.showToast(`¡Le chocaste los 5 a ${convocatoria.creadorNombre}! ✋`, 'success');
      } else {
        this.showToast('Interés retirado', 'medium');
      }
    } catch (e) {
      console.error(e);
      this.showToast('Error al registrar tu interés', 'danger');
    }
  }

  async confirmarEliminacion(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar convocatoria',
      message: '¿Estás seguro de que deseas eliminar esta publicación de entrenamiento?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.convocatoriaService.delete(id);
              this.showToast('Convocatoria eliminada con éxito', 'success');
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

  formatearFechaEntrenamiento(fechaVal: any): string {
    if (!fechaVal) return '';
    const fecha = new Date(fechaVal);
    const hoy = new Date();
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);

    if (fecha.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    } else if (fecha.toDateString() === manana.toDateString()) {
      return 'Mañana';
    } else {
      const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
      const str = fecha.toLocaleDateString('es-ES', opciones);
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  }

  getUsuarioName(uid: string): string {
    return this.userService.getUserByUid(uid)()?.nombre || 'Atleta';
  }

  getUsuarioPhoto(uid: string): string | null {
    return this.userService.getUserByUid(uid)()?.photoURL || null;
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
      cssClass: 'premium-toast'
    });
    await toast.present();
  }
}
