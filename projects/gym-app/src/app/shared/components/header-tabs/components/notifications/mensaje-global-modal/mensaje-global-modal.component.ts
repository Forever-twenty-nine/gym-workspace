import { Component, Input, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, ModalController, IonFooter, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, informationCircle } from 'ionicons/icons';
import { MensajeGlobal } from 'gym-library';
import { MensajesGlobalesService } from '../../../../../../core/services/mensajes-globales.service';

@Component({
  selector: 'app-mensaje-global-modal',
  standalone: true,
  imports: [IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonFooter],
  templateUrl: './mensaje-global-modal.component.html'
})
export class MensajeGlobalModalComponent {
  @Input() mensaje!: MensajeGlobal;

  private modalCtrl = inject(ModalController);
  private mensajesService = inject(MensajesGlobalesService);

  constructor() {
    addIcons({ closeOutline, informationCircle });
  }

  async ionViewDidEnter() {
    // Marcar como leído al entrar
    if ((this.mensaje as any)?.id) {
      await this.mensajesService.marcarComoLeido((this.mensaje as any).id);
    }
  }

  dismiss() {
    this.modalCtrl.dismiss({ read: true });
  }
}
