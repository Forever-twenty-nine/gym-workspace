import { Component, OnInit, signal, inject, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { IonContent, IonButton, IonIcon, IonBadge, IonSegment, IonSegmentButton, IonLabel, IonSpinner, IonHeader, IonToolbar, IonButtons, IonBackButton, IonFooter } from '@ionic/angular/standalone';
import { Unsubscribe } from 'firebase/firestore';
import { addIcons } from 'ionicons';
import {
  logOutOutline, personOutline, mailOutline, shieldOutline, timeOutline, checkmarkCircleOutline,
  trophyOutline, fitnessOutline, statsChartOutline, pencilOutline, cameraOutline, saveOutline,
  closeOutline, notificationsOutline, lockClosedOutline, arrowBackOutline, starOutline, alertCircleOutline,
  checkmarkCircle, person, trophy, mail, star, helpCircleOutline,
  flagOutline, barChartOutline
} from 'ionicons/icons';

import { User as LibraryUser, Rutina, Plan, SolicitudPlan, SesionRutina, Rol } from 'gym-library';
export interface User extends LibraryUser {
  id: string;
  photoURL?: string;
}

import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { RutinaService } from '../../core/services/rutina.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { PlanService } from '../../core/services/plan.service';
import { SesionRutinaService } from '../../core/services/sesion-rutina.service';
import { EstadisticasEntrenadoService } from '../../core/services/estadisticas-entrenado.service';
import { MensajeService } from '../../core/services/mensaje.service';
import { MensajesGlobalesService } from '../../core/services/mensajes-globales.service';
import { InvitacionService } from '../../core/services/invitacion.service';

import { PageBackgroundComponent } from '../../shared/components/page-background/page-background.component';
import { TrainerBackgroundComponent } from '../../shared/components/trainer-background/trainer-background.component';
import { GymBackgroundComponent } from '../../shared/components/gym-background/gym-background.component';
import { ProgresoEstadisticasComponent } from './perfil-tab-estadisticas/components/progreso-estadisticas/progreso-estadisticas.component';
import { EditProfileModalComponent } from './components/edit-profile-modal/edit-profile-modal.component';
import { PremiumRequestModalComponent } from './components/premium-request-modal/premium-request-modal.component';
import { NotificationsComponent } from '../../shared/components/header-tabs/components/notifications/notifications.component';
import { ModalController, ToastController, LoadingController } from '@ionic/angular/standalone';

type PerfilSegment = 'perfil' | 'plan' | 'estadisticas';

import { PerfilTabInfoComponent } from './perfil-tab-info/perfil-tab-info.component';
import { PerfilTabPlanComponent } from './perfil-tab-plan/perfil-tab-plan.component';
import { PerfilTabEstadisticasComponent } from './perfil-tab-estadisticas/perfil-tab-estadisticas.component';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    IonHeader,
    IonToolbar,
    PageBackgroundComponent,
    TrainerBackgroundComponent,
    GymBackgroundComponent,
    EditProfileModalComponent,
    PremiumRequestModalComponent,
    PerfilTabInfoComponent,
    PerfilTabPlanComponent,
    PerfilTabEstadisticasComponent,
    IonFooter
]
})
export class PerfilPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly rutinaService = inject(RutinaService);
  public readonly entrenadoService = inject(EntrenadoService);
  private readonly planService = inject(PlanService);
  private readonly sesionRutinaService = inject(SesionRutinaService);
  private readonly estadisticasService = inject(EstadisticasEntrenadoService);
  private readonly mensajeService = inject(MensajeService);
  private readonly mensajesGlobalesService = inject(MensajesGlobalesService);
  private readonly invitacionService = inject(InvitacionService);
  
  private readonly router = inject(Router);
  private readonly modalCtrl = inject(ModalController);
  private readonly toastCtrl = inject(ToastController);
  private readonly loadingCtrl = inject(LoadingController);

  readonly currentSegment = signal<PerfilSegment>('perfil');
  readonly currentUser = computed(() => this.authService.currentUser() as User);
  readonly isPremium = computed(() => this.currentUser()?.plan === Plan.PREMIUM);
  
  readonly currentEntrenado = computed(() => {
    const user = this.currentUser();
    return user?.role === 'entrenado' ? this.entrenadoService.getEntrenado(user.uid)() : null;
  });

  readonly rutinas = signal<Rutina[]>([]);
  readonly ultimasolicitud = signal<SolicitudPlan | null>(null);
  
  readonly isEditModalOpen = signal<boolean>(false);
  readonly isPremiumModalOpen = signal<boolean>(false);
  readonly isLoggingOut = signal(false);

  // Contador de notificaciones no leídas
  readonly unreadChatsCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    return this.mensajeService.getContadorNoLeidos(user.uid)();
  });

  readonly mensajesNoLeidos = this.mensajesGlobalesService.mensajesNoLeidos;

  readonly invitacionesPendientes = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    if (user.role === Rol.ENTRENADOR || user.role === Rol.PERSONAL_TRAINER) {
      return this.invitacionService.getInvitacionesPendientesPorEntrenador(user.uid)();
    } else if (user.role === Rol.ENTRENADO) {
      return this.invitacionService.getInvitacionesPendientesPorEntrenado(user.uid)();
    }
    return [];
  });

  readonly totalNotificationsCount = computed(() => {
    return this.unreadChatsCount() + this.mensajesNoLeidos().length + this.invitacionesPendientes().length;
  });

  constructor() {
    addIcons({
      logOutOutline, personOutline, mailOutline, shieldOutline, timeOutline, checkmarkCircleOutline,
      trophyOutline, fitnessOutline, statsChartOutline, pencilOutline, cameraOutline, saveOutline,
      closeOutline, notificationsOutline, lockClosedOutline, arrowBackOutline, starOutline, alertCircleOutline,
      checkmarkCircle, person, trophy, mail, star, helpCircleOutline,
      flagOutline, barChartOutline
    });

    effect((onCleanup) => {
      const user = this.currentUser();
      if (user && user.role === 'entrenado') {
        const unsubscribe = this.planService.getSolicitudesUsuarioListener(user.uid, (solicitudes: SolicitudPlan[]) => {
          this.ultimasolicitud.set(solicitudes && solicitudes.length > 0 ? solicitudes[0] : null);
        });
        onCleanup(() => unsubscribe());
      }
    });

    effect((onCleanup) => {
      const user = this.currentUser();
      if (user?.uid && user.role === 'entrenado') {
        this.estadisticasService.initializeListener(user.uid);
        onCleanup(() => this.estadisticasService.stopListener(user.uid));
      }
    });
  }

  ngOnInit(): void {
    this.rutinas.set(this.rutinaService.rutinas());
  }

  segmentChanged(event: any): void {
    const value = event.detail?.value;
    if (value === 'perfil' || value === 'plan' || value === 'estadisticas') {
      this.currentSegment.set(value);
    }
  }

  openEditModal(): void {
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
  }

  openPremiumModal(): void {
    this.isPremiumModalOpen.set(true);
  }

  closePremiumModal(): void {
    this.isPremiumModalOpen.set(false);
  }

  async openNotifications(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: NotificationsComponent,
      componentProps: {
        unreadChatsCount: this.unreadChatsCount(),
        mensajesNoLeidos: this.mensajesNoLeidos(),
        invitacionesPendientes: this.invitacionesPendientes(),
      },
      cssClass: 'premium-modal'
    });
    await modal.present();
  }

  async logout(): Promise<void> {
    this.isLoggingOut.set(true);
    const loading = await this.loadingCtrl.create({
      message: 'Cerrando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await this.authService.logout();
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('🛡️ Perfil: Error en logout:', error);
      // El servicio ya muestra un toast de error, no es necesario duplicarlo.
    } finally {
      await loading.dismiss();
      this.isLoggingOut.set(false);
    }
  }

  getRoleDisplayName(role?: string): string {
    switch (role) {
      case 'gimnasio': return 'Gimnasio';
      case 'entrenado': return 'Entrenado';
      case 'entrenador': return 'Entrenador';
      case 'user': return 'Usuario';
      default: return 'Usuario';
    }
  }

  getIniciales(nombre?: string): string {
    if (!nombre) return 'U';
    return nombre.split(' ').map((n: string) => n.charAt(0).toUpperCase()).join('').substring(0, 2);
  }
}

