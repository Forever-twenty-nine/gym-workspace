import { Component, OnInit, OnDestroy, signal, inject, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner
} from '@ionic/angular/standalone';
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
import { ProgresoEstadisticasComponent } from './components/progreso-estadisticas/progreso-estadisticas.component';
import { EditProfileModalComponent } from '../../shared/components/header-tabs/components/profile/components/edit-profile-modal/edit-profile-modal.component';
import { PremiumRequestModalComponent } from '../../shared/components/header-tabs/components/profile/components/premium-request-modal/premium-request-modal.component';
import { NotificationsComponent } from '../../shared/components/header-tabs/components/notifications/notifications.component';
import { ModalController, ToastController, LoadingController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    IonContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSpinner,
    PageBackgroundComponent,
    TrainerBackgroundComponent,
    GymBackgroundComponent,
    ProgresoEstadisticasComponent,
    EditProfileModalComponent,
    PremiumRequestModalComponent
  ]
})
export class PerfilPage implements OnInit, OnDestroy {
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

  readonly currentSegment = signal<'perfil' | 'plan'>('perfil');
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

  private solicitudesUnsubscribe?: Unsubscribe;
  private userListenerInitialized = false;

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

    effect(() => {
      const user = this.currentUser();
      if (user && user.role === 'entrenado') {
        this.iniciarListenerSolicitudes(user.uid);
      }
    });

    effect(() => {
      const user = this.currentUser();
      if (user?.uid && user.role === 'entrenado' && !this.userListenerInitialized) {
        this.estadisticasService.initializeListener(user.uid);
        this.userListenerInitialized = true;
      }
    });
  }

  ngOnInit() {
    this.rutinas.set(this.rutinaService.rutinas());
  }

  ngOnDestroy() {
    if (this.solicitudesUnsubscribe) {
      this.solicitudesUnsubscribe();
    }
    const uid = this.currentUser()?.uid;
    const isEntrenado = this.currentUser()?.role === 'entrenado';
    if (uid && isEntrenado && this.userListenerInitialized) {
      this.estadisticasService.stopListener(uid);
    }
  }

  segmentChanged(event: any) {
    this.currentSegment.set(event.detail.value);
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

  async openNotifications() {
    const modal = await this.modalCtrl.create({
      component: NotificationsComponent,
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

      // Cerramos sesión en Firebase
      await this.authService.logout();

      // Limpiar caché local
      localStorage.removeItem('gym_auth_user');

      // Redirigir al login
      await this.router.navigate(['/login'], { replaceUrl: true });

      this.showToast('Sesión cerrada correctamente', 'success');
    } catch (error) {
      console.error('🛡️ Perfil: Error en logout:', error);
      window.location.href = '/login';
    } finally {
      this.isLoggingOut.set(false);
      await loading.dismiss();
    }
  }

  // Métodos para estadísticas
  readonly rutinasAsignadas = computed(() => {
    const userId = this.currentUser()?.uid;
    if (!userId) return [];

    const rutinas = this.rutinaService.rutinas();
    const entrenado = this.entrenadoService.getEntrenado(userId)();

    if (!rutinas.length || !entrenado?.rutinasAsignadasIds) return [];

    return rutinas.filter(rutina => entrenado.rutinasAsignadasIds!.includes(rutina.id));
  });

  readonly historialSesiones = computed<SesionRutina[]>(() => {
    const userId = this.currentUser()?.uid;
    if (!userId) return [];

    const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(userId)();

    return [...sesiones].sort((a, b) => {
      const dateA = a.fechaInicio instanceof Date ? a.fechaInicio : new Date(a.fechaInicio);
      const dateB = b.fechaInicio instanceof Date ? b.fechaInicio : new Date(b.fechaInicio);
      return dateB.getTime() - dateA.getTime();
    });
  });

  readonly estadisticasGenerales = computed(() => {
    const sesiones = this.historialSesiones();
    const rutinasAsignadas = this.rutinasAsignadas();

    const sesionesCompletadas = sesiones.filter(s => s.completada).length;
    const sesionesEnProgreso = sesiones.filter(s => !s.completada).length;

    const tiempoTotalSegundos = sesiones.reduce((total: number, sesion) => {
      return total + (sesion.duracion || 0);
    }, 0);

    const tiempoTotal = Math.round(tiempoTotalSegundos / 60);

    const totalEntrenamientosRealizados = sesiones.length;

    return {
      rutinasAsignadas: rutinasAsignadas.length,
      sesionesTotales: totalEntrenamientosRealizados,
      completadas: sesionesCompletadas,
      enProgreso: sesionesEnProgreso,
      tiempoTotal
    };
  });

  readonly dbEstadisticas = computed(() => {
    const uid = this.currentUser()?.uid;
    if (!uid) return null;
    return this.estadisticasService.getEstadisticas(uid)();
  });

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
