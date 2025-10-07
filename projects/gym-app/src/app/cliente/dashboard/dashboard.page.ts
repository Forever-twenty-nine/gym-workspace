import { Component, OnInit, signal, inject, computed, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
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
  timeOutline
} from 'ionicons/icons';
import { ClienteService, RutinaService, UserService, AuthService, Rol } from 'gym-library';
import { Cliente, Rutina } from 'gym-library';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
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
  
  private clienteService = inject(ClienteService);
  private rutinaService = inject(RutinaService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private injector = inject(Injector);

  // Signals para datos reactivos
  cliente = signal<Cliente | null>(null);
  todasLasRutinas = signal<Rutina[]>([]);
  
  // Computed signals para UI
  nombreCliente = computed(() => {
    const user = this.userService.user();
    return user?.nombre || 'Cliente';
  });

  objetivoActual = computed(() => {
    const clienteData = this.cliente();
    return clienteData?.objetivo || 'Sin objetivo definido';
  });

  rutinasAsignadas = computed(() => {
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.uid;
    const rutinas = this.todasLasRutinas();
    
    if (!userId || !rutinas.length) return [];
    
    // Filtrar rutinas que están EXPLÍCITAMENTE asignadas a este cliente
    // Solo usar la lógica nueva (asignadoId + asignadoTipo) para evitar datos corruptos
    const rutinasDelCliente = rutinas.filter(rutina => 
      rutina.asignadoId === userId && rutina.asignadoTipo === Rol.CLIENTE
    );
    
    return rutinasDelCliente.map(rutina => ({
      nombre: rutina.nombre,
      fechaAsignada: this.formatearFecha(rutina.fechaAsignacion),
      completada: rutina.completado || false
    }));
  });

  constructor() { 
    addIcons({
      statsChartOutline,
      fitnessOutline,
      personOutline,
      checkmarkCircleOutline,
      timeOutline
    });
  }

  ngOnInit() {
    // Obtener el usuario actual y suscribirse a sus datos
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.uid;
    
    if (userId) {
      // Obtener el signal del cliente (esto llama a subscribeToCliente una sola vez)
      const clienteSignal = this.clienteService.getCliente(userId);
      
      // Sincronizar el signal local con el del servicio usando el injector
      effect(() => {
        const clienteData = clienteSignal();
        this.cliente.set(clienteData);
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
