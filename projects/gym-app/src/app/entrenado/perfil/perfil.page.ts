import { Component, OnInit, signal, computed, inject, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,

  IonCardContent,
  IonAvatar, IonButtons, IonBackButton, IonChip, IonList, IonItem, IonLabel, IonInput, IonProgressBar, IonSpinner, IonBadge,
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { Unsubscribe } from 'firebase/firestore';
import { addIcons } from 'ionicons';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  logOutOutline,
  personOutline,
  mailOutline,
  shieldOutline,
  timeOutline,
  checkmarkCircleOutline,
  trophyOutline,
  fitnessOutline,
  statsChartOutline,
  pencilOutline,
  cameraOutline,
  saveOutline,
  closeOutline,
  notificationsOutline,
  lockClosedOutline,
  arrowBackOutline,
  starOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { User as LibraryUser, Rutina, Rol, Plan, SolicitudPlan, Objetivo } from 'gym-library';

// Extendemos la interfaz User localmente para asegurar la existencia de photoURL
// en caso de que la caché de la librería no se actualice inmediatamente.
export interface User extends LibraryUser {
  photoURL?: string;
}
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { RutinaService } from '../../core/services/rutina.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { FirebaseStorageService } from '../../core/services/firebase-storage.service';
import { PlanService } from '../../core/services/plan.service';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.css'],
  standalone: true,
  imports: [
    IonChip, IonBackButton, IonButtons, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonAvatar, IonList, IonItem,
    IonLabel, IonInput, IonProgressBar, IonSpinner, IonSelect, IonSelectOption,
    FormsModule, ReactiveFormsModule, CommonModule
  ],
})
export class PerfilPage implements OnInit, OnDestroy {
  private authService = inject(AuthService); // Actualiza sesión local
  private userService = inject(UserService);
  private rutinaService = inject(RutinaService);
  public entrenadoService = inject(EntrenadoService);
  private storageService = inject(FirebaseStorageService);
  private planService = inject(PlanService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  currentUser = computed(() => this.authService.currentUser() as User);
  currentEntrenado = computed(() => {
    const user = this.currentUser();
    return user ? this.entrenadoService.getEntrenado(user.uid)() : null;
  });
  rutinas = signal<Rutina[]>([]);
  ultimasolicitud = signal<SolicitudPlan | null>(null);
  isEditing = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  private solicitudesUnsubscribe?: Unsubscribe;
  editForm!: FormGroup;
  objetivoOptions = Object.values(Objetivo);

  // Estadísticas computadas
  estadisticas = computed(() => {
    const user = this.currentUser();
    const todasRutinas = this.rutinas();

    if (!user || !todasRutinas) return null;

    // Filtrar rutinas asignadas al usuario actual
    const misRutinas = todasRutinas.filter(r => {
      const entrenado = this.entrenadoService.getEntrenado(user.uid)();
      return entrenado?.rutinasAsignadasIds?.includes(r.id) || false;
    });

    const rutinasCompletadas = 0; // No hay propiedad completado
    const rutinasActivas = misRutinas.filter(r => r.activa).length;
    const totalEjercicios = misRutinas.reduce((total, r) =>
      total + (r.ejerciciosIds?.length || 0), 0
    );

    return {
      totalRutinas: misRutinas.length,
      completadas: rutinasCompletadas,
      activas: rutinasActivas,
      totalEjercicios
    };
  });

  constructor() {
    addIcons({
      'log-out-outline': logOutOutline,
      'person-outline': personOutline,
      'mail-outline': mailOutline,
      'shield-outline': shieldOutline,
      'time-outline': timeOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'trophy-outline': trophyOutline,
      'fitness-outline': fitnessOutline,
      'stats-chart-outline': statsChartOutline,
      'pencil-outline': pencilOutline,
      'camera-outline': cameraOutline,
      'save-outline': saveOutline,
      'close-outline': closeOutline,
      'notifications-outline': notificationsOutline,
      'lock-closed-outline': lockClosedOutline,
      'arrow-back-outline': arrowBackOutline,
      'star-outline': starOutline,
      'alert-circle-outline': alertCircleOutline
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
    this.rutinas.set(this.rutinaService.rutinas());
    this.initForm();
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

  private initForm() {
    const user = this.currentUser();
    const entrenado = user ? this.entrenadoService.getEntrenado(user.uid)() : null;

    this.editForm = this.fb.group({
      nombre: [user?.nombre || '', [Validators.required, Validators.minLength(3)]],
      email: [{ value: user?.email || '', disabled: true }],
      plan: [{ value: user?.plan || '', disabled: true }],
      objetivo: [entrenado?.objetivo || '']
    });
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
    if (this.isEditing()) {
      this.initForm(); // Asegurar datos frescos al empezar a editar
    }
  }

  async saveProfile() {
    if (this.editForm.invalid) return;

    const loading = await this.loadingCtrl.create({
      message: 'Guardando cambios...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const user = this.currentUser();
      if (!user) return;

      const updatedUserData = {
        nombre: this.editForm.value.nombre
      };

      // Guardar cambios del usuario
      await this.userService.updateUser(user.uid, updatedUserData);

      // Guardar cambios del entrenado (objetivo)
      if (user.role === 'entrenado') {
        const entrenadoData = this.entrenadoService.getEntrenado(user.uid)();
        if (entrenadoData) {
          const updatedEntrenado = {
            ...entrenadoData,
            objetivo: this.editForm.value.objetivo
          };
          await this.entrenadoService.save(updatedEntrenado);
        }
      }

      this.isEditing.set(false);
      this.showToast('Perfil actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showToast('Error al actualizar el perfil', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's an image
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
              // La actualización de ultimasolicitud ocurrirá sola por el listener
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

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
      this.router.navigate(['/login']);
    }
  }

  /**
   * Obtiene el color del badge según el rol del usuario
   */
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

  /**
   * Obtiene el nombre a mostrar según el rol del usuario
   */
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

  /**
   * Obtiene las iniciales del nombre
   */
  getIniciales(nombre?: string): string {
    if (!nombre) return 'U';
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
