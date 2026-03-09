import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingController, ToastController } from '@ionic/angular';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { User as LibraryUser } from 'gym-library';
export interface User extends LibraryUser {
  photoURL?: string;
}
import { PlanService } from '../../../../../../../core/services/plan.service';
import { addIcons } from 'ionicons';
import { starOutline, checkmarkCircleOutline, closeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-premium-request-modal',
  standalone: true,
  imports: [CommonModule, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon],
  templateUrl: './premium-request-modal.component.html'
})
export class PremiumRequestModalComponent {
  @Input() isOpen = false;
  @Input() user: User | null = null;
  @Output() modalClosed = new EventEmitter<void>();

  private planService = inject(PlanService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ starOutline, checkmarkCircleOutline, closeOutline });
  }

  close() {
    this.modalClosed.emit();
  }

  async confirmarSolicitud() {
    if (!this.user) return;
    
    const loading = await this.loadingCtrl.create({ message: 'Enviando solicitud...' });
    await loading.present();
    try {
      await this.planService.solicitarPremium(this.user);
      this.showToast('Solicitud enviada correctamente', 'success');
      this.close();
    } catch (error) {
      console.error('Error al solicitar premium:', error);
      this.showToast('Error al enviar la solicitud', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    toast.present();
  }
}
