import { Component, OnInit, signal, computed, inject } from '@angular/core';
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
  IonAvatar, IonButtons, IonBackButton, IonChip, IonList, IonItem, IonLabel, IonInput, IonProgressBar, IonSpinner
} from '@ionic/angular/standalone';
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
  arrowBackOutline
} from 'ionicons/icons';
import { User as LibraryUser, Rutina, Rol } from 'gym-library';

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
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.css'],
  standalone: true,
  imports: [
    IonChip, IonBackButton, IonButtons, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonAvatar, IonList, IonItem,
    IonLabel, IonInput, IonProgressBar, IonSpinner,
    FormsModule, ReactiveFormsModule, CommonModule
  ],
})
export class PerfilPage implements OnInit {
  private authService = inject(AuthService); // Actualiza sesión local
  private userService = inject(UserService);
  private rutinaService = inject(RutinaService);
  private entrenadoService = inject(EntrenadoService);
  private storageService = inject(FirebaseStorageService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  currentUser = signal<User | null>(null);
  rutinas = signal<Rutina[]>([]);
  isEditing = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  editForm!: FormGroup;

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
      'arrow-back-outline': arrowBackOutline
    });
  }

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser() as User);
    this.rutinas.set(this.rutinaService.rutinas());
    this.initForm();
  }

  private initForm() {
    const user = this.currentUser();
    this.editForm = this.fb.group({
      nombre: [user?.nombre || '', [Validators.required, Validators.minLength(3)]],
      email: [{ value: user?.email || '', disabled: true }],
      plan: [{ value: user?.plan || '', disabled: true }]
    });
  }

  toggleEdit() {
    if (this.isEditing()) {
      this.initForm(); // Reset form when canceling
    }
    this.isEditing.set(!this.isEditing());
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

      const updatedData = {
        nombre: this.editForm.value.nombre
      };

      await this.userService.updateUser(user.uid, updatedData);

      // Update local signal (usually UserService would trigger this, but we update locally for better UX)
      this.currentUser.update(u => u ? { ...u, ...updatedData } : null);

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

      this.currentUser.update(u => u ? { ...u, photoURL } : null);
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
