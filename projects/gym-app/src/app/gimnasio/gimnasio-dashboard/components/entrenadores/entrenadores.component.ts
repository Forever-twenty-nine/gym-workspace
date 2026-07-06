import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personRemove, closeCircle, eye } from 'ionicons/icons';
import { GimnasioEntrenadorService } from '../../../../core/services/gimnasio-entrenador.service';
import { EntrenadoresListComponent } from './entrenadores-list/entrenadores-list.component';
import { EntrenadorInviteModalComponent } from './entrenador-invite-modal/entrenador-invite-modal.component';

@Component({
  selector: 'app-entrenadores',
  templateUrl: './entrenadores.component.html',
  standalone: true,
  imports: [
    CommonModule,
    EntrenadoresListComponent,
    EntrenadorInviteModalComponent
  ],
})
export class EntrenadoresComponent implements OnInit {
  public gymTrainerService = inject(GimnasioEntrenadorService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  isInviteModalOpen = signal(false);
  isLoading = signal(false);

  constructor() {
    addIcons({ personRemove, closeCircle, eye });
  }

  ngOnInit() {
    this.gymTrainerService.inicializarColecciones();
  }

  openInviteModal() {
    this.isInviteModalOpen.set(true);
  }

  closeInviteModal() {
    this.isInviteModalOpen.set(false);
  }

  async saveInvitacion(data: { email: string; mensaje: string }) {
    this.isLoading.set(true);
    try {
      await this.gymTrainerService.enviarInvitacion(data.email, data.mensaje);
      const successToast = await this.toastController.create({
        message: 'Invitación al entrenador enviada con éxito',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await successToast.present();
      this.closeInviteModal();
    } catch (error: any) {
      const errorToast = await this.toastController.create({
        message: error.message || 'Error al enviar la invitación. Inténtalo de nuevo.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await errorToast.present();
    } finally {
      this.isLoading.set(false);
    }
  }

  async cancelarInvitacion(invitacionId: string) {
    try {
      await this.gymTrainerService.cancelarInvitacion(invitacionId);
      const toast = await this.toastController.create({
        message: 'Invitación cancelada correctamente',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error) {
      const toast = await this.toastController.create({
        message: 'Error al cancelar la invitación',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  async desvincularEntrenador(user: any) {
    const alert = await this.alertController.create({
      header: 'Confirmar desvinculación',
      message: `¿Estás seguro de que deseas desvincular a ${user.nombre || user.email} de tu gimnasio?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desvincular',
          role: 'destructive',
          handler: async () => {
            try {
              await this.gymTrainerService.desvincularEntrenador(user);
              const toast = await this.toastController.create({
                message: 'Entrenador desvinculado correctamente',
                duration: 3000,
                color: 'success',
                position: 'top'
              });
              await toast.present();
            } catch (error) {
              const toast = await this.toastController.create({
                message: 'Error al desvincular el entrenador',
                duration: 3000,
                color: 'danger',
                position: 'top'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async verDetallesEntrenador(user: any) {
    const alert = await this.alertController.create({
      header: user.nombre || 'Sin nombre',
      message: `Correo electrónico: ${user.email || 'Sin correo'}\nEntrenados asociados: ${user.cantidadEntrenados ?? 0}`,
      buttons: ['Cerrar']
    });
    await alert.present();
  }
}
