import { Component, inject, computed, signal, OnInit, Signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { EntrenadoService } from '../../core/services/entrenado.service';
import { InvitacionService } from '../../core/services/invitacion.service';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';
import { InvitacionModalComponent } from '../../entrenador/entrenados/components/invitacion-modal/invitacion-modal.component';

@Component({
  selector: 'app-gimnasio-users',
  templateUrl: 'gimnasio-users.page.html',
  styleUrls: ['gimnasio-users.page.css'],
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
export class GimnasioUsersPage implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private gimnasioService = inject(GimnasioService);
  private entrenadorService = inject(EntrenadorService);
  private entrenadoService = inject(EntrenadoService);
  private invitacionService = inject(InvitacionService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private fb = inject(FormBuilder);

  readonly isPremium = computed(() => this.authService.currentUser()?.plan === 'premium');
  
  roleFilter = signal<string>('entrenado');
  searchQuery = signal<string>('');

  // Datos mock originales como fallback
  private mockUsers = [
    { uid: 'mock_1', nombre: 'Clara Intermedio', email: 'clara.intermedio@gym.test', role: 'entrenado', onboarded: true, trainerName: 'Juan Free' },
    { uid: 'mock_2', nombre: 'Lucas Principiante', email: 'lucas.principiante@gym.test', role: 'entrenado', onboarded: true, trainerName: 'María Free' },
    { uid: 'mock_3', nombre: 'Mateo Avanzado', email: 'mateo.avanzado@gym.test', role: 'entrenado', onboarded: true, trainerName: 'Carlos Premium' },
    { uid: 'mock_4', nombre: 'Pedro Intermedio', email: 'pedro.intermedio@gym.test', role: 'entrenado', onboarded: true, trainerName: 'Juan Free' },
    { uid: 'mock_5', nombre: 'Sofia Principiante', email: 'sofia.principiante@gym.test', role: 'entrenado', onboarded: true, trainerName: 'María Free' },
    { uid: 'mock_6', nombre: 'Tomas Avanzado', email: 'tomas.avanzado@gym.test', role: 'entrenado', onboarded: true, trainerName: 'Ana Premium' },
    { uid: 'mock_7', nombre: 'Carlos López', email: 'carlos@email.com', role: 'entrenador', onboarded: true },
    { uid: 'mock_8', nombre: 'Luis Rodríguez', email: 'luis@email.com', role: 'entrenador', onboarded: true },
  ];

  // Listado de usuarios reactivo desde Firestore con Fallback Mock
  readonly filteredUsers = computed(() => {
    const filter = this.roleFilter();
    const gymId = this.authService.currentUser()?.uid;
    const search = this.searchQuery().toLowerCase().trim();
    if (!gymId) return [];

    // 1. Intentar obtener de Firestore
    let list = this.userService.users().filter(u => u.gimnasioId === gymId && u.role === filter);

    // 2. Si está vacío, usar el mock como fallback para pruebas
    if (list.length === 0) {
      list = this.mockUsers.filter(u => u.role === filter) as any[];
    }

    // 3. Aplicar filtro de búsqueda
    if (search) {
      list = list.filter(u => 
        (u.nombre?.toLowerCase().includes(search) || false) || 
        (u.email?.toLowerCase().includes(search) || false)
      );
    }

    return list;
  });

  /**
   * Obtiene el nombre del entrenador o entrenadores asociados a un entrenado
   */
  getTraineeTrainerName(user: any): string {
    if (user.uid.startsWith('mock_')) {
      return user.trainerName || 'Sin entrenador';
    }
    
    // 1. Encontrar el perfil Entrenado
    const entrenado = this.entrenadoService.entrenados().find(e => e.id === user.uid);
    if (!entrenado || !entrenado.entrenadoresId || entrenado.entrenadoresId.length === 0) {
      return 'Sin entrenador';
    }

    // 2. Obtener nombres de sus entrenadores de UserService
    const trainerNames = entrenado.entrenadoresId.map(trainerId => {
      const trainerUser = this.userService.users().find(u => u.uid === trainerId);
      return trainerUser?.nombre || trainerUser?.email || 'Entrenador';
    });

    return trainerNames.join(', ');
  }

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
    this.route.data.subscribe(data => {
      if (data && data['roleFilter']) {
        this.roleFilter.set(data['roleFilter']);
      }
    });

    // Asegurar que los listeners de Firestore estén activos
    this.userService.users(); 
    this.invitacionService.invitaciones;
    this.gimnasioService.gimnasios;
    this.entrenadorService.entrenadores;
    this.entrenadoService.entrenados();
  }

  constructor() {
    addIcons({ personOutline, createOutline, trashOutline, mailOutline, closeCircleOutline, personRemove });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'gimnasio':
        return 'bg-danger/20 text-(--ion-color-danger)';
      case 'entrenado':
        return 'bg-success/20 text-(--ion-color-success)';
      case 'entrenador':
        return 'bg-warning/20 text-(--ion-color-warning)';
      default:
        return 'bg-medium/20 text-(--ion-color-medium)';
    }
  }

  getRoleDisplayName(role: string): string {
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
    
    // Validar que no se invite a sí mismo
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

    // Buscar el usuario por email
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

    // Validar rol de entrenador
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

    // Validar si ya está asociado al gimnasio
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

    // Validar si ya hay una invitación pendiente activa
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

    // Obtener nombres para la invitación
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

  editarUsuario(user: any) {
    // Para edición si se desea expandir en el futuro
  }

  async eliminarUsuario(user: any) {
    const gymId = this.authService.currentUser()?.uid;
    if (!gymId) return;

    // No desvincular usuarios mock del fallback
    if (user.uid.startsWith('mock_')) {
      const toast = await this.toastController.create({
        message: 'No se puede desvincular a un usuario de demostración',
        duration: 2000,
        color: 'warning',
        position: 'top'
      });
      await toast.present();
      return;
    }

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
              if (user.role === 'entrenador') {
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
              } else if (user.role === 'entrenado') {
                // 1. Actualizar usuario
                await this.userService.updateUser(user.uid, { gimnasioId: null } as any);

                // 2. Actualizar perfil Entrenado
                const entrenado = this.entrenadoService.getEntrenadoById(user.uid)();
                if (entrenado) {
                  await this.entrenadoService.save({ ...entrenado, gimnasioId: null } as any);
                }

                // 3. Actualizar perfil Gimnasio
                const gym = this.gimnasioService.getGimnasioById(gymId)();
                if (gym) {
                  const entrenadosIds = (gym.entrenadosIds || []).filter(id => id !== user.uid);
                  await this.gimnasioService.save({ ...gym, entrenadosIds });
                }
              }

              const toast = await this.toastController.create({
                message: 'Usuario desvinculado correctamente',
                duration: 3000,
                color: 'success',
                position: 'top'
              });
              await toast.present();
            } catch (error) {
              console.error('❌ Error al desvincular:', error);
              const toast = await this.toastController.create({
                message: 'Error al desvincular el usuario',
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

  editUser(user: any) {
    this.editarUsuario(user);
  }

  deleteUser(user: any) {
    this.eliminarUsuario(user);
  }
}

