import { Component, OnInit, signal, inject, computed, effect, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonBadge,
  IonList,
  IonItem,
  IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  fitnessOutline,
  playOutline,
  timeOutline,
  calendarOutline,
  checkmarkCircle,
  timerOutline,
  notificationsOutline,
  arrowBackOutline,
  todayOutline,
  bedOutline
} from 'ionicons/icons';
import { RutinaService, AuthService, EjercicioService, Rol, Rutina, Ejercicio, EntrenadoService } from 'gym-library';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.page.html',
  styleUrls: ['./rutinas.page.css'],
  standalone: true,
  imports: [
    IonBackButton,
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardContent,
    IonBadge,
    IonList,
    IonItem,
    IonLabel
  ],
})
export class RutinasPage implements OnInit {
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private router = inject(Router);
  private injector = inject(Injector);

  // Señal para todas las rutinas
  private todasLasRutinas = signal<Rutina[]>([]);

    // Estado del modal (ya no se usa, pero mantenemos por compatibilidad)
  readonly modalAbierto = signal(false);
  readonly rutinaSeleccionada = signal<any>(null);

  // Computed para rutinas del entrenado actual
  rutinasAsignadas = computed(() => {
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.uid;
    const rutinas = this.todasLasRutinas();
    const entrenado = this.entrenadoService.entrenados().find((e: any) => e.id === userId);
    
    if (!userId || !rutinas.length || !entrenado?.rutinasAsignadas) return [];
    
    // Filtrar rutinas asignadas a este entrenado
    return rutinas.filter(rutina => entrenado.rutinasAsignadas!.includes(rutina.id));
  });

  constructor() {
    addIcons({
      fitnessOutline,
      playOutline,
      timeOutline,
      calendarOutline,
      checkmarkCircle,
      timerOutline,
      notificationsOutline,
      arrowBackOutline,
      todayOutline,
      bedOutline
    });
  }

  ngOnInit() {
    // Sincronizar rutinas del servicio
    effect(() => {
      const rutinas = this.rutinaService.rutinas();
      this.todasLasRutinas.set(rutinas);
    }, { injector: this.injector });
  }

  /**
   * Formatea los días de la semana de strings a nombres cortos
   */
  formatearDiasSemana(dias?: string[]): string {
    if (!dias || dias.length === 0) return 'Sin días asignados';
    
    const diasMapeo: { [key: string]: string } = {
      'Lunes': 'Lun',
      'Martes': 'Mar', 
      'Miércoles': 'Mié',
      'Jueves': 'Jue',
      'Viernes': 'Vie',
      'Sábado': 'Sáb',
      'Domingo': 'Dom'
    };
    
    return dias.map(dia => diasMapeo[dia] || dia).join(', ');
  }

  /**
   * Mapea un día de la semana a su abreviatura
   */
  mapearDia(dia: string): string {
    const diasMapeo: { [key: string]: string } = {
      'Lunes': 'Lun',
      'Martes': 'Mar', 
      'Miércoles': 'Mié',
      'Jueves': 'Jue',
      'Viernes': 'Vie',
      'Sábado': 'Sáb',
      'Domingo': 'Dom'
    };
    
    return diasMapeo[dia] || dia;
  }

  /**
   * Formatea una fecha
   */
  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'Sin fecha';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Calcula las calorías estimadas basado en duración
   */
  calcularCaloriasEstimadas(duracion?: number): number {
    if (!duracion) return 0;
    // Estimación aproximada: 7-8 calorías por minuto de entrenamiento
    return Math.round(duracion * 7.5);
  }

  /**
   * Obtiene el objeto ejercicio completo a partir de su ID
   */
  getEjercicioById(ejercicioId: string): Ejercicio | undefined {
    return this.ejercicioService.ejercicios().find(ej => ej.id === ejercicioId);
  }

