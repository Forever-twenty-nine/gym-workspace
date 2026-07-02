import { Component, OnInit, signal, computed, inject, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Platform, LoadingController, ToastController, MenuController, ModalController } from '@ionic/angular/standalone';

import {
  IonButton, IonIcon, IonMenu, IonSpinner,
  IonHeader, IonToolbar, IonContent, IonButtons, IonFooter, IonBadge, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { Unsubscribe } from 'firebase/firestore';
import { addIcons } from 'ionicons';
import {
  logOutOutline, personOutline, mailOutline, shieldOutline, timeOutline, checkmarkCircleOutline,
  trophyOutline, fitnessOutline, statsChartOutline, pencilOutline, cameraOutline, saveOutline,
  closeOutline, notificationsOutline, lockClosedOutline, arrowBackOutline, starOutline, alertCircleOutline,
  checkmarkCircle, person, trophy, mail, star, helpCircleOutline,
  flagOutline, barChartOutline, chatbubblesOutline
} from 'ionicons/icons';

import { User as LibraryUser, Rutina, Plan, SolicitudPlan, Objetivo, Rol } from 'gym-library';
export interface User extends LibraryUser {
  photoURL?: string;
}

import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { RutinaService } from '../../../../core/services/rutina.service';
import { EntrenadoService } from '../../../../core/services/entrenado.service';
import { PlanService } from '../../../../core/services/plan.service';
import { MensajeService } from '../../../../core/services/mensaje.service';
import { MensajesGlobalesService } from '../../../../core/services/mensajes-globales.service';
import { InvitacionService } from '../../../../core/services/invitacion.service';

import { EditProfileModalComponent } from '../../../perfil/components/edit-profile-modal/edit-profile-modal.component';
import { PremiumRequestModalComponent } from '../../../perfil/components/premium-request-modal/premium-request-modal.component';
import { NotificationsComponent } from '../../../perfil/notifications/notifications.component';
import { ChatListModalComponent } from '../../../perfil/chat/chat-list-modal/chat-list-modal.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon, IonMenu, IonSpinner, IonButton,
    IonHeader, IonToolbar, IonContent, IonButtons, IonFooter, IonBadge, IonItem, IonLabel,
    NgOptimizedImage, EditProfileModalComponent, PremiumRequestModalComponent
  ],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private rutinaService = inject(RutinaService);
  public entrenadoService = inject(EntrenadoService);
  private planService = inject(PlanService);
  private mensajeService = inject(MensajeService);
  private mensajesGlobalesService = inject(MensajesGlobalesService);
  private invitacionService = inject(InvitacionService);
  private router = inject(Router);
  public loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private platform = inject(Platform);
  private menuCtrl = inject(MenuController);
  private modalCtrl = inject(ModalController);

  currentUser = computed(() => this.authService.currentUser() as User);
  currentEntrenado = computed(() => {
    const user = this.currentUser();
    return user?.role === 'entrenado' ? this.entrenadoService.getEntrenado(user.uid)() : null;
  });

  rutinas = signal<Rutina[]>([]);
  ultimasolicitud = signal<SolicitudPlan | null>(null);

  isEditModalOpen = signal<boolean>(false);
  isPremiumModalOpen = signal<boolean>(false);
  isLoggingOut = signal(false);

  // Contadores para atajos de Alertas y Mensajes
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

  readonly canUseChat = computed(() => {
    const user = this.currentUser();
    return user && user.role !== 'gimnasio';
  });

  private solicitudesUnsubscribe?: Unsubscribe;

  constructor() {
    addIcons({
      logOutOutline, personOutline, mailOutline, shieldOutline, timeOutline, checkmarkCircleOutline,
      trophyOutline, fitnessOutline, statsChartOutline, pencilOutline, cameraOutline, saveOutline,
      closeOutline, notificationsOutline, lockClosedOutline, arrowBackOutline, starOutline, alertCircleOutline,
      checkmarkCircle, person, trophy, mail, star, helpCircleOutline,
      flagOutline, barChartOutline, chatbubblesOutline
    });

    effect(() => {
      const user = this.currentUser();
      if (user && user.role !== 'gimnasio') {
        this.iniciarListenerSolicitudes(user.uid);
      }
    });
  }

  ngOnInit() {
    this.rutinas.set(this.rutinaService.rutinas());
    this.menuCtrl.enable(true, 'profile-menu');
  }

  ngOnDestroy() {
    if (this.solicitudesUnsubscribe) {
      this.solicitudesUnsubscribe();
    }
  }

  openEditModal() {
    this.isEditModalOpen.set(true);
  }

  closeEditModal() {
    this.isEditModalOpen.set(false);
  }

  openPremiumModal() {
    this.isPremiumModalOpen.set(true);
  }

  closePremiumModal() {
    this.isPremiumModalOpen.set(false);
  }

  async openNotifications(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: NotificationsComponent,
      cssClass: 'premium-modal'
    });
    await modal.present();
  }

  async openChatList(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ChatListModalComponent,
      cssClass: 'premium-modal'
    });
    await modal.present();
  }

  private iniciarListenerSolicitudes(userId: string) {
    if (this.solicitudesUnsubscribe) this.solicitudesUnsubscribe();
    this.solicitudesUnsubscribe = this.planService.getSolicitudesUsuarioListener(userId, (solicitudes: SolicitudPlan[]) => {
      this.ultimasolicitud.set(solicitudes && solicitudes.length > 0 ? solicitudes[0] : null);
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    toast.present();
  }

  async logout() {
    const loading = await this.loadingCtrl.create({
      message: 'Cerrando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      this.isLoggingOut.set(true);

      if (this.menuCtrl) {
        await this.menuCtrl.close('profile-menu');
        await this.menuCtrl.close();
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      await this.authService.logout();
      localStorage.removeItem('gym_auth_user');
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('🛡️ Profile: Error en logout:', error);
      window.location.href = '/login';
    } finally {
      this.isLoggingOut.set(false);
      await loading.dismiss();
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