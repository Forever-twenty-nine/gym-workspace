import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Platform, LoadingController, ToastController } from '@ionic/angular/standalone';
import {
  IonButton, IonChip, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonToggle, IonDatetime, IonDatetimeButton, IonModal, IonHeader, IonToolbar,
  IonTitle, IonContent, IonButtons, IonSpinner, IonList, IonListHeader, IonItem,
  IonAvatar, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, notificationsOutline, cameraOutline } from 'ionicons/icons';

import { User as LibraryUser, Objetivo } from 'gym-library';
export interface User extends LibraryUser {
  photoURL?: string;
}

import { UserService } from '../../../../../../../core/services/user.service';
import { EntrenadoService } from '../../../../../../../core/services/entrenado.service';
import { NotificacionService } from '../../../../../../../core/services/notificacion.service';
import { FirebaseStorageService } from '../../../../../../../core/services/firebase-storage.service';

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, NgOptimizedImage,
    IonButton, IonChip, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonToggle, IonDatetime, IonDatetimeButton, IonModal, IonHeader, IonToolbar,
    IonTitle, IonContent, IonButtons, IonSpinner, IonList, IonListHeader, IonItem,
  ],
})
export class EditProfileModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() user: User | null = null;
  @Input() entrenadoData: any = null;
  @Output() modalClosed = new EventEmitter<void>();

  private userService = inject(UserService);
  private entrenadoService = inject(EntrenadoService);
  private notificacionService = inject(NotificacionService);
  private fb = inject(FormBuilder);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private platform = inject(Platform);
  private storageService = inject(FirebaseStorageService);

  isUploading = signal<boolean>(false);

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

  constructor() {
    addIcons({ personOutline, notificationsOutline, cameraOutline });
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
    this.editForm = this.fb.group({
      nombre: [this.user?.nombre || '', [Validators.required, Validators.minLength(3)]],
      email: [{ value: this.user?.email || '', disabled: true }],
      plan: [{ value: this.user?.plan || '', disabled: true }],
      objetivo: [this.entrenadoData?.objetivo || ''],
      nivel: [this.entrenadoData?.nivel || ''],
      recordatoriosEntrenamiento: [this.entrenadoData?.configNotificaciones?.recordatoriosEntrenamiento || false],
      horaRecordatorio: [this.entrenadoData?.configNotificaciones?.horaRecordatorio || '08:00'],
      diasRecordatorio: [this.entrenadoData?.configNotificaciones?.diasRecordatorio || []]
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

    const loading = await this.loadingCtrl.create({ message: 'Guardando cambios...', spinner: 'crescent' });
    await loading.present();

    try {
      if (!this.user) return;

      await this.userService.updateUser(this.user.uid, { nombre: this.editForm.value.nombre });

      if (this.user.role === 'entrenado') {
        if (this.entrenadoData) {
          const updatedEntrenado = {
            ...this.entrenadoData,
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
      this.close();
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

    if (!this.user) return;

    const loading = await this.loadingCtrl.create({ message: 'Subiendo foto...', spinner: 'crescent' });
    await loading.present();
    this.isUploading.set(true);

    try {
      const path = this.storageService.getProfilePath(this.user.uid, file.name.split('.').pop());
      const photoURL = await this.storageService.uploadFile(path, file);
      await this.userService.updateUser(this.user.uid, { photoURL });

      // Update local user object to reflect change in UI
      if (this.user) {
        this.user = { ...this.user, photoURL };
      }

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
