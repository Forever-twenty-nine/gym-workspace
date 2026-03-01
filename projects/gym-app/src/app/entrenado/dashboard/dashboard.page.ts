import {
  Component,
  OnInit,
  inject,
  Signal,
  computed,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
  IonChip,
  IonAvatar,
  IonButton,
  IonBadge,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  barbellOutline,
  bodyOutline,
  todayOutline,
  medalOutline,
  statsChartOutline,
  fitnessOutline,
  personOutline,
  checkmarkCircleOutline,
  checkmarkCircle,
  timeOutline,
  notificationsOutline,
  closeCircleOutline,
  chevronForwardOutline,
  accessibilityOutline,
  chevronUp,
  chevronDown,
  notificationsCircle
} from 'ionicons/icons';
import { Rol, Objetivo } from 'gym-library';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { RutinaService } from '../../core/services/rutina.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { EntrenadorService, PlanLimitError } from '../../core/services/entrenador.service';
import { InvitacionService } from '../../core/services/invitacion.service';
import { Entrenado, Rutina } from 'gym-library';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css'],
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonChip,
    IonAvatar,
    IonButton,
    IonBadge,
    FormsModule
],
})
export class DashboardPage implements OnInit {
  private entrenadoService = inject(EntrenadoService);
  private rutinaService = inject(RutinaService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificacionService = inject(NotificacionService);
  private entrenadorService = inject(EntrenadorService);
  private invitacionService = inject(InvitacionService);
  private toastController = inject(ToastController);

  // Signal para controlar la visibilidad de invitaciones
  mostrarInvitaciones = signal(true);

  // Signals para datos reactivos
  todasLasRutinas = signal<Rutina[]>([]);

  // Signal principal heredado del AUTH service
  currentUserSignal = this.authService.currentUser;

  // Signal computado para los datos del entrenado
  entrenadoDataSignal = computed(() => {
    const user = this.currentUserSignal();
    const userId = user?.uid;

    if (userId) {
      const entrenadoSignal = this.entrenadoService.getEntrenado(userId);
      return entrenadoSignal();
    }
    return null;
  });

  // Computed signals para UI
  nombreEntrenado = computed(() => {
    const user = this.currentUserSignal();
    return user?.nombre || 'Entrenado';
  });

  tipoPlan = computed(() => {
    const user = this.currentUserSignal();
    return user?.plan === 'premium' ? 'Plan Premium' : 'Plan Gratuito';
  });

  objetivoActual = computed(() => {
    const entrenadoData = this.entrenadoDataSignal();
    const invitaciones = this.invitacionesPendientes();

    if (entrenadoData?.objetivo) {
      return entrenadoData.objetivo;
    }

    if (invitaciones.length > 0) {
      return 'Acepta una invitación para definir tu objetivo';
    }

    return 'Busca un entrenador para definir tu objetivo';
  });

  invitacionesPendientes = computed(() => {
    const user = this.currentUserSignal();
    const userId = user?.uid;

    if (!userId) return [];

    const allInvitaciones = this.invitacionService.invitaciones();

    return allInvitaciones
      .filter(inv => inv.entrenadoId === userId && inv.estado === 'pendiente')
      .map(invitacion => ({
        ...invitacion,
        titulo: `Invitación de ${invitacion.entrenadorNombre}`,
        mensaje: invitacion.mensajePersonalizado || 'Te invito a ser mi cliente.',
        datos: {
          entrenadorNombre: invitacion.entrenadorNombre
        }
      }));
  });

  rutinasAsignadas = computed(() => {
    const user = this.currentUserSignal();
    const userId = user?.uid;
    const rutinas = this.todasLasRutinas();

    if (!userId || !rutinas.length) return [];

    const entrenado = this.entrenadoService.getEntrenado(userId)();
    const rutinasDelEntrenado = rutinas.filter(rutina =>
      entrenado?.rutinasAsignadasIds?.includes(rutina.id)
    );

    return rutinasDelEntrenado.map(rutina => ({
      nombre: rutina.nombre,
      fechaAsignada: this.formatearFecha(rutina.fechaCreacion || new Date()),
      asignadoPor: 'Entrenador' // Simplificado para este ejemplo
    }));
  });

  entrenadorAsignado = computed(() => {
    const entrenado = this.entrenadoDataSignal();
    if (!entrenado?.entrenadoresId?.length) return null;

    const entrenadorId = entrenado.entrenadoresId[0];
    const allUsers = this.userService.users();
    return allUsers.find(u => u.uid === entrenadorId) || null;
  });

  constructor() {
    addIcons({
      accessibilityOutline,
      barbellOutline,
      bodyOutline,
      todayOutline,
      medalOutline,
      chevronForwardOutline,
      statsChartOutline,
      fitnessOutline,
      personOutline,
      checkmarkCircleOutline,
      checkmarkCircle,
      timeOutline,
      notificationsOutline,
      closeCircleOutline,
      chevronUp,
      chevronDown,
      notificationsCircle
    });
  }

  ngOnInit() {
    // Escuchar cambios en rutinas globales
    this.todasLasRutinas.set(this.rutinaService.rutinas());
  }

  private formatearFecha(fecha: any): string {
    if (!fecha) return '';
    const date = fecha.toDate ? fecha.toDate() : new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // Método público para usar en el template
  formatearFechaPublico(fecha: any): string {
    return this.formatearFecha(fecha);
  }

  toggleInvitaciones() {
    this.mostrarInvitaciones.update(current => !current);
  }

  async aceptarInvitacion(invitacion: any) {
    if (!invitacion.entrenadorId) return;

    try {
      await this.invitacionService.aceptarInvitacion(invitacion.id);

      const user = this.currentUserSignal();
      if (user?.uid) {
        const entrenadoSignal = this.entrenadoService.getEntrenado(user.uid);
        const entrenadoExistente = entrenadoSignal();

        if (entrenadoExistente) {
          const entrenadoActualizado = {
            ...entrenadoExistente,
            entrenadoresId: [...(entrenadoExistente.entrenadoresId || []), invitacion.entrenadorId]
          };
          await this.entrenadoService.save(entrenadoActualizado);
        } else {
          const nuevoEntrenado: Entrenado = {
            id: user.uid,
            entrenadoresId: [invitacion.entrenadorId],
            fechaRegistro: new Date(),
            objetivo: Objetivo.MANTENER_PESO
          };
          await this.entrenadoService.save(nuevoEntrenado);
        }

        const toast = await this.toastController.create({
          message: 'Invitación aceptada exitosamente',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error al aceptar invitación:', error);
      const toast = await this.toastController.create({
        message: 'Error al aceptar la invitación',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async rechazarInvitacion(invitacion: any) {
    try {
      await this.invitacionService.rechazarInvitacion(invitacion.id);
      const toast = await this.toastController.create({
        message: 'Invitación rechazada',
        duration: 2000,
        color: 'medium'
      });
      await toast.present();
    } catch (error) {
      console.error('Error al rechazar invitación:', error);
    }
  }
}
