import { Component, OnInit, inject, signal } from '@angular/core';
import { IonContent, IonCard, IonCardContent, IonIcon, IonButton, AlertController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barChartOutline, add } from 'ionicons/icons';
import { BackgroundComponent } from '../../shared/components/background/background.component';
import { TiposEntrenamientoListComponent } from '../../shared/components/tipos-entrenamiento-list/tipos-entrenamiento-list.component';
import { TipoEntrenamientoModalComponent } from '../../shared/components/tipo-entrenamiento-modal/tipo-entrenamiento-modal.component';
import { AuthService } from '../../core/services/auth.service';
import { TipoEntrenamientoService } from '../../core/services/tipo-entrenamiento.service';
import { TipoEntrenamiento } from 'gym-library';

@Component({
  selector: 'app-gimnasio-dashboard',
  templateUrl: 'gimnasio-dashboard.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonButton,
    BackgroundComponent,
    TiposEntrenamientoListComponent,
    TipoEntrenamientoModalComponent
  ],
})
export class GimnasioDashboardPage implements OnInit {
  private authService = inject(AuthService);
  private tipoEntrenamientoService = inject(TipoEntrenamientoService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  readonly tipos = this.tipoEntrenamientoService.tipos;

  isModalOpen = signal(false);
  modalData = signal<TipoEntrenamiento | null>(null);
  isCreating = signal(false);

  constructor() {
    addIcons({ barChartOutline, add });
  }

  ngOnInit() {
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
    const user = this.authService.currentUser();
    if (!user) return;
    const gymId = user.gimnasioId || user.uid;

    try {
      const data = this.modalData();
      const duplicate = this.tipos().some(t => t.nombre.toLowerCase() === nombre.toLowerCase() && (!data || t.id !== data.id));
      if (duplicate) {
        this.showToast('Este tipo de entrenamiento ya existe', 'warning');
        return;
      }

      if (this.isCreating()) {
        const nuevoTipo: TipoEntrenamiento = {
          id: '',
          nombre,
          gimnasioId: gymId,
          fechaCreacion: new Date()
        };
        await this.tipoEntrenamientoService.save(nuevoTipo);
        this.showToast('¡Tipo de entrenamiento creado!', 'success');
      } else if (data) {
        const tipoActualizado: TipoEntrenamiento = {
          ...data,
          nombre
        };
        await this.tipoEntrenamientoService.save(tipoActualizado);
        this.showToast('¡Tipo de entrenamiento actualizado!', 'success');
      }
      this.closeModal();
    } catch (e) {
      console.error(e);
      this.showToast('Error al guardar cambios', 'danger');
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

  async cargarPredeterminados() {
    const user = this.authService.currentUser();
    if (!user) return;
    const gymId = user.gimnasioId || user.uid;

    try {
      await this.tipoEntrenamientoService.loadDefaultTypes(gymId);
      this.showToast('Tipos predeterminados cargados correctamente', 'success');
    } catch (e) {
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