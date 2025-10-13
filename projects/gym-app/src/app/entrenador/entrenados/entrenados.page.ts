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
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, close, person, trophy, checkmarkCircle, calendar, business, mailOutline, fitnessOutline, addCircleOutline, removeCircleOutline } from 'ionicons/icons';
import { AuthService, EntrenadoService, UserService, NotificacionService, Entrenado, RutinaService, Rutina, Rol } from 'gym-library';

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
    IonTextarea,
    IonSelect,
    IonSelectOption
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
  private fb = inject(FormBuilder);

  isModalOpen = signal(false);
  selectedEntrenado = signal<Entrenado | null>(null);

  // Señales para invitación
  isInvitacionModalOpen = signal(false);
  isLoading = signal(false);
  invitacionForm = signal<FormGroup>(
    this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mensaje: [''],
      franjaHoraria: ['mañana']
    })
  );

  // Señales para gestión de rutinas
  isRutinasModalOpen = signal(false);
  rutinasEntrenado = signal<Rutina[]>([]);
  rutinasDisponibles = signal<Rutina[]>([]);

  entrenadosAsociados: Signal<Entrenado[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadoService.entrenados().filter(e => e.entrenadorId === entrenadorId) : [];
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
    const rutinas = this.rutinaService.rutinas();
    return rutinas.filter(rutina => 
      (rutina.asignadoIds && rutina.asignadoIds.includes(entrenadoId)) ||
      (rutina.asignadoId === entrenadoId) || // Compatibilidad con datos antiguos
      rutina.entrenadoId === entrenadoId
    ).length;
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
      return;
    }

    this.isLoading.set(true);
    const data = this.invitacionForm().value;
    const entrenadorId = this.authService.currentUser()?.uid;

    if (!entrenadorId) {
      this.isLoading.set(false);
      return;
    }

    console.log('📨 Enviando invitación:', data);

    // Buscar el usuario por email
    const usuarioInvitado = this.userService.users().find(u => u.email === data.email);
    const usuarioId = usuarioInvitado?.uid;

    if (!usuarioId) {
      console.error('❌ No se encontró un usuario con ese email');
      this.isLoading.set(false);
      return;
    }

    console.log('👤 Usuario invitado encontrado:', usuarioInvitado);

    // Obtener el nombre del entrenador actual
    const entrenadorActual = this.userService.users().find(u => u.uid === entrenadorId);
    const entrenadorNombre = entrenadorActual?.nombre || entrenadorActual?.email || 'Entrenador';

    console.log('🏋️ Entrenador:', entrenadorActual, 'Nombre:', entrenadorNombre);

    try {
      console.log('📝 Creando invitación...');
      await this.notificacionService.crearInvitacion(entrenadorId, usuarioId, data.mensaje, entrenadorNombre);
      console.log('✅ Invitación creada exitosamente');
      this.closeInvitacionModal();
    } catch (error) {
      console.error('❌ Error al enviar invitación:', error);
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
    const rutinas = this.rutinaService.rutinas();
    const rutinasEntrenado = rutinas.filter(rutina => 
      (rutina.asignadoIds && rutina.asignadoIds.includes(entrenadoId)) ||
      (rutina.asignadoId === entrenadoId) || // Compatibilidad con datos antiguos
      rutina.entrenadoId === entrenadoId
    );
    this.rutinasEntrenado.set(rutinasEntrenado);
  }

  private cargarRutinasDisponibles() {
    const entrenadorId = this.authService.currentUser()?.uid;
    const entrenadoId = this.selectedEntrenado()?.id;
    if (!entrenadorId || !entrenadoId) return;

    const rutinas = this.rutinaService.rutinas();
    const rutinasEntrenador = rutinas.filter(rutina => 
      rutina.creadorId === entrenadorId && 
      !(rutina.asignadoIds && rutina.asignadoIds.includes(entrenadoId)) &&
      rutina.asignadoId !== entrenadoId // Compatibilidad con datos antiguos
    );
    this.rutinasDisponibles.set(rutinasEntrenador);
  }

  async asignarRutina(rutina: Rutina) {
    if (!this.selectedEntrenado()) return;

    console.log('Asignando rutina:', rutina.nombre, 'a entrenado:', this.selectedEntrenado()!.id);

    try {
      // Si ya está asignada a este entrenado, no hacer nada
      const asignadoIds = rutina.asignadoIds || (rutina.asignadoId ? [rutina.asignadoId] : []);
      if (asignadoIds.includes(this.selectedEntrenado()!.id)) {
        console.log('La rutina ya está asignada a este entrenado');
        return;
      }

      const rutinaActualizada: Rutina = {
        ...rutina,
        asignadoIds: [...asignadoIds, this.selectedEntrenado()!.id],
        asignadoTipo: Rol.ENTRENADO,
        fechaAsignacion: new Date()
      };

      console.log('Rutina actualizada:', rutinaActualizada);
      await this.rutinaService.save(rutinaActualizada);
      console.log('Rutina guardada exitosamente');

      // Esperar un momento para que el listener se actualice
      await new Promise(resolve => setTimeout(resolve, 500));

      this.cargarRutinasEntrenado(this.selectedEntrenado()!.id);
      this.cargarRutinasDisponibles();
      
      console.log('Listas recargadas');
    } catch (error) {
      console.error('Error al asignar rutina:', error);
    }
  }

  async desasignarRutina(rutina: Rutina) {
    console.log('Desasignando rutina:', rutina.nombre);

    try {
      const asignadoIds = rutina.asignadoIds || (rutina.asignadoId ? [rutina.asignadoId] : []);
      const nuevosAsignados = asignadoIds.filter(id => id !== this.selectedEntrenado()!.id);

      const rutinaActualizada: Rutina = {
        ...rutina,
        asignadoIds: nuevosAsignados.length > 0 ? nuevosAsignados : undefined,
        // Si no quedan asignados, limpiar también asignadoTipo y fechaAsignacion
        ...(nuevosAsignados.length === 0 && {
          asignadoTipo: undefined,
          fechaAsignacion: undefined as any
        })
      };

      console.log('Rutina actualizada para desasignar:', rutinaActualizada);
      await this.rutinaService.save(rutinaActualizada);
      console.log('Rutina desasignada exitosamente');

      // Esperar un momento para que el listener se actualice
      await new Promise(resolve => setTimeout(resolve, 500));

      this.cargarRutinasEntrenado(this.selectedEntrenado()!.id);
      this.cargarRutinasDisponibles();
      
      console.log('Listas recargadas después de desasignar');
    } catch (error) {
      console.error('Error al desasignar rutina:', error);
    }
  }
}