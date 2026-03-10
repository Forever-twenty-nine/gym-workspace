import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Platform, LoadingController, ToastController } from '@ionic/angular/standalone';
import {
  IonButton, IonIcon, IonChip, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonToggle, IonDatetime, IonDatetimeButton, IonModal, IonHeader, IonToolbar,
  IonTitle, IonContent, IonButtons, IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, notificationsOutline, logOutOutline } from 'ionicons/icons';

import { User as LibraryUser, Objetivo } from 'gym-library';
export interface User extends LibraryUser {
  photoURL?: string;
}

import { UserService } from '../../../../../../../core/services/user.service';
import { EntrenadoService } from '../../../../../../../core/services/entrenado.service';
import { NotificacionService } from '../../../../../../../core/services/notificacion.service';

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonButton, IonIcon, IonChip, IonLabel, IonInput, IonSelect, IonSelectOption,
    IonToggle, IonDatetime, IonDatetimeButton, IonModal, IonHeader, IonToolbar,
    IonTitle, IonContent, IonButtons, IonFooter
  ],
})
export class EditProfileModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() user: User | null = null;
  @Input() entrenadoData: any = null;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() logoutClicked = new EventEmitter<void>();

  private userService = inject(UserService);
  private entrenadoService = inject(EntrenadoService);
  private notificacionService = inject(NotificacionService);
  private fb = inject(FormBuilder);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private platform = inject(Platform);

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
    addIcons({ personOutline, notificationsOutline, logOutOutline });
  }

  logout() {
    this.logoutClicked.emit();
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

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color, position: 'bottom' });
    toast.present();
  }

  close() {
    this.modalClosed.emit();
  }
}