  /**
   * Computed que convierte los IDs de ejercicios de la rutina seleccionada a objetos completos
   */
  ejerciciosCompletos = computed(() => {
    const rutina = this.rutinaSeleccionada();
    if (!rutina?.ejerciciosIds) return [];
    
    const todosEjercicios = this.ejercicioService.ejercicios();

    // Si los ejercicios son strings (IDs), buscar los objetos completos
    return rutina.ejerciciosIds
      .map((ej: any) => {
        if (typeof ej === 'string') {
          return todosEjercicios.find(ejercicio => ejercicio.id === ej);
        }
        return ej; // Ya es un objeto completo
      })
      .filter((ej: any) => ej !== undefined); // Filtrar ejercicios no encontrados
  });

  // Rutinas organizadas por días de la semana (solo semana actual)
  readonly rutinasPorDia = computed(() => {
    const rutinas = this.rutinasAsignadas();
    const hoy = new Date();

    // Calcular fechas para la próxima semana (7 días)
    const fechas = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      fechas.push(fecha);
    }

    // Organizar por día
    const rutinasOrganizadas: { [key: string]: { fecha: Date; rutinas: any[]; diaCorto: string; esHoy: boolean; } } = {};

    fechas.forEach(fecha => {
      // Usar los mismos valores que se guardan en el modal (sin tildes)
      const diaSemanaIndex = fecha.getDay();
      const diasSemanaSinTilde = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diasSemanaCorto = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

      const diaSemana = diasSemanaSinTilde[diaSemanaIndex]; // Usar sin tilde para comparación
      const diaCorto = diasSemanaCorto[diaSemanaIndex];
      const fechaKey = fecha.toISOString().split('T')[0];

      if (!rutinasOrganizadas[fechaKey]) {
        rutinasOrganizadas[fechaKey] = {
          fecha: new Date(fecha),
          rutinas: [],
          diaCorto,
          esHoy: fecha.toDateString() === hoy.toDateString()
        };
      }

      // Agregar rutinas que corresponden a este día
      rutinas.forEach(rutina => {
        if (rutina.DiasSemana && rutina.DiasSemana.includes(diaSemana)) {
          rutinasOrganizadas[fechaKey].rutinas.push(rutina);
        }
      });
    });

    // Convertir a array y ordenar por fecha
    return Object.values(rutinasOrganizadas).sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  });

  /**
   * Abre el modal con los detalles de la rutina
   */
  abrirDetalles(rutina: any): void {
    this.rutinaSeleccionada.set(rutina);
    this.modalAbierto.set(true);
  }

  /**
   * Abre el modal desde el botón "Ver más" (previene propagación)
   */
  verDetalles(event: Event, rutina: any): void {
    event.stopPropagation();
    this.abrirDetalles(rutina);
  }

  /**
   * Cierra el modal
   */
  cerrarModal(): void {
    this.modalAbierto.set(false);
    // Pequeño delay antes de limpiar la rutina para evitar parpadeos
    setTimeout(() => {
      this.rutinaSeleccionada.set(null);
    }, 300);
  }

  iniciarEntrenamiento(rutina: any) {
    // Navegar a la página de progreso de rutina
    this.router.navigate(['/entrenado-tabs/rutina-progreso', rutina.id]);

    // Cerrar modal si está abierto
    if (this.modalAbierto()) {
      this.cerrarModal();
    }
  }

  pausarCronometro() {
    // Este método ya no se usa - la lógica se maneja en rutina-progreso
  }

  detenerCronometro() {
    // Este método ya no se usa - la lógica se maneja en rutina-progreso
  }

  finalizarEntrenamiento() {
    // Este método ya no se usa - la lógica se maneja en rutina-progreso
  }

  verRutinasDelDia(dia: any) {
    if (dia.rutinas && dia.rutinas.length > 0) {
      // Si hay una sola rutina, ir directamente a ella
      if (dia.rutinas.length === 1) {
        this.iniciarEntrenamiento(dia.rutinas[0]);
      } else {
        // Si hay múltiples rutinas, por ahora ir a la primera
        // TODO: Implementar selector de rutina o vista detallada del día
        this.iniciarEntrenamiento(dia.rutinas[0]);
      }
    }
  }
}
