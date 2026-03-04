import { Component, OnInit, inject, computed, Signal, signal, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonSpinner,
  IonProgressBar
} from '@ionic/angular/standalone';
import { Unsubscribe } from 'firebase/firestore';
import { addIcons } from 'ionicons';
import {
  person,
  trophy,
  checkmarkCircle,
  mail,
  star,
  logOutOutline,
  shieldOutline,
  personOutline,
  fitnessOutline,
  alertCircleOutline,
  starOutline,
  mailOutline,
  trophyOutline,
  cameraOutline
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { PlanService } from '../../core/services/plan.service';
import { FirebaseStorageService } from '../../core/services/firebase-storage.service';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Rol, SolicitudPlan } from 'gym-library';
import { HeaderEntrenadorComponent } from '../components/header-entrenador/header-entrenador.component';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonSpinner,
    IonProgressBar,
    HeaderEntrenadorComponent
  ],
  styles: []
})
export class PerfilPage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private planService = inject(PlanService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private storageService = inject(FirebaseStorageService);

  currentUser = computed(() => this.authService.currentUser());
  ultimasolicitud = signal<SolicitudPlan | null>(null);
  isUploading = signal<boolean>(false);
  private solicitudesUnsubscribe?: Unsubscribe;

  constructor() {
    addIcons({
      person,
      trophy,
      checkmarkCircle,
      mail,
      star,
      logOutOutline,
      shieldOutline,
      personOutline,
      fitnessOutline,
      alertCircleOutline,
      starOutline,
      mailOutline,
      trophyOutline,
      cameraOutline
    });

    // Efecto para recargar la solicitud cuando cambia el usuario
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.iniciarListenerSolicitudes(user.uid);
      }
    });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    if (this.solicitudesUnsubscribe) {
      this.solicitudesUnsubscribe();
    }
  }

  private iniciarListenerSolicitudes(userId: string) {
    if (this.solicitudesUnsubscribe) {
      this.solicitudesUnsubscribe();
    }

    this.solicitudesUnsubscribe = this.planService.getSolicitudesUsuarioListener(userId, (solicitudes) => {
      if (solicitudes && solicitudes.length > 0) {
        this.ultimasolicitud.set(solicitudes[0]); // La más reciente por el orderBy en el service
      } else {
        this.ultimasolicitud.set(null);
      }
    });
  }

  async solicitarPremium() {
    const user = this.currentUser();
    if (!user) return;

    const alert = await this.alertCtrl.create({
      header: 'Solicitar Plan Premium',
      message: '¿Estás seguro de que deseas solicitar el plan Premium? Un administrador revisará tu solicitud.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Solicitar',
          handler: async () => {
            const loading = await this.loadingCtrl.create({ message: 'Enviando solicitud...' });
            await loading.present();
            try {
              await this.planService.solicitarPremium(user);
              // El listener actualizará la signal automáticamente
              this.showToast('Solicitud enviada correctamente', 'success');
            } catch (error) {
              console.error('Error al solicitar premium:', error);
              this.showToast('Error al enviar la solicitud', 'danger');
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Por favor selecciona una imagen válida', 'warning');
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    const loading = await this.loadingCtrl.create({
      message: 'Subiendo foto...',
      spinner: 'crescent'
    });
    await loading.present();
    this.isUploading.set(true);

    try {
      const path = this.storageService.getProfilePath(user.uid, file.name.split('.').pop());
      const photoURL = await this.storageService.uploadFile(path, file);

      await this.userService.updateUser(user.uid, { photoURL });

      this.showToast('Foto de perfil actualizada', 'success');
    } catch (error) {
      console.error('Error uploading photo:', error);
      this.showToast('Error al subir la foto', 'danger');
    } finally {
      this.isUploading.set(false);
      loading.dismiss();
    }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('photo-input') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    toast.present();
  }

  getBadgeColor(role?: string): string {
    switch (role) {
      case 'gimnasio':
        return 'danger';
      case 'entrenado':
        return 'success';
      case 'entrenador':
        return 'warning';
      case 'user':
        return 'secondary';
      default:
        return 'medium';
    }
  }

  getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'gimnasio':
        return 'Gimnasio';
      case 'entrenado':
        return 'Entrenado';
      case 'entrenador':
        return 'Entrenador';
      case 'user':
        return 'Usuario';
      default:
        return 'Usuario';
    }
  }

  getIniciales(nombre?: string): string {
    if (!nombre) return 'U';
    return nombre
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
      this.router.navigate(['/login']);
    }
  }
}
