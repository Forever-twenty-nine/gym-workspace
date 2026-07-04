import { Component, OnInit, inject, signal } from '@angular/core';
import { IonButton, IonIcon, AlertController, ToastController, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { TipoEntrenamiento } from 'gym-library';

import { TipoEntrenamientoService } from '../../../core/services/tipo-entrenamiento.service';
import { TiposEntrenamientoListComponent } from './tipos-entrenamiento-list/tipos-entrenamiento-list';
import { TipoEntrenamientoModalComponent } from './tipo-entrenamiento-modal/tipo-entrenamiento-modal';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-tipos-entrenamiento-manager',
  standalone: true,
  imports: [
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    TiposEntrenamientoListComponent,
    TipoEntrenamientoModalComponent
],
  templateUrl: './tipos-entrenamiento.html'
})
export class TiposEntrenamientoComponent implements OnInit {
  private authService = inject(AuthService);
  private tipoEntrenamientoService = inject(TipoEntrenamientoService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  readonly tipos = this.tipoEntrenamientoService.tipos;

  isModalOpen = signal(false);
  modalData = signal<TipoEntrenamiento | null>(null);
  isCreating = signal(false);

  constructor() {
    addIcons({ add });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      const gymId = user.gimnasioId || user.uid;
      this.tipoEntrenamientoService.initializeListener(gymId);
    }
  }

  crearTipo() {
    this.isCreating.set(true);
    this.modalData.set(null);
    this.isModalOpen.set(true);
  }

  editarTipo(tipo: TipoEntrenamiento) {
    this.isCreating.set(false);
    this.modalData.set(tipo);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.modalData.set(null);
  }

  async saveChanges(nombre: string) {
    try {
      await this.tipoEntrenamientoService.guardarTipo(nombre, this.modalData());
      this.showToast(`¡Tipo de entrenamiento ${this.isCreating() ? 'creado' : 'actualizado'}!`, 'success');
      this.closeModal();
    } catch (e: any) {
      if (e.message === 'Este tipo de entrenamiento ya existe') {
        this.showToast(e.message, 'warning');
      } else {
        console.error(e);
        this.showToast('Error al guardar cambios', 'danger');
      }
    }
  }

  async eliminarTipo(tipo: TipoEntrenamiento) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Tipo',
      message: `¿Estás seguro de que deseas eliminar "${tipo.nombre}"? Esto no afectará a los encuentros ya programados.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.tipoEntrenamientoService.delete(tipo.id);
              this.showToast('Tipo de entrenamiento eliminado', 'success');
            } catch (e: any) {
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

  async cargarPredeterminados() {
    try {
      await this.tipoEntrenamientoService.cargarPredeterminadosParaUsuarioActual();
      this.showToast('Tipos predeterminados cargados correctamente', 'success');
    } catch (e: any) {
      console.error(e);
      this.showToast('Error al cargar tipos predeterminados', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top',
      cssClass: 'premium-toast'
    });
    await toast.present();
  }
}
