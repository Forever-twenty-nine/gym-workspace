import { Component, OnInit, signal, computed, inject, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Platform, LoadingController, ToastController, MenuController } from '@ionic/angular/standalone';

import {
  IonButton, IonIcon, IonBadge, IonMenu, IonSpinner, IonProgressBar,
} from '@ionic/angular/standalone';
import { Unsubscribe } from 'firebase/firestore';
import { addIcons } from 'ionicons';
import {
  logOutOutline, personOutline, mailOutline, shieldOutline, timeOutline, checkmarkCircleOutline,
  trophyOutline, fitnessOutline, statsChartOutline, pencilOutline, cameraOutline, saveOutline,
  closeOutline, notificationsOutline, lockClosedOutline, arrowBackOutline, starOutline, alertCircleOutline,
  checkmarkCircle, person, trophy, mail, star, helpCircleOutline
} from 'ionicons/icons';

import { User as LibraryUser, Rutina, Plan, SolicitudPlan, Objetivo } from 'gym-library';
export interface User extends LibraryUser {
  photoURL?: string;
}

import { UserService } from '../../../../../core/services/user.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { RutinaService } from '../../../../../core/services/rutina.service';
import { EntrenadoService } from '../../../../../core/services/entrenado.service';
import { FirebaseStorageService } from '../../../../../core/services/firebase-storage.service';
import { PlanService } from '../../../../../core/services/plan.service';
import { NotificacionService } from '../../../../../core/services/notificacion.service';

import { EditProfileModalComponent } from './components/edit-profile-modal/edit-profile-modal.component';
import { ProfileInfoCardComponent } from './components/profile-info-card/profile-info-card.component';
import { PremiumRequestModalComponent } from './components/premium-request-modal/premium-request-modal.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon, IonMenu, IonSpinner, IonProgressBar, IonButton,
    NgOptimizedImage, EditProfileModalComponent, ProfileInfoCardComponent, PremiumRequestModalComponent
  ],
})
export class ProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private rutinaService = inject(RutinaService);
  public entrenadoService = inject(EntrenadoService);
  private storageService = inject(FirebaseStorageService);
  private planService = inject(PlanService);
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);
  public loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private platform = inject(Platform);
  private menuCtrl = inject(MenuController);

  currentUser = computed(() => this.authService.currentUser() as User);
  currentEntrenado = computed(() => {
    const user = this.currentUser();
    return user?.role === 'entrenado' ? this.entrenadoService.getEntrenado(user.uid)() : null;
  });

  rutinas = signal<Rutina[]>([]);
  ultimasolicitud = signal<SolicitudPlan | null>(null);

  isUploading = signal<boolean>(false);
  isEditModalOpen = signal<boolean>(false);
  isPremiumModalOpen = signal<boolean>(false);

  private solicitudesUnsubscribe?: Unsubscribe;

  constructor() {
    addIcons({
      logOutOutline, personOutline, mailOutline, shieldOutline, timeOutline, checkmarkCircleOutline,
      trophyOutline, fitnessOutline, statsChartOutline, pencilOutline, cameraOutline, saveOutline,
      closeOutline, notificationsOutline, lockClosedOutline, arrowBackOutline, starOutline, alertCircleOutline,
      checkmarkCircle, person, trophy, mail, star, helpCircleOutline
    });

    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.iniciarListenerSolicitudes(user.uid);
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

  private iniciarListenerSolicitudes(userId: string) {
    if (this.solicitudesUnsubscribe) this.solicitudesUnsubscribe();
    this.solicitudesUnsubscribe = this.planService.getSolicitudesUsuarioListener(userId, (solicitudes: SolicitudPlan[]) => {
      this.ultimasolicitud.set(solicitudes && solicitudes.length > 0 ? solicitudes[0] : null);
    });
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

    const loading = await this.loadingCtrl.create({ message: 'Subiendo foto...', spinner: 'crescent' });
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
    const fileInput = document.getElementById('shared-photo-input') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    toast.present();
  }

  isLoggingOut = signal(false);

  async logout() {
    const loading = await this.loadingCtrl.create({
      message: 'Cerrando sesión...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      this.isLoggingOut.set(true);

      // PASO CRÍTICO: Esperar a que el menú se cierre TOTALMENTE antes de que el @if 
      // de app.component destruya este componente. Si se destruye antes, el backdrop se queda "huérfano" y bloquea la UI.
      if (this.menuCtrl) {
        await this.menuCtrl.close('profile-menu');
        await this.menuCtrl.close(); // Doble cierre por seguridad
      }

      // Pequeño delay adicional para que Ionic limpie el DOM del menú
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cerramos sesión en Firebase (esto disparará el @if y destruirá este componente)
      await this.authService.logout();
      
      // Limpiar caché local
      localStorage.removeItem('gym_auth_user');
      
      // Redirigir al login
      await this.router.navigate(['/login'], { replaceUrl: true });
      
      this.showToast('Sesión cerrada correctamente', 'success');
    } catch (error) {
      console.error('🛡️ Profile: Error en logout:', error);
      // Fallback: Si el router se queda bloqueado, forzamos recarga
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
