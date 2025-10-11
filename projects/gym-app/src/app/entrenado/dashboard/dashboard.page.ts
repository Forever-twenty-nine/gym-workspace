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
  IonAvatar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  statsChartOutline,
  fitnessOutline, 
  personOutline, 
  checkmarkCircleOutline,
  checkmarkCircle,
  timeOutline,
  time
} from 'ionicons/icons';
import { EntrenadoService, RutinaService, UserService, AuthService, Rol } from 'gym-library';
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
    IonItem,
    IonLabel,
    IonList,
    IonChip,
    IonAvatar
  ]
})
export class DashboardPage implements OnInit {
  
  private entrenadoService = inject(EntrenadoService);
  private rutinaService = inject(RutinaService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
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

  constructor() { 
    addIcons({
      statsChartOutline,
      fitnessOutline,
      personOutline,
      checkmarkCircleOutline,
      checkmarkCircle,
      timeOutline,
      time
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


  verRutina(rutina: any) {
    // Navegar al detalle de la rutina
  }

  contactarEntrenador() {
    // Contactar con el entrenador
  }

}
