import { Component, OnInit, inject, computed, Signal, signal, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonItem, IonLabel, IonList, IonAvatar, IonBadge, IonSpinner } from '@ionic/angular/standalone';
import { Unsubscribe } from 'firebase/firestore';
import { addIcons } from 'ionicons';
import { person, trophy, checkmarkCircle, mail, star, logOutOutline, shieldOutline, personOutline, fitnessOutline, alertCircleOutline, starOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { PlanService } from '../../core/services/plan.service';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Rol, SolicitudPlan } from 'gym-library';

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
    IonAvatar,
    IonBadge,
    IonSpinner
  ],
  styles: [`
    /* Estilos para el perfil unificado */
    .profile-card {
      margin: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .profile-content {
      padding: 16px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .profile-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
      color: white;
      font-weight: bold;
      font-size: 1.2rem;
    }

    .profile-info h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--ion-color-primary);
    }

    .info-card {
      margin: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .card-header-compact {
      padding: 12px 16px 8px;
    }

    .card-header-compact ion-card-title {
      font-size: 1.1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-grid {
      display: grid;
      gap: 12px;
      padding: 8px 16px 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .info-text {
      flex: 1;
    }

    .info-label {
      display: block;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      display: block;
      font-size: 0.95rem;
      color: var(--ion-color-dark);
      font-weight: 500;
    }

    .user-id {
      font-family: monospace;
      font-size: 0.85rem;
      background: var(--ion-color-light);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .account-card {
      margin: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .account-content {
      padding: 16px;
    }

    .account-content ion-button {
      --border-radius: 8px;
      font-weight: 600;
      height: 44px;
    }
  `]
})
export class PerfilPage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private planService = inject(PlanService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  currentUser = computed(() => this.authService.currentUser());
  ultimasolicitud = signal<SolicitudPlan | null>(null);
  private solicitudesUnsubscribe?: Unsubscribe;

  constructor() {
    addIcons({ person, trophy, checkmarkCircle, mail, star, logOutOutline, shieldOutline, personOutline, fitnessOutline, alertCircleOutline, starOutline });

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

  private async showToast(message: string, color: 'success' | 'danger') {
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
