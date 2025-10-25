import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonProgressBar,
  IonText,
  IonBackButton
} from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  timerOutline,
  playOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  refreshOutline,
  fitnessOutline,
  timeOutline,
  flameOutline,
  calendarOutline,
  checkmarkCircle,
  close,
  pauseCircleOutline
} from 'ionicons/icons';
import {
  RutinaService,
  EjercicioService,
  AuthService,
  Rutina,
  Ejercicio
} from 'gym-library';

@Component({
  selector: 'app-rutina-progreso',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonProgressBar,
    IonText,
    IonBackButton
  ],
  templateUrl: './rutina-progreso.page.html',
  styleUrls: ['./rutina-progreso.page.css']
})
export class RutinaProgresoPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly modalController = inject(ModalController);
  private readonly rutinaService = inject(RutinaService);
  private readonly ejercicioService = inject(EjercicioService);
  private readonly authService = inject(AuthService);

  // Parámetros de ruta
  rutinaId = signal<string>('');

  // Estado del componente
  readonly isLoading = signal(false);
  readonly tiempoTranscurrido = signal('00:00');
  readonly cronometroActivo = signal(false);
  readonly rutinaPausada = signal(false);
  readonly rutinaLocalIniciada = signal(false);
  readonly ejerciciosCompletadosLocal = signal<string[]>([]);
  readonly isCompleting = signal(false);
  private intervaloCronometro?: any;
  private segundosTranscurridos = 0;

  // Datos computados
  rutina = computed(() => {
    const id = this.rutinaId();
    return this.rutinaService.rutinas().find(r => r.id === id) || null;
  });

  ejercicios = computed(() => {
    const rutina = this.rutina();
    if (!rutina?.ejerciciosIds) return [];
    return rutina.ejerciciosIds
      .map(id => this.ejercicioService.ejercicios().find(e => e.id === id))
      .filter((e): e is Ejercicio => e !== undefined);
  });

  progreso = computed(() => {
    // TODO: Implementar servicio de progreso
    return { completado: false, fechaInicio: null, ejerciciosCompletados: [] };
  });

  // Estados computados
  readonly rutinaIniciada = computed(() => {
    // Considera inicio local inmediato (optimista) o el progreso persistido
    return this.rutinaLocalIniciada() || !!this.progreso()?.fechaInicio;
  });

  readonly rutinaCompletada = computed(() => !!this.progreso()?.completado);

  readonly ejerciciosTotales = computed(() => this.ejercicios().length);

  readonly ejerciciosCompletados = computed(() => this.ejerciciosCompletadosLocal().length);

  readonly porcentajeProgreso = computed(() => {
    const total = this.ejerciciosTotales();
    const completados = this.ejerciciosCompletados();
    return total > 0 ? Math.round((completados / total) * 100) : 0;
  });

  readonly mostrarCronometro = computed(() => {
    return this.cronometroActivo() || (this.rutinaIniciada() && !this.rutinaCompletada());
  });

  constructor() {
    console.log('Constructor rutina-progreso');
    addIcons({
      arrowBack,
      timerOutline,
      playOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      refreshOutline,
      fitnessOutline,
      timeOutline,
      flameOutline,
      calendarOutline,
      checkmarkCircle,
      close,
      pauseCircleOutline
    });
  }

  ngOnInit() {
    const rutinaId = this.route.snapshot.paramMap.get('rutinaId');
    console.log('ngOnInit rutina-progreso, rutinaId:', rutinaId);

    if (rutinaId) {
      this.rutinaId.set(rutinaId);

      // Inicializar estado local desde la base de datos
      this.inicializarEstadoLocal();

      // Iniciar cronómetro si la rutina está en progreso
      if (this.progreso()?.fechaInicio && !this.progreso()?.completado) {
        this.iniciarCronometro();
      }
    } else {
      console.log('No rutinaId, navegando a rutinas');
      this.router.navigate(['/entrenado-tabs/rutinas']);
    }
  }

  ngOnDestroy() {
    console.log('ngOnDestroy rutina-progreso');
    if (this.intervaloCronometro) {
      clearInterval(this.intervaloCronometro);
    }
  }

  // --------------------------------------------
  // Inicialización de estado local
  // --------------------------------------------

  private async inicializarEstadoLocal() {
    // Esperar hasta que el progreso esté disponible (máximo 2 segundos)
    const maxRetries = 20;
    const delayMs = 100;

    for (let i = 0; i < maxRetries; i++) {
      const progresoActual = this.progreso();
      if (progresoActual) {
        // Inicializar estado local desde la base de datos
        if (progresoActual.ejerciciosCompletados) {
          this.ejerciciosCompletadosLocal.set([...progresoActual.ejerciciosCompletados]);
        }

        // Inicializar estado de rutina
        if (progresoActual.fechaInicio && !progresoActual.completado) {
          this.rutinaLocalIniciada.set(true);
        }
        break;
      }

      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // --------------------------------------------
  // Gestión de la rutina
  // --------------------------------------------

  async iniciarRutina() {
    // TODO: Implementar servicio de progreso
    this.rutinaLocalIniciada.set(true);
    this.iniciarCronometro();
    this.rutinaPausada.set(false);
  }

  pausarReanudarRutina() {
    if (this.rutinaPausada()) {
      // Reanudar
      this.iniciarCronometro();
      this.rutinaPausada.set(false);
    } else {
      // Pausar
      this.detenerCronometro();
      this.rutinaPausada.set(true);
    }
  }

  async completarRutina() {
    if (!this.rutinaIniciada()) {
      // TODO: Mostrar toast
      return;
    }

    // Verificar que todos los ejercicios estén completados
    if (this.ejerciciosCompletados() < this.ejerciciosTotales()) {
      // TODO: Mostrar toast
      return;
    }

    this.isCompleting.set(true);

    // TODO: Implementar servicio de progreso
    this.detenerCronometro();
    // Reset del estado del cronómetro al completar
    this.tiempoTranscurrido.set('00:00');
    this.segundosTranscurridos = 0;
    // limpiar el inicio local
    this.rutinaLocalIniciada.set(false);
    // Reset de ejercicios completados
    this.ejerciciosCompletadosLocal.set([]);
    // Cerrar el modal
    this.modalController.dismiss();

    this.isCompleting.set(false);
  }

  async reiniciarRutina() {
    // TODO: Implementar servicio de progreso
    this.detenerCronometro();
    // Reset completo del estado del cronómetro
    this.cronometroActivo.set(false);
    this.rutinaPausada.set(false);
    this.tiempoTranscurrido.set('00:00');
    this.segundosTranscurridos = 0;
    // limpiar el inicio local
    this.rutinaLocalIniciada.set(false);
    // Reset de ejercicios completados
    this.ejerciciosCompletadosLocal.set([]);
  }

  // --------------------------------------------
  // Gestión de ejercicios
  // --------------------------------------------

  async toggleEjercicio(ejercicioId: string) {
    if (!this.rutinaIniciada()) {
      // TODO: Mostrar toast
      return;
    }

    // Actualización optimista local inmediata
    const completadosActuales = this.ejerciciosCompletadosLocal();
    const estaCompletado = completadosActuales.includes(ejercicioId);
    const nuevosCompletados = estaCompletado
      ? completadosActuales.filter(id => id !== ejercicioId)
      : [...completadosActuales, ejercicioId];

    // Actualizar estado local inmediatamente para UI responsiva
    this.ejerciciosCompletadosLocal.set(nuevosCompletados);

    // TODO: Sincronización con servicio de progreso
  }

  isEjercicioCompletado(ejercicioId: string): boolean {
    return this.ejerciciosCompletadosLocal().includes(ejercicioId);
  }

  // --------------------------------------------
  // Cronómetro
  // --------------------------------------------

  private iniciarCronometro() {
    if (this.intervaloCronometro) {
      clearInterval(this.intervaloCronometro);
    }

    this.cronometroActivo.set(true);
    this.tiempoTranscurrido.set('00:00');
    this.segundosTranscurridos = 0;

    this.intervaloCronometro = setInterval(() => {
      this.segundosTranscurridos++;
      const minutos = Math.floor(this.segundosTranscurridos / 60);
      const segundos = this.segundosTranscurridos % 60;
      const tiempoFormateado = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
      this.tiempoTranscurrido.set(tiempoFormateado);
    }, 1000);
  }

  private detenerCronometro() {
    if (this.intervaloCronometro) {
      clearInterval(this.intervaloCronometro);
      this.intervaloCronometro = undefined;
    }
    this.cronometroActivo.set(false);
  }

  // --------------------------------------------
  // Utilidades
  // --------------------------------------------

  formatearFecha(fecha?: Date): string {
    if (!fecha) return 'Sin fecha';
    const date = fecha instanceof Date ? fecha : new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoRutina(): string {
    if (this.rutinaCompletada()) return 'Completada';
    if (this.rutinaPausada()) return 'Pausada';
    if (this.rutinaIniciada()) return 'En progreso';
    return 'No iniciada';
  }

  getColorEstado(): string {
    if (this.rutinaCompletada()) return 'success';
    if (this.rutinaPausada()) return 'warning';
    if (this.rutinaIniciada()) return 'primary';
    return 'medium';
  }

  goBack() {
    this.router.navigate(['/entrenado-tabs/rutinas']);
  }
}