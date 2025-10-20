import { Component, OnInit, inject, computed, Signal, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonAvatar,
  IonPopover,
  IonInput,
  IonTextarea,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, close, person, trophy, checkmarkCircle, calendar, business, mailOutline, fitnessOutline, addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import { AuthService, EntrenadoService, UserService, NotificacionService, Entrenado, RutinaService, Rutina, Rol, InvitacionService, TipoNotificacion } from 'gym-library';

@Component({
  selector: 'app-entrenados',
  templateUrl: './entrenados.page.html',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonAvatar,
    IonPopover,
    IonModal,
    IonInput,
    IonTextarea
  ],
  styles: [`
    .entrenado-detail {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .avatar-section {
      text-align: center;
    }

    .large-avatar {
      width: 80px;
      height: 80px;
      margin: 0 auto 10px;
    }

    .entrenado-name {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--ion-color-primary);
      margin: 0;
    }

    .detail-list {
      width: 100%;
      background: transparent;
    }

    .detail-list ion-item {
      --border-radius: 12px;
      --padding-start: 16px;
      --padding-end: 16px;
      --padding-top: 12px;
      --padding-bottom: 12px;
      margin-bottom: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .detail-list ion-icon {
      font-size: 24px;
    }

    .entrenado-popover {
      --width: 100%;
      --max-width: 400px;
      --border-radius: 16px;
      --backdrop-opacity: 0.3;
    }
  `]
})
export class EntrenadosPage implements OnInit {
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private userService = inject(UserService);
  private notificacionService = inject(NotificacionService);
  private rutinaService = inject(RutinaService);
  private invitacionService = inject(InvitacionService);
  private toastController = inject(ToastController);
  private fb = inject(FormBuilder);

  isModalOpen = signal(false);
  selectedEntrenado = signal<Entrenado | null>(null);

