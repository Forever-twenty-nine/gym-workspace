import { Component, OnInit, signal, inject, computed, effect, Injector, runInInjectionContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, user, User as FirebaseUser } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonIcon,
  IonChip,
  IonAvatar,
  IonButton,
  IonBadge,
  IonText,
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
  time,
  notificationsOutline,
  checkmarkCircle as checkmarkCircleIcon,
  closeCircleOutline,
  chevronForwardOutline,
  accessibilityOutline,
  notificationsCircle,
  chevronUp,
  chevronDown,
} from 'ionicons/icons';
import { EntrenadoService, RutinaService, UserService, AuthService, NotificacionService, Rol, TipoNotificacion, Objetivo, EntrenadorService, InvitacionService, PlanLimitError } from 'gym-library';
import { Entrenado, Rutina } from 'gym-library';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonChip,
    IonAvatar,
    IonButton,
    IonBadge
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
  private injector = inject(Injector);
  private auth = inject(Auth);

  // Signal para controlar la visibilidad de invitaciones
  mostrarInvitaciones = signal(true);

  // Signals para datos reactivos
  todasLasRutinas = signal<Rutina[]>([]);

  // Signal para el UID de Firebase Auth
  firebaseUserSignal = toSignal(runInInjectionContext(this.injector, () => user(this.auth)), { initialValue: null as FirebaseUser | null });

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

    // Obtener el entrenado
    const entrenado = this.entrenadoService.getEntrenado(userId)();

    // Filtrar rutinas asignadas a este entrenado
    const rutinasDelEntrenado = rutinas.filter(rutina => 
      entrenado?.rutinasAsignadas?.includes(rutina.id)
    );

    return rutinasDelEntrenado.map(rutina => {
      // Obtener el nombre del creador (entrenador que asignó la rutina)
      const allUsers = this.userService.users();
      const entrenadorId = entrenado?.entrenadoresId?.[0];
      const creador = allUsers.find(u => u.uid === entrenadorId);
      const asignadoPor = creador?.nombre || creador?.email || 'Entrenador';
      
      return {
        nombre: rutina.nombre,
        fechaAsignada: this.formatearFecha(rutina.fechaCreacion || new Date()),
        completada: false, // No hay propiedad completado en el modelo
        asignadoPor: asignadoPor
      };
    });
  });

  // Computed signal para obtener el entrenador asignado
  entrenadorAsignado = computed(() => {
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.uid;

    if (!userId) return null;

    // Obtener el entrenado
    const entrenado = this.entrenadoService.getEntrenado(userId)();

    if (!entrenado?.entrenadoresId?.length) return null;

    // Obtener el primer entrenador asignado
    const entrenadorId = entrenado.entrenadoresId[0];
    const allUsers = this.userService.users();
    const entrenador = allUsers.find(u => u.uid === entrenadorId);

    return entrenador || null;
  });

      // Invitaciones pendientes del usuario actual
  invitacionesPendientes = computed(() => {
    // Obtener el uid directamente de Firebase Auth
    const firebaseUser = this.firebaseUserSignal();
    const userId = firebaseUser?.uid;

    if (!userId) {
      return [];
    }

    // Obtener invitaciones directamente del servicio de invitaciones
    const allInvitaciones = this.invitacionService.invitaciones();
    console.log('📊 Total invitaciones en BD:', allInvitaciones.length);

    // Filtrar invitaciones pendientes para este usuario
    const invitacionesUsuario = allInvitaciones.filter(inv =>
      inv.entrenadoId === userId &&
      inv.estado === 'pendiente'
    );

    console.log('🎯 Invitaciones para este usuario:', invitacionesUsuario.length);

    // Crear un Map para eliminar duplicados por ID
    const uniqueMap = new Map();
    invitacionesUsuario.forEach(invitacion => {
      if (!uniqueMap.has(invitacion.id)) {
        uniqueMap.set(invitacion.id, invitacion);
      }
    });

    const uniqueInvitaciones = Array.from(uniqueMap.values());
    console.log('✅ Invitaciones únicas por ID:', uniqueInvitaciones.length);

    // También verificar duplicados por contenido (mismo entrenador)
    const contentMap = new Map();
    uniqueInvitaciones.forEach(invitacion => {
      const key = `${invitacion.datos?.entrenadorId}-${invitacion.datos?.estadoInvitacion}`;
      if (!contentMap.has(key)) {
        contentMap.set(key, invitacion);
      } else {
        console.warn('⚠️ Duplicado por contenido encontrado:', key);
      }
    });

    const finalInvitaciones = Array.from(contentMap.values());
    console.log('🎉 Invitaciones finales:', finalInvitaciones.length);

    return uniqueInvitaciones.map(invitacion => {
      const entrenador = this.userService.users().find(u => u.uid === invitacion.entrenadorId);
      return {
        ...invitacion,
        titulo: `Invitación de ${invitacion.entrenadorNombre}`,
        mensaje: invitacion.mensajePersonalizado || 'Te invito a ser mi cliente.',
        datos: {
          entrenadorNombre: invitacion.entrenadorNombre
        }
      };
    });
  });  constructor() {
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
      time,
      notificationsOutline,
      checkmarkCircleIcon,
      closeCircleOutline,
      notificationsCircle,
      chevronUp,
      chevronDown,
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

  // Método público para usar en el template
  formatearFechaPublico(fecha: Date): string {
    return this.formatearFecha(fecha);
  }

  toggleInvitaciones() {
    this.mostrarInvitaciones.update(current => !current);
  }

  async aceptarInvitacion(invitacion: any) {
    if (!invitacion.entrenadorId) return;

    try {
      // 1. Aceptar la invitación
      await this.invitacionService.aceptarInvitacion(invitacion.id);

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
            entrenadoresId: [...(entrenadoExistente.entrenadoresId || []), invitacion.entrenadorId],
            activo: true
          };
          await this.entrenadoService.save(entrenadoActualizado);
        } else {
          // Crear nuevo entrenado si no existe
          const nuevoEntrenado: Entrenado = {
            id: currentUser.uid,
            entrenadoresId: [invitacion.entrenadorId],
            fechaRegistro: new Date(),
            objetivo: Objetivo.MANTENER_PESO
          };
          await this.entrenadoService.save(nuevoEntrenado);
        }

        // 4. Actualizar el entrenador para agregar el entrenado a su lista
        const entrenadorSignal = this.entrenadorService.getEntrenadorById(invitacion.entrenadorId);
        const entrenadorExistente = entrenadorSignal();

        if (entrenadorExistente) {
          const entrenadorActualizado = {
            ...entrenadorExistente,
            entrenadosAsignadosIds: [...(entrenadorExistente.entrenadosAsignadosIds || []), currentUser.uid]
          };
          await this.entrenadorService.update(entrenadorExistente.id, entrenadorActualizado);
        }

        const toast = await this.toastController.create({
          message: 'Invitación aceptada exitosamente',
          duration: 2000,
          position: 'bottom',
          color: 'success'
        });
        await toast.present();

      }
    } catch (error) {
      console.error('Error al aceptar invitación:', error);
      let message = 'Error al aceptar la invitación';
      if (error instanceof PlanLimitError) {
        message = 'El entrenador ha alcanzado el límite de clientes para su plan. No se puede aceptar la invitación.';
      }
      const toast = await this.toastController.create({
        message,
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  async rechazarInvitacion(invitacion: any) {
    try {
      // 1. Rechazar la invitación
      await this.invitacionService.rechazarInvitacion(invitacion.id);

      const toast = await this.toastController.create({
        message: 'Invitación rechazada',
        duration: 2000,
        position: 'bottom',
        color: 'medium'
      });
      await toast.present();
    } catch (error) {
      console.error('Error al rechazar invitación:', error);
      const toast = await this.toastController.create({
        message: 'Error al rechazar la invitación',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }

  verRutina(rutina: any) {
    // Navegar al detalle de la rutina
  }

  contactarEntrenador() {
    // Contactar con el entrenador
  }

}
