import { Component, OnInit, signal, inject, computed, effect, Injector } from '@angular/core';

import {
  IonContent,
  IonModal,
  IonFooter
} from '@ionic/angular/standalone';
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
  bedOutline,
  playCircle,
  repeatOutline,
  close
} from 'ionicons/icons';
import { Rol, Rutina, Ejercicio, RutinaAsignada } from 'gym-library';
import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';
import { RutinaService } from '../../core/services/rutina.service';
import { AuthService } from '../../core/services/auth.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { Router, RouterModule } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { RutinaDetalleModalComponent } from './components/rutina-detalle-modal/rutina-detalle-modal.component';
import { RutinasSemanaComponent } from './components/rutinas-semana/rutinas-semana.component';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';


@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.page.html',
  standalone: true,
  imports: [
    IonContent,
    RouterModule,
    RutinaDetalleModalComponent,
    RutinasSemanaComponent,
    HeaderTabsComponent
  ],
})
export class RutinasPage implements OnInit {
  private rutinaService = inject(RutinaService);
  private authService = inject(AuthService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private router = inject(Router);
  private navCtrl = inject(NavController);
  private injector = inject(Injector);
  private rutinaAsignadaService = inject(RutinaAsignadaService);

  // Señal para todas las rutinas
  private todasLasRutinas = signal<Rutina[]>([]);

  // Estado del modal (ya no se usa, pero mantenemos por compatibilidad)
  readonly modalAbierto = signal(false);
  readonly rutinaSeleccionada = signal<any>(null);
  readonly esFuturoSeleccionado = signal<boolean>(false);

  // Computed para rutinas del entrenado actual
  rutinasAsignadas = computed(() => {
    const currentUser = this.authService.currentUser();
    const userId = currentUser?.uid;
    if (!userId) return [];

    const rutinas = this.todasLasRutinas();
    const entrenado = this.entrenadoService.getEntrenado(userId)();

    if (!rutinas.length || !entrenado?.rutinasAsignadasIds) return [];

    // Filtrar rutinas habilitadas para este entrenado
    return rutinas.filter(rutina => entrenado.rutinasAsignadasIds!.includes(rutina.id));
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
      bedOutline,
      playCircle
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
    const rutinasOrganizadas: { [key: string]: { fecha: Date; rutinas: any[]; diaCorto: string; esHoy: boolean; esFuturo: boolean; } } = {};

    const rutinasAsignadas = this.rutinasAsignadas(); // Estas son las Rutinas completas
    const currentUser = this.authService.currentUser();
    const entrenadoId = currentUser?.uid;
    const asignaciones = this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(entrenadoId || '')();

    fechas.forEach(fecha => {
      // ... díaSemana, diaCorto, fechaKey ...
      const diaSemanaIndex = fecha.getDay();
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const diasSemanaSinTilde = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

      const diaSemanaLabel = diasSemana[diaSemanaIndex];
      const diaSemanaNormalizado = diasSemanaSinTilde[diaSemanaIndex];

      // ... inicializar rutinasOrganizadas ...
      const diaCorto = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemanaIndex];
      const fechaKey = fecha.toISOString().split('T')[0];

      if (!rutinasOrganizadas[fechaKey]) {
        const esHoyCheck = fecha.toDateString() === hoy.toDateString();
        rutinasOrganizadas[fechaKey] = {
          fecha: new Date(fecha),
          rutinas: [],
          diaCorto,
          esHoy: esHoyCheck,
          esFuturo: !esHoyCheck && fecha.getTime() > hoy.getTime()
        };
      }

      // Filtrar asignaciones para ESTE día específico
      const asignacionesDelDia = asignaciones.filter((asig: RutinaAsignada) => {
        if (!asig.diaSemana) return false;
        const asigDiaNormalizado = asig.diaSemana.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return asigDiaNormalizado === diaSemanaNormalizado;
      });

      // Mapear las asignaciones a los objetos Rutina correspondientes
      asignacionesDelDia.forEach((asig: RutinaAsignada) => {
        const rutinaCompleta = rutinasAsignadas.find(r => r.id === asig.rutinaId);
        if (rutinaCompleta) {
          rutinasOrganizadas[fechaKey].rutinas.push(rutinaCompleta);
        }
      });
    });

    // Convertir a array y ordenar por fecha
    return Object.values(rutinasOrganizadas).sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  });

  /**
   * Abre el modal con los detalles de la rutina
   */
  abrirDetalles(eventData: { rutina: any, esFuturo: boolean }): void {
    this.rutinaSeleccionada.set(eventData.rutina);
    this.esFuturoSeleccionado.set(eventData.esFuturo);
    this.modalAbierto.set(true);
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
    // Si el modal está abierto, lo cerramos
    if (this.modalAbierto()) {
      this.cerrarModal();

      setTimeout(() => {
        this.router.navigateByUrl(`/rutina-progreso/${rutina.id}`)
          .catch(err => console.error('Error ruteando:', err));
      }, 350);
    } else {
      this.router.navigateByUrl(`/rutina-progreso/${rutina.id}`)
        .catch(err => console.error('Error ruteando:', err));
    }
  }

  iniciarEntrenamientoDirecto(event: Event, rutina: any) {
    event.stopPropagation();
    this.router.navigateByUrl(`/rutina-progreso/${rutina.id}`)
      .catch(err => console.error('Error ruteando:', err));
  }

}
