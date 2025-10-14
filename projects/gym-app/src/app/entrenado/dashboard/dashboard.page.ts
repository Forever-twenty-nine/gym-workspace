import { Component, OnInit, signal, inject, computed, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, user } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
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
  private auth = inject(Auth);

  // Signals para datos reactivos
  todasLasRutinas = signal<Rutina[]>([]);
  
  // Signal para el UID de Firebase Auth
  firebaseUserSignal = toSignal(user(this.auth), { initialValue: null });
  
  // Signal para el usuario actual que se actualiza automáticamente
  currentUserSignal = computed(() => this.authService.currentUser());
  
  // Signal computado para los datos del entrenado
  entrenadoDataSignal = computed(() => {
    const firebaseUser = this.firebaseUserSignal();
    const userId = firebaseUser?.uid;
    
    if (userId) {
      const entrenadoSignal = this.entrenadoService.getEntrenado(userId);
      return entrenadoSignal(); // Llamar al signal para obtener el valor
    }
    
    return null;
  });
  
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
    const entrenadoData = this.entrenadoDataSignal();
    const invitaciones = this.invitacionesPendientes();
    
    if (entrenadoData?.objetivo) {
      return entrenadoData.objetivo;
    }
    
    // Si no hay objetivo pero hay invitaciones pendientes
    if (invitaciones.length > 0) {
      return 'Acepta una invitación para definir tu objetivo';
    }
    
    // Si no hay objetivo ni invitaciones
    return 'Busca un entrenador para definir tu objetivo';
  });

  rutinasAsignadas = computed(() => {
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.uid;
    const rutinas = this.todasLasRutinas();
    
    if (!userId || !rutinas.length) return [];
    
    // Filtrar rutinas asignadas a este entrenado
    // Buscar en asignadoIds (array), asignadoId (nuevo) y entrenadoId (legacy)
    const rutinasDelEntrenado = rutinas.filter(rutina => {
      const coincideId = 
        (rutina.asignadoIds && rutina.asignadoIds.includes(userId)) ||
        rutina.asignadoId === userId || 
        rutina.entrenadoId === userId;
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
    // Obtener el uid directamente de Firebase Auth
    const firebaseUser = this.firebaseUserSignal();
    const userId = firebaseUser?.uid;
    
    if (!userId) {
      return [];
    }

    const allNotificaciones = this.notificacionService.notificaciones();
    
    const filtered = allNotificaciones.filter(n => {
      const matches = n.usuarioId === userId &&
        n.tipo === TipoNotificacion.INVITACION_PENDIENTE &&
        n.datos?.estadoInvitacion === 'pendiente';
      
      return matches;
    });

    return filtered;
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
    
    // Sincronizar rutinas
    effect(() => {
      const rutinas = this.rutinaService.rutinas();
      this.todasLasRutinas.set(rutinas);
    }, { injector: this.injector });
    
    // Verificar notificaciones
    effect(() => {
      const notificaciones = this.notificacionService.notificaciones();
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

      // 2. Crear/actualizar la relación entrenador-entrenado
      const currentUser = this.authService.currentUser();
      if (currentUser?.uid) {
        // Obtener el entrenado actual directamente del servicio
        const entrenadoSignal = this.entrenadoService.getEntrenado(currentUser.uid);
        const entrenadoExistente = entrenadoSignal();
        
        if (entrenadoExistente) {
          // Actualizar el entrenado existente con el entrenadorId
          const entrenadoActualizado = {
            ...entrenadoExistente,
            entrenadorId: notificacion.datos.entrenadorId,
            activo: true
          };
          await this.entrenadoService.save(entrenadoActualizado);
        } else {
          // Crear nuevo entrenado si no existe
          const nuevoEntrenado: Entrenado = {
            id: currentUser.uid,
            gimnasioId: '', // Dejar en blanco como pidió el usuario
            entrenadorId: notificacion.datos.entrenadorId,
            activo: true,
            fechaRegistro: new Date(),
            objetivo: Objetivo.MANTENER_PESO
          };
          await this.entrenadoService.save(nuevoEntrenado);
        }
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
