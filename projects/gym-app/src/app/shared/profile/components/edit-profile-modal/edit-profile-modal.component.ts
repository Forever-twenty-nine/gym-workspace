import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Platform, LoadingController, ToastController } from '@ionic/angular/standalone';
import {
  IonButton, IonChip, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonToggle, IonDatetime, IonDatetimeButton, IonModal, IonHeader, IonToolbar,
  IonTitle, IonContent, IonButtons, IonSpinner, IonList, IonListHeader, IonItem,
  IonAvatar, IonNote, IonTextarea, IonIcon, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, notificationsOutline, cameraOutline, cardOutline, locationOutline } from 'ionicons/icons';

import { User as LibraryUser, Objetivo, Entrenador, Gimnasio } from 'gym-library';
export interface User extends LibraryUser {
  photoURL?: string;
}

import { UserService } from '../../../../core/services/user.service';
import { EntrenadoService } from '../../../../core/services/entrenado.service';
import { EntrenadorService } from '../../../../core/services/entrenador.service';
import { GimnasioService } from '../../../../core/services/gimnasio.service';
import { NotificacionService } from '../../../../core/services/notificacion.service';
import { FirebaseStorageService } from '../../../../core/services/firebase-storage.service';

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, NgOptimizedImage,
    IonButton, IonChip, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonToggle, IonDatetime, IonDatetimeButton, IonModal, IonHeader, IonToolbar,
    IonTitle, IonContent, IonButtons, IonSpinner, IonList, IonListHeader, IonItem,
    IonAvatar, IonTextarea, IonIcon, IonGrid, IonRow, IonCol
  ],
})
export class EditProfileModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() user: User | null = null;
  @Input() entrenadoData: any = null;
  @Input() entrenadorData: Entrenador | null = null;
  @Input() gimnasioData: Gimnasio | null = null;
  @Output() modalClosed = new EventEmitter<void>();

  private userService = inject(UserService);
  private entrenadoService = inject(EntrenadoService);
  private entrenadorService = inject(EntrenadorService);
  private gimnasioService = inject(GimnasioService);
  private notificacionService = inject(NotificacionService);
  private fb = inject(FormBuilder);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private platform = inject(Platform);
  private storageService = inject(FirebaseStorageService);

  isUploading = signal<boolean>(false);

  editForm!: FormGroup;
  objetivoOptions = Object.values(Objetivo);
  diasSemana = [
    { n: 1, label: 'Lun' },
    { n: 2, label: 'Mar' },
    { n: 3, label: 'Mié' },
    { n: 4, label: 'Jue' },
    { n: 5, label: 'Vie' },
    { n: 6, label: 'Sáb' },
    { n: 0, label: 'Dom' }
  ];

  constructor() {
    addIcons({ personOutline, notificationsOutline, cameraOutline, cardOutline, locationOutline });
  }

  ngOnInit() {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
      this.initForm();
    }
  }

  private initForm() {
    const role = this.user?.role;

    this.editForm = this.fb.group({
      nombre: [this.user?.nombre || '', [Validators.required, Validators.minLength(3)]],
      email: [{ value: this.user?.email || '', disabled: true }],
      plan: [{ value: this.user?.plan || '', disabled: true }],

      // Entrenado
      objetivo: [this.entrenadoData?.objetivo || ''],
      recordatoriosEntrenamiento: [this.entrenadoData?.configNotificaciones?.recordatoriosEntrenamiento || false],
      horaRecordatorio: [this.entrenadoData?.configNotificaciones?.horaRecordatorio || '08:00'],
      diasRecordatorio: [this.entrenadoData?.configNotificaciones?.diasRecordatorio || []],
      visibleDescubrir: [this.entrenadoData?.visibleDescubrir ?? true],
      bio: [this.entrenadoData?.bio || ''],
      franjaInicio: [this.entrenadoData?.franjaHoraria?.inicio || '18:00'],
      franjaFin: [this.entrenadoData?.franjaHoraria?.fin || '20:00'],

      // Entrenador / Personal Trainer
      descripcion: [this.entrenadorData?.descripcion || ''],

      // Gimnasio
      direccion: [this.gimnasioData?.direccion || ''],
      isPersonalTrainer: [this.gimnasioData?.isPersonalTrainer ?? false],
      cobraMensualidad: [this.gimnasioData?.cobraMensualidad ?? false],
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
  }

  async saveProfile() {
    if (this.editForm.invalid) return;
    if (!this.user) return;

    const loading = await this.loadingCtrl.create({ message: 'Guardando cambios...', spinner: 'crescent' });
    await loading.present();

    try {
      const v = this.editForm.value;
      const role = this.user.role;

      // 1) Nombre siempre va al User
      await this.userService.updateUser(this.user.uid, { nombre: v.nombre });

      // 2) Datos según rol
      if (role === 'entrenado') {
        await this.saveEntrenado(v);
      } else if (role === 'entrenador' || role === 'personal_trainer') {
        await this.saveEntrenador(v);
      } else if (role === 'gimnasio') {
        await this.saveGimnasio(v);
      }

      this.showToast('Perfil actualizado correctamente', 'success');
      this.close();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      this.showToast('Error al actualizar el perfil', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  private async saveEntrenado(v: any) {
    if (!this.entrenadoData) return;
    const updatedEntrenado = {
      ...this.entrenadoData,
      objetivo: v.objetivo,
      visibleDescubrir: v.visibleDescubrir,
      bio: v.bio,
      franjaHoraria: (v.franjaInicio && v.franjaFin) ? {
        inicio: v.franjaInicio,
        fin: v.franjaFin
      } : null,
      configNotificaciones: {
        recordatoriosEntrenamiento: v.recordatoriosEntrenamiento,
        horaRecordatorio: v.horaRecordatorio,
        diasRecordatorio: v.diasRecordatorio
      }
    };
    await this.entrenadoService.save(updatedEntrenado);
    if (this.platform.is('capacitor')) {
      await this.notificacionService.programarRecordatoriosEntrenamiento(updatedEntrenado.configNotificaciones);
    }
  }

  private async saveEntrenador(v: any) {
    if (!this.user || !this.entrenadorData) {
      // Si el user es entrenador pero no existe el doc, creamos uno mínimo
      if (this.user && !this.entrenadorData) {
        const nuevoEntrenador: Entrenador = {
          id: this.user.uid,
          descripcion: v.descripcion || '',
          gimnasioId: [],
          entrenadosIds: [],
          ejerciciosCreadasIds: [],
          entrenadosAsignadosIds: [],
          rutinasCreadasIds: []
        };
        await this.entrenadorService.create(nuevoEntrenador);
      }
      return;
    }

    await this.entrenadorService.update(this.entrenadorData.id, {
      descripcion: v.descripcion
    });
  }

  private async saveGimnasio(v: any) {
    if (!this.user) return;

    const gimnasioData: Gimnasio = {
      id: this.user.uid,
      direccion: v.direccion || '',
      isPersonalTrainer: v.isPersonalTrainer,
      cobraMensualidad: v.cobraMensualidad,
      ...(this.gimnasioData?.entrenadoresIds ? { entrenadoresIds: this.gimnasioData.entrenadoresIds } : {}),
      ...(this.gimnasioData?.entrenadosIds ? { entrenadosIds: this.gimnasioData.entrenadosIds } : {})
    };

    await this.gimnasioService.save(gimnasioData);
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Por favor selecciona una imagen válida', 'warning');
      return;
    }

    if (!this.user) return;

    const loading = await this.loadingCtrl.create({ message: 'Subiendo foto...', spinner: 'crescent' });
    await loading.present();
    this.isUploading.set(true);

    try {
      const path = this.storageService.getProfilePath(this.user.uid, file.name.split('.').pop());
      const photoURL = await this.storageService.uploadFile(path, file);
      await this.userService.updateUser(this.user.uid, { photoURL });

      if (this.user) {
        this.user = { ...this.user, photoURL };
      }

      this.showToast('Foto de perfil actualizada', 'success');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      this.showToast('Error al subir la foto', 'danger');
    } finally {
      this.isUploading.set(false);
      loading.dismiss();
    }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('modal-photo-input') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    toast.present();
  }

  close() {
    this.modalClosed.emit();
  }

  getIniciales(nombre?: string): string {
    if (!nombre) return 'U';
    return nombre.split(' ').map((n: string) => n.charAt(0).toUpperCase()).join('').substring(0, 2);
  }
}
