import { Component, OnInit, signal, computed, inject, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Platform, AlertController, LoadingController, ToastController } from '@ionic/angular';

import {
  IonButton, IonIcon, IonChip, IonLabel, IonInput, IonSpinner, IonBadge,
  IonSelect, IonSelectOption, IonToggle, IonDatetime, IonDatetimeButton, IonModal, IonProgressBar,
} from '@ionic/angular/standalone';
import { Unsubscribe } from 'firebase/firestore';
import { addIcons } from 'ionicons';
import {
  logOutOutline, personOutline, mailOutline, shieldOutline, timeOutline, checkmarkCircleOutline,
  trophyOutline, fitnessOutline, statsChartOutline, pencilOutline, cameraOutline, saveOutline,
  closeOutline, notificationsOutline, lockClosedOutline, arrowBackOutline, starOutline, alertCircleOutline,
  checkmarkCircle, person, trophy, mail, star
} from 'ionicons/icons';

import { User as LibraryUser, Rutina, Rol, Plan, SolicitudPlan, Objetivo } from 'gym-library';
export interface User extends LibraryUser {
  photoURL?: string;
}

import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { RutinaService } from '../../../core/services/rutina.service';
import { EntrenadoService } from '../../../core/services/entrenado.service';
import { FirebaseStorageService } from '../../../core/services/firebase-storage.service';
import { PlanService } from '../../../core/services/plan.service';
import { NotificacionService } from '../../../core/services/notificacion.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonButton, IonIcon, IonChip, IonLabel,
    IonInput, IonSpinner, IonBadge, IonSelect, IonSelectOption,
    IonToggle, IonDatetime, IonDatetimeButton, IonModal, IonProgressBar,
    NgOptimizedImage
  ],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private rutinaService = inject(RutinaService);
  public entrenadoService = inject(EntrenadoService);
  private storageService = inject(FirebaseStorageService);
  private planService = inject(PlanService);
  private notificacionService = inject(NotificacionService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private platform = inject(Platform);

  currentUser = computed(() => this.authService.currentUser() as User);
  currentEntrenado = computed(() => {
    const user = this.currentUser();
    return user?.role === 'entrenado' ? this.entrenadoService.getEntrenado(user.uid)() : null;
  });

  rutinas = signal<Rutina[]>([]);
  ultimasolicitud = signal<SolicitudPlan | null>(null);
  
  // Segment view mode: 'info' | 'edit'
  viewMode = signal<'info' | 'edit'>('info');
  isUploading = signal<boolean>(false);
  private solicitudesUnsubscribe?: Unsubscribe;
  editForm!: FormGroup;
  
  objetivoOptions = Object.values(Objetivo);
  nivelOptions = ['Principiante', 'Intermedio', 'Avanzado', 'Atleta'];
  diasSemana = [
    { n: 1, label: 'Lun' },
    { n: 2, label: 'Mar' },
    { n: 3, label: 'Mié' },
    { n: 4, label: 'Jue' },
    { n: 5, label: 'Vie' },
    { n: 6, label: 'Sáb' },
    { n: 0, label: 'Dom' }
  ];

  estadisticas = computed(() => {
    const user = this.currentUser();
    const todasRutinas = this.rutinas();
    if (!user || !todasRutinas || user.role !== 'entrenado') return null;

    const misRutinas = todasRutinas.filter(r => {
      const entrenado = this.entrenadoService.getEntrenado(user.uid)();
      return entrenado?.rutinasAsignadasIds?.includes(r.id) || false;
    });

    return {
      totalRutinas: misRutinas.length,
      completadas: 0,
      activas: misRutinas.filter(r => r.activa).length,
      totalEjercicios: misRutinas.reduce((total, r) => total + (r.ejerciciosIds?.length || 0), 0)
    };
  });

  constructor() {
    addIcons({
      logOutOutline, personOutline, mailOutline, shieldOutline, timeOutline, checkmarkCircleOutline,
      trophyOutline, fitnessOutline, statsChartOutline, pencilOutline, cameraOutline, saveOutline,
      closeOutline, notificationsOutline, lockClosedOutline, arrowBackOutline, starOutline, alertCircleOutline,
      checkmarkCircle, person, trophy, mail, star
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
    this.initForm();
  }

  ngOnDestroy() {
    if (this.solicitudesUnsubscribe) {
      this.solicitudesUnsubscribe();
    }
  }

  toggleEditMode() {
    this.viewMode.set(this.viewMode() === 'info' ? 'edit' : 'info');
    if (this.viewMode() === 'edit') {
      this.initForm();
    }
  }

  private iniciarListenerSolicitudes(userId: string) {
    if (this.solicitudesUnsubscribe) this.solicitudesUnsubscribe();
    this.solicitudesUnsubscribe = this.planService.getSolicitudesUsuarioListener(userId, (solicitudes) => {
      this.ultimasolicitud.set(solicitudes && solicitudes.length > 0 ? solicitudes[0] : null);
    });
  }

  private initForm() {
    const user = this.currentUser();
    const entrenado = user?.role === 'entrenado' ? this.entrenadoService.getEntrenado(user.uid)() : null;

    this.editForm = this.fb.group({
      nombre: [user?.nombre || '', [Validators.required, Validators.minLength(3)]],
      email: [{ value: user?.email || '', disabled: true }],
      plan: [{ value: user?.plan || '', disabled: true }],
      objetivo: [entrenado?.objetivo || ''],
      nivel: [entrenado?.nivel || ''],
      recordatoriosEntrenamiento: [entrenado?.configNotificaciones?.recordatoriosEntrenamiento || false],
      horaRecordatorio: [entrenado?.configNotificaciones?.horaRecordatorio || '08:00'],
      diasRecordatorio: [entrenado?.configNotificaciones?.diasRecordatorio || []]
    });
  }

  isDiaSelected(dia: number): boolean {
    const seleccionados = this.editForm?.get('diasRecordatorio')?.value as number[];
    return seleccionados?.includes(dia) || false;
  }

  toggleDia(dia: number) {
    const control = this.editForm.get('diasRecordatorio');
    if (!control) return;

    const value = control.value;
    const seleccionados = Array.isArray(value) ? [...value] : [];
    const index = seleccionados.indexOf(dia);

    if (index > -1) {
      seleccionados.splice(index, 1);
    } else {
      seleccionados.push(dia);
    }

    control.setValue(seleccionados);
    control.markAsDirty();

    if (this.viewMode() === 'info') {
      this.saveNotificationSettings();
    }
  }

  async saveNotificationSettings() {
    const user = this.currentUser();
    const entrenadoData = this.currentEntrenado();
    if (!user || !entrenadoData || user.role !== 'entrenado') return;

    try {
      const configNotificaciones = {
        recordatoriosEntrenamiento: this.editForm.value.recordatoriosEntrenamiento,
        horaRecordatorio: this.editForm.value.horaRecordatorio,
        diasRecordatorio: this.editForm.value.diasRecordatorio
      };

      await this.entrenadoService.save({ ...entrenadoData, configNotificaciones });

      if (this.platform.is('capacitor')) {
        await this.notificacionService.programarRecordatoriosEntrenamiento(configNotificaciones);
      }
      this.showToast('Configuración de recordatorios actualizada', 'success');
    } catch (e) {
      console.error(e);
      this.showToast('Error al guardar la configuración', 'danger');
    }
  }

  async saveProfile() {
    if (this.editForm.invalid) return;

    const loading = await this.loadingCtrl.create({ message: 'Guardando cambios...', spinner: 'crescent' });
    await loading.present();

    try {
      const user = this.currentUser();
      if (!user) return;

      await this.userService.updateUser(user.uid, { nombre: this.editForm.value.nombre });

      if (user.role === 'entrenado') {
        const entrenadoData = this.entrenadoService.getEntrenado(user.uid)();
        if (entrenadoData) {
          const updatedEntrenado = {
            ...entrenadoData,
            objetivo: this.editForm.value.objetivo,
            nivel: this.editForm.value.nivel,
            configNotificaciones: {
              recordatoriosEntrenamiento: this.editForm.value.recordatoriosEntrenamiento,
              horaRecordatorio: this.editForm.value.horaRecordatorio,
              diasRecordatorio: this.editForm.value.diasRecordatorio
            }
          };
          await this.entrenadoService.save(updatedEntrenado);
          if (this.platform.is('capacitor')) {
            await this.notificacionService.programarRecordatoriosEntrenamiento(updatedEntrenado.configNotificaciones);
          }
        }
      }

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
    return nombre.split(' ').map(n => n.charAt(0).toUpperCase()).join('').substring(0, 2);
  }
}