  // Señales para invitación
  isInvitacionModalOpen = signal(false);
  isLoading = signal(false);
  invitacionForm = signal<FormGroup>(
    this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mensaje: ['']
    })
  );

  // Señales para gestión de rutinas
  isRutinasModalOpen = signal(false);
  rutinasEntrenado = signal<Rutina[]>([]);
  rutinasDisponibles = signal<Rutina[]>([]);

  entrenadosAsociados: Signal<Entrenado[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadoService.entrenados().filter(e => e.entrenadoresId?.includes(entrenadorId)) : [];
  });

  constructor() {
    addIcons({ peopleOutline, close, person, trophy, checkmarkCircle, calendar, business, mailOutline, fitnessOutline, addCircleOutline, removeCircleOutline });
  }

  ngOnInit() {
    // Inicializar si es necesario
  }

  verCliente(entrenado: Entrenado) {
    this.selectedEntrenado.set(entrenado);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedEntrenado.set(null);
  }

  getRutinasAsignadasCount(entrenadoId: string): number {
    const entrenado = this.entrenadoService.entrenados().find(e => e.id === entrenadoId);
    return entrenado?.rutinasAsignadas?.length || 0;
  }

  getUserName(userId: string): string {
    const users = this.userService.users();
    const user = users.find(u => u.uid === userId);
    return user ? user.nombre || 'Sin nombre' : 'Usuario no encontrado';
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
        message: 'Por favor, completa todos los campos obligatorios',
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
    const entrenadorId = this.authService.currentUser()?.uid;

    if (!entrenadorId) {
      const toast = await this.toastController.create({
        message: 'Error: No se pudo identificar al entrenador',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      this.isLoading.set(false);
      return;
    }

    // Buscar el usuario por email
    const usuarioInvitado = this.userService.users().find(u => u.email === data.email);
    const usuarioId = usuarioInvitado?.uid;

    if (!usuarioId || !usuarioInvitado?.email) {
      const toast = await this.toastController.create({
        message: 'Error: No se encontró un usuario con ese email',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      this.isLoading.set(false);
      return;
    }

    // Obtener el nombre del entrenador actual
    const entrenadorActual = this.userService.users().find(u => u.uid === entrenadorId);
    const entrenadorNombre = entrenadorActual?.nombre || entrenadorActual?.email || 'Entrenador';

    // Obtener el nombre y email del entrenado
    const entrenadoNombre = usuarioInvitado.nombre || usuarioInvitado.email || 'Entrenado';
    const emailEntrenado = usuarioInvitado.email;

    try {
      await this.invitacionService.crearInvitacion(
        entrenadorId,
        usuarioId,
        entrenadorNombre,
        entrenadoNombre,
        emailEntrenado,
        data.mensaje
      );

      // Notificación de éxito
      const successToast = await this.toastController.create({
        message: 'Invitación enviada exitosamente',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
      await successToast.present();

      this.invitacionForm().reset();
      this.closeInvitacionModal();
    } catch (error) {
      console.error('❌ Error al enviar invitación:', error);
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

  // Métodos para gestión de rutinas
  openRutinasModal(entrenado: Entrenado) {
    this.selectedEntrenado.set(entrenado);
    this.cargarRutinasEntrenado(entrenado.id);
    this.cargarRutinasDisponibles();
    this.isRutinasModalOpen.set(true);
  }

  closeRutinasModal() {
    this.isRutinasModalOpen.set(false);
    this.selectedEntrenado.set(null);
    this.rutinasEntrenado.set([]);
    this.rutinasDisponibles.set([]);
  }

  private cargarRutinasEntrenado(entrenadoId: string) {
    const entrenado = this.entrenadoService.entrenados().find(e => e.id === entrenadoId);
    const rutinaIds = entrenado?.rutinasAsignadas || [];
    const rutinas = this.rutinaService.rutinas().filter(r => rutinaIds.includes(r.id));
    this.rutinasEntrenado.set(rutinas);
  }

  private cargarRutinasDisponibles() {
    const entrenadorId = this.authService.currentUser()?.uid;
    const entrenadoId = this.selectedEntrenado()?.id;
    if (!entrenadorId || !entrenadoId) return;

    const rutinas = this.rutinaService.rutinas();
    const entrenado = this.entrenadoService.entrenados().find(e => e.id === entrenadoId);
    const rutinasAsignadas = entrenado?.rutinasAsignadas || [];
    const rutinasEntrenador = rutinas.filter(rutina => 
      !rutinasAsignadas.includes(rutina.id)
    );
    this.rutinasDisponibles.set(rutinasEntrenador);
  }

  async asignarRutina(rutina: Rutina) {
    if (!this.selectedEntrenado()) return;

    const entrenado = this.selectedEntrenado()!;
    const rutinasAsignadas = entrenado.rutinasAsignadas || [];

    // Si ya está asignada, no hacer nada
    if (rutinasAsignadas.includes(rutina.id)) {
      return;
    }

    const entrenadoActualizado: Entrenado = {
      ...entrenado,
      rutinasAsignadas: [...rutinasAsignadas, rutina.id]
    };

    try {
      await this.entrenadoService.save(entrenadoActualizado);

      // Esperar un momento para que el listener se actualice
      await new Promise(resolve => setTimeout(resolve, 500));

      this.cargarRutinasEntrenado(entrenado.id);
      this.cargarRutinasDisponibles();
      
    } catch (error) {
      console.error('Error al asignar rutina:', error);
    }
  }

  async desasignarRutina(rutina: Rutina) {
    if (!this.selectedEntrenado()) return;

    const entrenado = this.selectedEntrenado()!;
    const rutinasAsignadas = entrenado.rutinasAsignadas || [];
    const nuevosAsignados = rutinasAsignadas.filter(id => id !== rutina.id);

    const entrenadoActualizado: Entrenado = {
      ...entrenado,
      rutinasAsignadas: nuevosAsignados.length > 0 ? nuevosAsignados : undefined
    };

    try {
      await this.entrenadoService.save(entrenadoActualizado);

      // Esperar un momento para que el listener se actualice
      await new Promise(resolve => setTimeout(resolve, 500));

      this.cargarRutinasEntrenado(entrenado.id);
      this.cargarRutinasDisponibles();
      
    } catch (error) {
      console.error('Error al desasignar rutina:', error);
    }
  }
}