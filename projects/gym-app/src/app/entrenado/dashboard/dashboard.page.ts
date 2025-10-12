import { Component, OnInit, signal, inject, computed, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonChip,
  IonAvatar, IonHeader, IonToolbar, IonTitle,
  IonButton,
  IonBadge,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  statsChartOutline,
  fitnessOutline, 
  personOutline, 
  checkmarkCircleOutline,
  checkmarkCircle,
  timeOutline,
  time,
  notificationsOutline,
  checkmarkCircle as checkmarkCircleIcon,
  closeCircleOutline
} from 'ionicons/icons';
import { EntrenadoService, RutinaService, UserService, AuthService, NotificacionService, Rol, TipoNotificacion, Objetivo } from 'gym-library';
import { Entrenado, Rutina } from 'gym-library';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css'],
  standalone: true,
  imports: [ IonToolbar, IonHeader, 
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonChip,
    IonAvatar,
    IonButton,
    IonBadge
  ]
})
export class DashboardPage implements OnInit {
  
  private entrenadoService = inject(EntrenadoService);
  private rutinaService = inject(RutinaService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificacionService = inject(NotificacionService);
  private injector = inject(Injector);

  // Signals para datos reactivos
  entrenado = signal<Entrenado | null>(null);
  todasLasRutinas = signal<Rutina[]>([]);
  
  // Computed signals para UI
  nombreEntrenado = computed(() => {
    const user = this.userService.user();
    return user?.nombre || 'Entrenado';
  });

  tipoPlan = computed(() => {
    const user = this.userService.user();
    return user?.plan === 'premium' ? 'Plan Premium' : 'Plan Gratuito';
  });

  objetivoActual = computed(() => {
    const entrenadoData = this.entrenado();
    return entrenadoData?.objetivo || 'Sin objetivo definido';
  });

  rutinasAsignadas = computed(() => {
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.uid;
    const rutinas = this.todasLasRutinas();
    
    if (!userId || !rutinas.length) return [];
    
    // Filtrar rutinas asignadas a este entrenado
    // Buscar en ambos campos: asignadoId (nuevo) y entrenadoId (legacy)
    const rutinasDelEntrenado = rutinas.filter(rutina => {
      const coincideId = rutina.asignadoId === userId || rutina.entrenadoId === userId;
      const coincideTipo = !rutina.asignadoTipo || rutina.asignadoTipo === Rol.ENTRENADO;
      return coincideId && coincideTipo;
    });
    
    return rutinasDelEntrenado.map(rutina => {
      // Obtener el nombre del creador (entrenador que asignó la rutina)
      const allUsers = this.userService.users();
      const creador = allUsers.find(u => u.uid === rutina.creadorId);
      const asignadoPor = creador?.nombre || creador?.email || 'Entrenador';
      
      return {
        nombre: rutina.nombre,
        fechaAsignada: this.formatearFecha(rutina.fechaAsignacion),
        completada: rutina.completado || false,
        asignadoPor: asignadoPor
      };
    });
  });

  // Invitaciones pendientes del usuario actual
  invitacionesPendientes = computed(() => {
    const userId = this.authService.currentUser()?.uid;
    if (!userId) return [];

    return this.notificacionService.notificaciones().filter(n =>
      n.usuarioId === userId &&
      n.tipo === TipoNotificacion.INVITACION_PENDIENTE &&
      n.datos?.estadoInvitacion === 'pendiente'
    );
  });

  constructor() { 
    addIcons({
      statsChartOutline,
      fitnessOutline,
      personOutline,
      checkmarkCircleOutline,
      checkmarkCircle,
      timeOutline,
      time,
      notificationsOutline,
      checkmarkCircleIcon,
      closeCircleOutline
    });
  }

  ngOnInit() {
    // Obtener el usuario actual y suscribirse a sus datos
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.uid;
    
    if (userId) {
      // Obtener el signal del entrenado (esto llama a subscribeToEntrenado una sola vez)
      const entrenadoSignal = this.entrenadoService.getEntrenado(userId);
      
      // Sincronizar el signal local con el del servicio usando el injector
      effect(() => {
        const entrenadoData = entrenadoSignal();
        this.entrenado.set(entrenadoData);
      }, { injector: this.injector });
    }

    // Sincronizar rutinas
    effect(() => {
      const rutinas = this.rutinaService.rutinas();
      this.todasLasRutinas.set(rutinas);
    }, { injector: this.injector });
  }

  private formatearFecha(fecha: Date): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  async aceptarInvitacion(notificacion: any) {
    if (!notificacion.datos?.entrenadorId) return;

    try {
      // 1. Aceptar la invitación
      await this.notificacionService.aceptarInvitacion(notificacion.id);

      // 2. Crear la relación entrenador-entrenado
      const currentUser = this.authService.currentUser();
      if (currentUser?.uid) {
        const relacionEntrenador: Entrenado = {
          id: currentUser.uid,
          gimnasioId: '', // Dejar en blanco como pidió el usuario
          entrenadorId: notificacion.datos.entrenadorId,
          activo: true,
          fechaRegistro: new Date(),
          objetivo: Objetivo.MANTENER_PESO
        };

        await this.entrenadoService.save(relacionEntrenador);
      }

      // Aquí puedes agregar lógica adicional como mostrar mensaje de éxito

    } catch (error) {
      console.error('Error al aceptar invitación:', error);
    }
  }

  async rechazarInvitacion(notificacion: any) {
    try {
      await this.notificacionService.rechazarInvitacion(notificacion.id);
    } catch (error) {
      console.error('Error al rechazar invitación:', error);
    }
  }

  verRutina(rutina: any) {
    // Navegar al detalle de la rutina
  }

  contactarEntrenador() {
    // Contactar con el entrenador
  }

}
