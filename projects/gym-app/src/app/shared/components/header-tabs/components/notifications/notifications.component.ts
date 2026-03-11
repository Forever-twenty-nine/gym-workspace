import { Component, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonMenu, IonList, IonItem, IonLabel, ModalController, IonIcon, IonButton, IonItemDivider, IonNote } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mailOutline, personAddOutline, fitnessOutline, informationCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../../../core/services/auth.service';
import { MensajesGlobalesService } from '../../../../../core/services/mensajes-globales.service';
import { InvitacionService } from '../../../../../core/services/invitacion.service';
import { MensajeGlobalModalComponent } from './mensaje-global-modal/mensaje-global-modal.component';
import { Rol } from 'gym-library';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonMenu,
    IonList, 
    IonItem, 
    IonLabel, 
    IonIcon, 
    IonButton, 
    IonItemDivider
  ],
  templateUrl: './notifications.component.html'
})
export class NotificationsComponent {
  private authService = inject(AuthService);
  private mensajesGlobalesService = inject(MensajesGlobalesService);
  private invitacionService = inject(InvitacionService);
  private modalCtrl = inject(ModalController);

  currentUser = this.authService.currentUser;
  
  mensajesNoLeidos = this.mensajesGlobalesService.mensajesNoLeidos;
  mensajesLeidos = this.mensajesGlobalesService.mensajesLeidos;

  invitacionesPendientes = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    if (user.role === Rol.ENTRENADOR || user.role === Rol.PERSONAL_TRAINER) {
      return this.invitacionService.getInvitacionesPendientesPorEntrenador(user.uid)();
    } else if (user.role === Rol.ENTRENADO) {
      return this.invitacionService.getInvitacionesPendientesPorEntrenado(user.uid)();
    }
    return [];
  });

  constructor() {
    addIcons({ mailOutline, personAddOutline, fitnessOutline, informationCircleOutline });
  }

  async openMensaje(mensaje: any) {
    const modal = await this.modalCtrl.create({
      component: MensajeGlobalModalComponent,
      componentProps: {
        mensaje
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.read) {
      // It's marked as read inside the modal, so it should auto-update since it uses signals.
    }
  }

  async aceptarInvitacion(id: string) {
    await this.invitacionService.aceptarInvitacion(id);
  }

  async rechazarInvitacion(id: string) {
    await this.invitacionService.rechazarInvitacion(id);
  }
}
