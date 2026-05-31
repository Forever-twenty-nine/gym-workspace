import { Component, inject, computed, signal, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { 
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonButton,
  IonIcon,
  IonSearchbar,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { NgOptimizedImage } from '@angular/common';
import { addIcons } from 'ionicons';
import { personOutline, createOutline, trashOutline, mailOutline, closeCircleOutline, personRemove } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { GimnasioService } from '../../core/services/gimnasio.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { InvitacionService } from '../../core/services/invitacion.service';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';
import { InvitacionModalComponent } from '../../entrenador/entrenados/components/invitacion-modal/invitacion-modal.component';

@Component({
  selector: 'app-gimnasio-entrenadores',
  templateUrl: 'gimnasio-entrenadores.page.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonButton,
    IonIcon,
    IonSearchbar,
    NgOptimizedImage,
    HeaderTabsComponent,
    InvitacionModalComponent
  ],
})
export class GimnasioEntrenadoresPage implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private gimnasioService = inject(GimnasioService);
  private entrenadorService = inject(EntrenadorService);
  private invitacionService = inject(InvitacionService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private fb = inject(FormBuilder);

  readonly isPremium = computed(() => this.authService.currentUser()?.plan === 'premium');
  
  searchQuery = signal<string>('');

  // Listado de entrenadores reactivo desde Firestore
  readonly filteredUsers = computed(() => {
    const gymId = this.authService.currentUser()?.uid;
    const search = this.searchQuery().toLowerCase().trim();
    if (!gymId) return [];

    let list = this.userService.users().filter(u => u.gimnasioId === gymId && u.role === 'entrenador');

    if (search) {
      list = list.filter(u => 
        (u.nombre?.toLowerCase().includes(search) || false) || 
        (u.email?.toLowerCase().includes(search) || false)
      );
    }
    return list;
  });

  // Invitaciones pendientes enviadas por este gimnasio a entrenadores
  readonly invitacionesPendientes: Signal<any[]> = computed(() => {
    const gymId = this.authService.currentUser()?.uid;
    if (!gymId) return [];
    return this.invitacionService.invitaciones().filter(inv => 
      inv.remitenteId === gymId && 
      inv.tipo === 'gimnasio_a_entrenador' && 
      inv.estado === 'pendiente' &&
      inv.activa
    );
  });

  // Formulario e interfaz de invitación
  isInvitacionModalOpen = signal(false);
  isLoading = signal(false);
  invitacionForm = signal<FormGroup>(
    this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mensaje: ['']
    })
  );

  private readonly invitacionStatus = toSignal(this.invitacionForm().statusChanges, {
    initialValue: this.invitacionForm().status
  });

  readonly isInvitacionSaveDisabled = computed(() => {
    return this.invitacionStatus() === 'INVALID' || this.isLoading();
  });

  ngOnInit() {
    this.userService.users(); 
    this.invitacionService.invitaciones;
    this.gimnasioService.gimnasios;
    this.entrenadorService.entrenadores;
  }

  constructor() {
    addIcons({ personOutline, createOutline, trashOutline, mailOutline, closeCircleOutline, personRemove });
  }

  openInvitacionModal() {
    this.isInvitacionModalOpen.set(true);
  }

  closeInvitacionModal() {
    this.isInvitacionModalOpen.set(false);
    this.invitacionForm().reset();
  }

  async saveInvitacion() {
    if (this.invitacionForm().invalid) {
      const toast = await this.toastController.create({
        message: 'Por favor, introduce un correo electrónico válido',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      this.invitacionForm().markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const data = this.invitacionForm().value;
    const gymId = this.authService.currentUser()?.uid;

    if (!gymId) {
      const toast = await this.toastController.create({
        message: 'Error: No se pudo identificar la cuenta de gimnasio activa',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      this.isLoading.set(false);
      return;
    }

    const emailToSearch = data.email?.trim();
    
    if (emailToSearch.toLowerCase() === this.authService.currentUser()?.email?.toLowerCase()) {
      const toast = await this.toastController.create({
        message: 'No puedes enviarte una invitación a ti mismo',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      this.isLoading.set(false);
      return;
    }

    const usuarioInvitado = await this.userService.getUserByEmailAsync(emailToSearch);
    const usuarioId = usuarioInvitado?.uid;

    if (!usuarioId || !usuarioInvitado?.email) {
      const toast = await this.toastController.create({
        message: `Error: No se encontró un usuario con el email ${emailToSearch}`,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      this.isLoading.set(false);
      return;
    }

    if (usuarioInvitado.role !== 'entrenador') {
      const toast = await this.toastController.create({
        message: 'Error: El usuario con ese email no es un entrenador registrado',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      this.isLoading.set(false);
      return;
    }

    if (usuarioInvitado.gimnasioId === gymId) {
      const toast = await this.toastController.create({
        message: 'El entrenador ya se encuentra vinculado a tu gimnasio',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      this.isLoading.set(false);
      return;
    }

    const yaInvitado = this.invitacionesPendientes().some(inv => inv.emailDestinatario?.toLowerCase() === emailToSearch.toLowerCase());
    if (yaInvitado) {
      const toast = await this.toastController.create({
        message: 'Ya has enviado una invitación pendiente a este entrenador',
        duration: 3000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      this.isLoading.set(false);
      return;
    }

    const gymActual = this.userService.users().find(u => u.uid === gymId);
    const gymNombre = gymActual?.nombre || gymActual?.email || 'Gimnasio';
    const entrenadorNombre = usuarioInvitado.nombre || usuarioInvitado.email || 'Entrenador';
    const emailEntrenador = usuarioInvitado.email;

    try {
      await this.invitacionService.crearInvitacion(
        gymId,
        usuarioId,
        gymNombre,
        entrenadorNombre,
        emailEntrenador,
        data.mensaje,
        'gimnasio_a_entrenador'
      );

      const successToast = await this.toastController.create({
        message: 'Invitación al entrenador enviada con éxito',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await successToast.present();

      this.invitacionForm().reset();
      this.closeInvitacionModal();
    } catch (error) {
      console.error('❌ Error al invitar entrenador:', error);
      const errorToast = await this.toastController.create({
        message: 'Error al enviar la invitación. Inténtalo de nuevo.',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await errorToast.present();
    } finally {
      this.isLoading.set(false);
    }
  }

  async cancelarInvitacion(invitacionId: string) {
    try {
      await this.invitacionService.delete(invitacionId);
      const toast = await this.toastController.create({
        message: 'Invitación cancelada correctamente',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error) {
      console.error('❌ Error al cancelar invitación:', error);
      const toast = await this.toastController.create({
        message: 'Error al cancelar la invitación',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    }
  }

  async desvincularEntrenador(user: any) {
    const gymId = this.authService.currentUser()?.uid;
    if (!gymId) return;

    const alert = await this.alertController.create({
      header: 'Confirmar desvinculación',
      message: `¿Estás seguro de que deseas desvincular a ${user.nombre || user.email} de tu gimnasio?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desvincular',
          role: 'destructive',
          handler: async () => {
            try {
              // 1. Actualizar usuario
              await this.userService.updateUser(user.uid, { gimnasioId: null } as any);
              
              // 2. Actualizar perfil Entrenador
              await this.entrenadorService.update(user.uid, { gimnasioId: null } as any);

              // 3. Actualizar perfil Gimnasio
              const gym = this.gimnasioService.getGimnasioById(gymId)();
              if (gym) {
                const entrenadoresIds = (gym.entrenadoresIds || []).filter(id => id !== user.uid);
                await this.gimnasioService.save({ ...gym, entrenadoresIds });
              }

              const toast = await this.toastController.create({
                message: 'Entrenador desvinculado correctamente',
                duration: 3000,
                color: 'success',
                position: 'top'
              });
              await toast.present();
            } catch (error) {
              console.error('❌ Error al desvincular:', error);
              const toast = await this.toastController.create({
                message: 'Error al desvincular el entrenador',
                duration: 3000,
                color: 'danger',
                position: 'top'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
