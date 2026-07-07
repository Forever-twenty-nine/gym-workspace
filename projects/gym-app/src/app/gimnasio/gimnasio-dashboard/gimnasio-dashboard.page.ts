import { Component, OnInit, inject } from '@angular/core';
import { IonContent, IonCard, IonIcon, AlertController, ToastController, IonRow, IonCol, IonText, IonGrid, IonItem, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barChartOutline, add } from 'ionicons/icons';
import { BackgroundComponent } from '../../shared/components/background/background.component';
import { TiposEntrenamientoComponent } from '../../shared/components/tipos-entrenamiento/tipos-entrenamiento';
import { AuthService } from '../../core/services/auth.service';
import { TipoEntrenamientoService } from '../../core/services/tipo-entrenamiento.service';

@Component({
  selector: 'app-gimnasio-dashboard',
  templateUrl: 'gimnasio-dashboard.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonIcon,
    BackgroundComponent,
    TiposEntrenamientoComponent,
    IonRow,
    IonCol,
    IonText,
    IonGrid,
    IonItem,
    IonLabel
],
})
export class GimnasioDashboardPage implements OnInit {
  private authService = inject(AuthService);
  private tipoEntrenamientoService = inject(TipoEntrenamientoService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ barChartOutline, add });
  }

  ngOnInit() {
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