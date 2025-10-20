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
  IonBackButton,
  IonCheckbox
} from '@ionic/angular/standalone';
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
  close
} from 'ionicons/icons';
import {
  ProgresoService,
  RutinaService,
  EjercicioService,
  AuthService,
  Rutina,
  Ejercicio,
  ProgresoRutina
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
    IonBackButton,
    IonCheckbox
  ],
  templateUrl: './rutina-progreso.page.html',
  styleUrls: ['./rutina-progreso.page.css']
})
export class RutinaProgresoPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly progresoService = inject(ProgresoService);
  private readonly rutinaService = inject(RutinaService);
  private readonly ejercicioService = inject(EjercicioService);
  private readonly authService = inject(AuthService);

  // Parámetros de ruta
  rutinaId = signal<string>('');

  // Estado del componente
  readonly isLoading = signal(false);
  readonly tiempoTranscurrido = signal('00:00');
  readonly cronometroActivo = signal(false);
  readonly ejerciciosCompletadosLocal = signal<string[]>([]);
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
    const entrenadoId = this.authService.currentUser()?.uid;
    const rutinaId = this.rutinaId();
    if (!entrenadoId) return null;
    return this.progresoService.getProgresoRutina(entrenadoId, rutinaId)();
  });

  // Estados computados
  readonly rutinaIniciada = computed(() => {
    return !!this.progreso()?.fechaInicio;
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
      close
    });
  }

  ngOnInit() {
    const rutinaId = this.route.snapshot.paramMap.get('rutinaId');

    if (rutinaId) {
      this.rutinaId.set(rutinaId);

      // Inicializar estado local desde la base de datos
      this.inicializarEstadoLocal();

      // Iniciar cronómetro si la rutina está en progreso
      if (this.progreso()?.fechaInicio && !this.progreso()?.completado) {
        this.iniciarCronometro();
      }
    } else {
      this.router.navigate(['/entrenado-tabs/rutinas']);
    }
  }

  ngOnDestroy() {
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
    try {
      const entrenadoId = this.authService.currentUser()?.uid;
      if (!entrenadoId) throw new Error('Usuario no autenticado');

      await this.progresoService.iniciarRutina(entrenadoId, this.rutinaId());
      this.iniciarCronometro();
    } catch (error: any) {
      console.error('Error al iniciar rutina:', error);
      // TODO: Mostrar toast de error
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

    try {
      const entrenadoId = this.authService.currentUser()?.uid;
      if (!entrenadoId) throw new Error('Usuario no autenticado');

      // Calcular duración en minutos basados en el cronómetro local
      const duracionMinutos = Math.round(this.segundosTranscurridos / 60);
      await this.progresoService.completarRutina(entrenadoId, this.rutinaId(), duracionMinutos);

      this.detenerCronometro();
      // Reset del estado del cronómetro al completar
      this.tiempoTranscurrido.set('00:00');
      this.segundosTranscurridos = 0;
      // Reset de ejercicios completados
      this.ejerciciosCompletadosLocal.set([]);
    } catch (error: any) {
      console.error('Error al completar rutina:', error);
      // TODO: Mostrar toast de error
    }
  }

  async reiniciarRutina() {
    try {
      const entrenadoId = this.authService.currentUser()?.uid;
      if (!entrenadoId) throw new Error('Usuario no autenticado');

      await this.progresoService.reiniciarRutina(entrenadoId, this.rutinaId());

      this.detenerCronometro();
      // Reset completo del estado del cronómetro
      this.cronometroActivo.set(false);
      this.tiempoTranscurrido.set('00:00');
      this.segundosTranscurridos = 0;
      // Reset de ejercicios completados
      this.ejerciciosCompletadosLocal.set([]);
    } catch (error: any) {
      console.error('Error al reiniciar rutina:', error);
      // TODO: Mostrar toast de error
    }
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

    // Sincronización en segundo plano con el servicio
    try {
      const entrenadoId = this.authService.currentUser()?.uid;
      if (!entrenadoId) throw new Error('Usuario no autenticado');

      if (estaCompletado) {
        await this.progresoService.descompletarEjercicio(
          entrenadoId,
          this.rutinaId(),
          ejercicioId,
          this.ejerciciosTotales()
        );
      } else {
        await this.progresoService.completarEjercicio(
          entrenadoId,
          this.rutinaId(),
          ejercicioId,
          this.ejerciciosTotales()
        );
      }
    } catch (error: any) {
      console.error('Error al sincronizar ejercicio:', error, {
        entrenadoId: this.authService.currentUser()?.uid,
        rutinaId: this.rutinaId(),
        ejercicioId
      });
      // Revertir cambio local si falla la sincronización
      this.ejerciciosCompletadosLocal.set(completadosActuales);
      // TODO: Mostrar error más prominente
    }
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
    if (this.rutinaIniciada()) return 'En progreso';
    return 'No iniciada';
  }

  getColorEstado(): string {
    if (this.rutinaCompletada()) return 'success';
    if (this.rutinaIniciada()) return 'primary';
    return 'medium';
  }

  goBack() {
    this.router.navigate(['/entrenado-tabs/rutinas']);
  }
}