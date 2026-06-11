import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonModal,
  IonIcon,
  IonHeader,
  IonToolbar,
  IonAvatar,
  IonBadge,
  IonChip,
  IonFooter,
  IonButton,
  IonLabel,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, handRightOutline, handRight, trashOutline,
  timeOutline, personOutline, peopleOutline, checkmark
} from 'ionicons/icons';
import { Convocatoria } from 'gym-library';
import { AuthService } from '../../../../../core/services/auth.service';
import { UserService } from '../../../../../core/services/user.service';
import { ConvocatoriaService } from '../../../../../core/services/convocatoria.service';

@Component({
  selector: 'app-convocatoria-modal-stories',
  standalone: true,
  imports: [
    CommonModule,
    IonModal,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonAvatar,
    IonBadge,
    IonChip,
    IonFooter,
    IonButton,
    IonLabel
  ],
  templateUrl: './convocatoria-modal-stories.component.html',
  styles: [`
    ion-modal {
      --border-radius: 28px;
      --width: min(94%, 460px);
      --height: auto;
      --max-height: 85vh;
    }
    .convocatoria-modal-card {
      border-radius: 28px;
      overflow: hidden;
    }
  `]
})
export class ConvocatoriaModalStoriesComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private convocatoriaService = inject(ConvocatoriaService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  @Input() isOpen = false;
  @Input() convocatoria: Convocatoria | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<string>();

  currentUser = this.authService.currentUser;

  esCreador = computed(() => {
    const uid = this.currentUser()?.uid;
    return !!uid && !!this.convocatoria && uid === this.convocatoria.creadorId;
  });

  yaInteresado = computed(() => {
    const uid = this.currentUser()?.uid;
    return !!uid && !!this.convocatoria && this.convocatoria.interesados.includes(uid);
  });

  constructor() {
    addIcons({
      closeOutline, handRightOutline, handRight, trashOutline,
      timeOutline, personOutline, peopleOutline, checkmark
    });
  }

  getUsuarioName(uid: string): string {
    return this.userService.getUserByUid(uid)()?.nombre || 'Atleta';
  }

  getUsuarioPhoto(uid: string): string | null {
    return this.userService.getUserByUid(uid)()?.photoURL || null;
  }

  formatearFechaCompleta(): string {
    if (!this.convocatoria) return '';
    const fecha = new Date(this.convocatoria.fechaEntrenamiento);
    const hoy = new Date();
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);

    let dia = '';
    if (fecha.toDateString() === hoy.toDateString()) {
      dia = 'Hoy';
    } else if (fecha.toDateString() === manana.toDateString()) {
      dia = 'Mañana';
    } else {
      const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
      dia = fecha.toLocaleDateString('es-ES', opciones);
      dia = dia.charAt(0).toUpperCase() + dia.slice(1);
    }
    return `${dia} • ${this.convocatoria.horaInicio} - ${this.convocatoria.horaFin}`;
  }

  async toggleInteres() {
    const c = this.convocatoria;
    const user = this.currentUser();
    if (!c || !user) return;

    if (c.creadorId === user.uid) {
      this.showToast('No puedes sumarte a tu propia convocatoria', 'warning');
      return;
    }

    const ya = this.yaInteresado();
    try {
      await this.convocatoriaService.toggleInteres(c.id, user.uid, !ya);
      if (!ya) {
        this.showToast('¡Chocaste los 5! Estás dentro ✋', 'success');
      } else {
        this.showToast('Interés retirado', 'medium');
      }
    } catch (e) {
      console.error(e);
      this.showToast('Error al actualizar tu interés', 'danger');
    }
  }

  async confirmarEliminar() {
    const c = this.convocatoria;
    if (!c) return;

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
              await this.convocatoriaService.delete(c.id);
              this.showToast('Convocatoria eliminada', 'success');
              this.deleted.emit(c.id);
              this.close.emit();
            } catch (e) {
              console.error(e);
              this.showToast('Error al eliminar', 'danger');
            }
          }
        }
      ],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }

  onDidDismiss() {
    this.close.emit();
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      color,
      position: 'bottom',
      cssClass: 'premium-toast'
    });
    await toast.present();
  }
}
