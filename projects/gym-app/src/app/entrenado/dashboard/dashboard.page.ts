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
import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';
import { Entrenado, Rutina, RutinaAsignada, User as LibraryUser } from 'gym-library';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';

// Extendemos la interfaz User localmente para asegurar la existencia de photoURL
export interface User extends LibraryUser {
  photoURL?: string;
}

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
    IonAvatar,
    IonButton,
    IonBadge,
    FormsModule,
    HeaderTabsComponent
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
  private rutinaAsignadaService = inject(RutinaAsignadaService);
  private toastController = inject(ToastController);

  // Signal para controlar la visibilidad de invitaciones
  mostrarInvitaciones = signal(true);

  // Signals para datos reactivos
  todasLasRutinas = signal<Rutina[]>([]);

  // Signal principal heredado del AUTH service
  currentUserSignal = this.authService.currentUser as Signal<User | null>;

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

  frecuenciaSemanal = computed(() => {
    const user = this.currentUserSignal();
    const userId = user?.uid;
    if (!userId) return 0;

    const asignaciones = this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(userId)();
    if (!asignaciones.length) return 0;

    // Obtener días únicos de la semana
    const diasUnicos = new Set(
      asignaciones
        .filter(asig => asig.diaSemana)
        .map(asig => asig.diaSemana!.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    );

    return diasUnicos.size;
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
    const rutinas = this.rutinaService.rutinas();

    if (!userId || !rutinas.length) return [];

    const entrenado = this.entrenadoService.getEntrenado(userId)();
    const asignaciones = this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(userId)();
    const rutinasDelEntrenado = rutinas.filter(rutina =>
      entrenado?.rutinasAsignadasIds?.includes(rutina.id) ||
      asignaciones.some(asig => asig.rutinaId === rutina.id)
    );

    if (asignaciones.length === 0) {
      return rutinasDelEntrenado.map(rutina => ({
        ...rutina,
        nombre: rutina.nombre,
        fechaAsignada: this.formatearFecha(rutina.fechaCreacion || new Date()),
        asignadoPor: 'Entrenador',
        diaCorto: ''
      })).slice(0, 3);
    }

    const hoy = new Date();
    const proximas: any[] = [];

    for (let i = 0; i < 7 && proximas.length < 3; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const diaSemanaIndex = fecha.getDay();
      const diasSemanaSinTilde = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaCortoArr = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      const diaSemanaNormalizado = diasSemanaSinTilde[diaSemanaIndex];
      const diaCorto = diaCortoArr[diaSemanaIndex];
      const esHoyCheck = fecha.toDateString() === hoy.toDateString();

      const asignacionesDelDia = asignaciones.filter((asig: RutinaAsignada) => {
        if (!asig.diaSemana) return false;

        // Normalización para comparación robusta
        const diasSemanaMapa: Record<string, string> = {
          'domingo': 'domingo', 'lunes': 'lunes', 'martes': 'martes',
          'miercoles': 'miercoles', 'jueves': 'jueves', 'viernes': 'viernes',
          'sabado': 'sabado', 'dom': 'domingo', 'lun': 'lunes',
          'mar': 'martes', 'mie': 'miercoles', 'jue': 'jueves',
          'vie': 'viernes', 'sab': 'sabado'
        };

        const asigDiaNormalizado = asig.diaSemana.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();

        // Intentar mapear si es una abreviatura o nombre completo
        const diaFinal = diasSemanaMapa[asigDiaNormalizado] || asigDiaNormalizado;

        return diaFinal === diaSemanaNormalizado;
      });

      asignacionesDelDia.forEach((asig: RutinaAsignada) => {
        const rutinaOriginal = rutinas.find(r => r.id === asig.rutinaId);
        // Si la rutina pertenece al entrenado, la agregamos
        if (rutinaOriginal && rutinasDelEntrenado.some(r => r.id === rutinaOriginal.id) && proximas.length < 3) {
          proximas.push({
            ...rutinaOriginal,
            nombre: rutinaOriginal.nombre,
            fechaAsignada: this.formatearFecha(rutinaOriginal.fechaCreacion || new Date()),
            asignadoPor: 'Entrenador',
            diaCorto: esHoyCheck ? 'Hoy' : diaCorto
          });
        }
      });
    }

    if (proximas.length === 0 && rutinasDelEntrenado.length > 0) {
      return rutinasDelEntrenado.map(rutina => ({
        ...rutina,
        nombre: rutina.nombre,
        fechaAsignada: this.formatearFecha(rutina.fechaCreacion || new Date()),
        asignadoPor: 'Entrenador',
        diaCorto: ''
      })).slice(0, 3);
    }

    return proximas;
  });

  entrenadorAsignado = computed(() => {
    const entrenado = this.entrenadoDataSignal();
    if (!entrenado?.entrenadoresId?.length) return null;

    const entrenadorId = entrenado.entrenadoresId[0];
    const allUsers = this.userService.users();
    return (allUsers.find(u => u.uid === entrenadorId) as User) || null;
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
    // Escuchar cambios en rutinas globales (ya se hace reactivamente vía computations)
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
            objetivo: Objetivo.SALUD
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
