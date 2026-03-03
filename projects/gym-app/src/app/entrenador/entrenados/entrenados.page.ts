import { Component, OnInit, inject, computed, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
  IonSelectOption,
  IonBadge,
  IonItemGroup,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, close, person, trophy, checkmarkCircle, calendar, business, mailOutline, fitnessOutline, addCircleOutline, removeCircleOutline, closeCircleOutline, flame, timeOutline, statsChartOutline } from 'ionicons/icons';
import { Entrenado, Rutina, Rol, TipoNotificacion, RutinaAsignada, SesionRutinaStatus } from 'gym-library';
import { AuthService } from '../../core/services/auth.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { UserService } from '../../core/services/user.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { RutinaService } from '../../core/services/rutina.service';
import { InvitacionService } from '../../core/services/invitacion.service';
import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';
import { SesionRutinaService } from '../../core/services/sesion-rutina.service';

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
    IonSelectOption,
    IonBadge,
    IonItemGroup
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
  private rutinaAsignadaService = inject(RutinaAsignadaService);
  private sesionRutinaService = inject(SesionRutinaService);
  private toastController = inject(ToastController);
  private fb = inject(FormBuilder);

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  diaSeleccionado = signal<string>('Lunes');

  isModalOpen = signal(false);
  selectedEntrenadoId = signal<string | null>(null);
  selectedEntrenado = computed(() => {
    const id = this.selectedEntrenadoId();
    if (!id) return null;
    return this.entrenadoService.entrenados().find(e => e.id === id) || null;
  });

  // Señales para invitación
  isInvitacionModalOpen = signal(false);
  isLoading = signal(false);
  invitacionForm = signal<FormGroup>(
    this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      mensaje: ['']
    })
  );

  // Señal para reactividad del estado del formulario invitacion
  private readonly invitacionStatus = toSignal(this.invitacionForm().statusChanges, {
    initialValue: this.invitacionForm().status
  });

  readonly isInvitacionSaveDisabled = computed(() => {
    return this.invitacionStatus() === 'INVALID' || this.isLoading();
  });

  // Señales para gestión de rutinas
  isRutinasModalOpen = signal(false);

  // Obtenemos las asignaciones detalladas (por día)
  asignacionesEntrenado = computed(() => {
    const entrenadoId = this.selectedEntrenado()?.id;
    if (!entrenadoId) return [];
    return this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(entrenadoId)();
  });

  rutinasEntrenado = computed(() => {
    const entrenado = this.selectedEntrenado();
    if (!entrenado) return [];

    const rutinaIds = new Set(entrenado.rutinasAsignadasIds || []);

    // También incluir rutinas que tengan asignaciones por día aunque no estén en el array principal
    this.asignacionesEntrenado().forEach(a => {
      if (a.rutinaId) rutinaIds.add(a.rutinaId);
    });

    const todasLasRutinas = this.rutinaService.rutinas();
    return todasLasRutinas.filter(r => rutinaIds.has(r.id));
  });

  estadisticasEntrenado = computed(() => {
    const entrenadoId = this.selectedEntrenado()?.id;
    if (!entrenadoId) return null;

    const asignaciones = this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(entrenadoId)()
      .filter(a => a.activa);

    const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(entrenadoId)();

    const completadas = sesiones.filter(s => s.status === SesionRutinaStatus.COMPLETADA).length;
    const enProgreso = sesiones.filter(s => s.status === SesionRutinaStatus.EN_PROGRESO).length;

    const tiempoTotal = sesiones
      .filter(s => s.status === SesionRutinaStatus.COMPLETADA && s.duracion)
      .reduce((total, s) => total + (s.duracion || 0), 0);

    return {
      rutinasAsignadas: asignaciones.length,
      sesionesTotales: sesiones.length,
      completadas,
      enProgreso,
      tiempoTotal
    };
  });

  rutinasDisponibles = computed(() => {
    const items = this.rutinasEntrenado();
    const itemIds = items.map(r => r.id);
    const todasLasRutinas = this.rutinaService.rutinas();

    return todasLasRutinas.filter(r => !itemIds.includes(r.id));
  });

  entrenadosAsociados: Signal<Entrenado[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadoService.entrenados().filter(e => e.entrenadoresId?.includes(entrenadorId)) : [];
  });

  invitacionesPendientes: Signal<any[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.invitacionService.getInvitacionesPendientesPorEntrenador(entrenadorId)() : [];
  });

  /** Calcula la antigüedad en días desde la fecha de registro */
  getAntiguedadDias(entrenado: Entrenado): number | null {
    if (!entrenado.fechaRegistro) return null;
    const fecha = new Date(entrenado.fechaRegistro);
    const hoy = new Date();
    const diffMs = hoy.getTime() - fecha.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  constructor() {
    addIcons({ closeCircleOutline, peopleOutline, close, person, trophy, checkmarkCircle, calendar, business, mailOutline, fitnessOutline, addCircleOutline, removeCircleOutline, flame, timeOutline, statsChartOutline });
  }

  ngOnInit() {
    // Inicializar si es necesario
  }

  verCliente(entrenado: Entrenado) {
    this.selectedEntrenadoId.set(entrenado.id);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedEntrenadoId.set(null);
  }

  getRutinasAsignadasCount(entrenadoId: string): number {
    const entrenado = this.entrenadoService.entrenados().find(e => e.id === entrenadoId);
    return entrenado?.rutinasAsignadasIds?.length || 0;
  }

  formatearTiempo(segundos: number): string {
    if (!segundos) return '0 min';
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);

    if (horas > 0) {
      return `${horas}h ${minutos}m`;
    }
    return `${minutos} min`;
  }

  getUserName(userId: string): string {
    const users = this.userService.users();
    const user = users.find(u => u.uid === userId);
    return user ? user.nombre || 'Sin nombre' : 'Usuario no encontrado';
  }

  estaEntrenando(entrenadoId: string): boolean {
    const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(entrenadoId)();
    return sesiones.some(s => s.status === SesionRutinaStatus.EN_PROGRESO);
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

    // Buscar el usuario por email de forma asíncrona para mayor fiabilidad
    const emailToSearch = data.email?.trim();
    const usuarioInvitado = await this.userService.getUserByEmailAsync(emailToSearch);
    const usuarioId = usuarioInvitado?.uid;

    if (!usuarioId || !usuarioInvitado?.email) {
      const toast = await this.toastController.create({
        message: 'Error: No se encontró un usuario con ese email (' + emailToSearch + ')',
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

  private cargarRutinasEntrenado(entrenadoId: string) {
    // Ya no es necesario cargar manualmente porque rutinasEntrenado es una computed signal
  }

  closeRutinasModal() {
    this.isRutinasModalOpen.set(false);
    this.selectedEntrenadoId.set(null);
  }

  // Métodos para gestión de rutinas
  openRutinasModal(entrenado: Entrenado) {
    this.selectedEntrenadoId.set(entrenado.id);
    this.isRutinasModalOpen.set(true);
  }


  async asignarRutina(rutina: Rutina) {
    const entrenado = this.selectedEntrenado();
    if (!entrenado) return;

    const rutinasAsignadasIds = [...(entrenado.rutinasAsignadasIds || [])];

    if (rutinasAsignadasIds.includes(rutina.id)) return;

    try {
      const entrenadoActualizado: Entrenado = {
        ...entrenado,
        rutinasAsignadasIds: [...rutinasAsignadasIds, rutina.id]
      };
      await this.entrenadoService.save(entrenadoActualizado);

      const toast = await this.toastController.create({
        message: `Rutina ${rutina.nombre} habilitada para el entrenado`,
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      console.error('Error al habilitar rutina:', error);
    }
  }

  async asignarDiaARutina(rutina: Rutina, event: any) {
    const dia = event.detail.value;
    if (!dia || !this.selectedEntrenado()) return;

    // Evitar duplicados para el mismo día
    const diasActuales = this.getDiasAsignados(rutina.id);
    if (diasActuales.includes(dia)) {
      // Resetear el select
      event.target.value = null;
      return;
    }

    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return;

    const entrenado = this.selectedEntrenado()!;

    const rutinaAsignada: RutinaAsignada = {
      id: '',
      rutinaId: rutina.id,
      entrenadoId: entrenado.id,
      entrenadorId: entrenadorId,
      diaSemana: dia,
      fechaAsignacion: new Date(),
      activa: true
    };

    try {
      await this.rutinaAsignadaService.save(rutinaAsignada);

      // Resetear el select para que muestre el placeholder de nuevo
      event.target.value = null;

      const toast = await this.toastController.create({
        message: `Rutina asignada al ${dia}`,
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      console.error('Error al asignar día a rutina:', error);
    }
  }

  getDiasAsignados(rutinaId: string): string[] {
    return this.asignacionesEntrenado()
      .filter(a => a.rutinaId === rutinaId && a.diaSemana)
      .map(a => a.diaSemana!);
  }

  async quitarDiaDeRutina(rutinaId: string, dia: string) {
    const asignacion = this.asignacionesEntrenado().find(a => a.rutinaId === rutinaId && a.diaSemana === dia);
    if (asignacion?.id) {
      try {
        await this.rutinaAsignadaService.delete(asignacion.id);
      } catch (error) {
        console.error('Error al quitar día:', error);
      }
    }
  }

  async desasignarRutina(rutina: Rutina) {
    const entrenado = this.selectedEntrenado();
    if (!entrenado) return;

    try {
      // 1) Eliminar todas las asignaciones de esta rutina para este entrenado
      const asignaciones = this.asignacionesEntrenado()
        .filter(a => a.rutinaId === rutina.id);

      for (const asignacion of asignaciones) {
        await this.rutinaAsignadaService.delete(asignacion.id);
      }

      // 2) Actualizar la lista de IDs en el documento del entrenado para mantener compatibilidad
      const rutinasAsignadasIds = (entrenado.rutinasAsignadasIds || []).filter(id => id !== rutina.id);
      const entrenadoActualizado: Entrenado = {
        ...entrenado,
        rutinasAsignadasIds: rutinasAsignadasIds.length > 0 ? rutinasAsignadasIds : []
      };
      await this.entrenadoService.save(entrenadoActualizado);

      const toast = await this.toastController.create({
        message: 'Rutina desasignada completamente',
        duration: 2000,
        color: 'warning',
        position: 'bottom'
      });
      await toast.present();

    } catch (error) {
      console.error('Error al desasignar rutina:', error);
    }
  }
}
