import { Component, OnInit, signal, inject, computed, effect } from '@angular/core';
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
import { ClienteService } from '../../core/services/cliente.service';
import { RutinaService } from '../../core/services/rutina.service';
import { UserService } from '../../core/services/user.service';
import { Cliente } from '../../core/models/cliente.model';
import { Rutina } from '../../core/models/rutina.model';

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
    const userId = this.userService.getUserId();
    const rutinas = this.todasLasRutinas();
    
    console.log('🔍 Debug rutinasAsignadas:', {
      userId,
      totalRutinas: rutinas.length,
      rutinas: rutinas
    });
    
    if (!userId || !rutinas.length) return [];
    
    // Filtrar rutinas que pertenecen al cliente actual
    const rutinasDelCliente = rutinas.filter(rutina => rutina.clienteId === userId);
    
    console.log('🎯 Rutinas del cliente:', rutinasDelCliente);
    
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

    // Efecto para mantener sincronizados los datos del cliente
    effect(() => {
      const userId = this.userService.getUserId();
      console.log('👤 Usuario actual:', userId);
      
      if (userId) {
        const clienteSignal = this.clienteService.obtenerClientePorId(userId);
        const clienteData = clienteSignal();
        console.log('📋 Datos del cliente:', clienteData);
        this.cliente.set(clienteData);
      }
    });

    // Efecto para mantener sincronizadas todas las rutinas
    effect(() => {
      const rutinasSignal = this.rutinaService.obtenerRutinas();
      const rutinas = rutinasSignal();
      console.log('🏃‍♂️ Todas las rutinas:', rutinas);
      this.todasLasRutinas.set(rutinas);
    });
  }

  ngOnInit() {
    // La carga de datos se maneja reactivamente en el constructor con effect()
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
    console.log('Ver rutina:', rutina);
  }

  contactarEntrenador() {
    // Contactar con el entrenador
    console.log('Contactar entrenador');
  }

}
