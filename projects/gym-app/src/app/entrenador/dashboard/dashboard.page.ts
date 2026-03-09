import { Component, OnInit, inject, computed, Signal } from '@angular/core';
import { IonContent, IonCard, IonCardContent, IonIcon, IonAvatar, IonList, IonItem, IonLabel, IonGrid, IonRow, IonCol, IonToolbar, IonHeader, IonTitle, IonCardHeader, IonCardTitle, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, fitnessOutline, statsChartOutline, calendarOutline, chevronForwardOutline, barbellOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { RutinaService } from '../../core/services/rutina.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { UserService } from '../../core/services/user.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { Entrenado } from 'gym-library';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';
import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonCardContent,
    IonIcon,
    IonAvatar,
    IonList,
    IonItem,
    IonLabel,
    IonGrid,
    IonRow,
    IonCol,
    HeaderTabsComponent,
    IonCardHeader,
    IonCardTitle,
    IonButton
  ],
})
export class DashboardPage implements OnInit {
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private rutinaService = inject(RutinaService);
  private ejercicioService = inject(EjercicioService);
  private userService = inject(UserService);
  private entrenadorService = inject(EntrenadorService);
  private rutinaAsignadaService = inject(RutinaAsignadaService);

  entrenadorData = computed(() => {
    const uid = this.authService.currentUser()?.uid;
    return uid ? this.entrenadorService.getEntrenadorById(uid)() : null;
  });

  entrenador = computed(() => {
    const user = this.authService.currentUser();
    return user ? { nombre: user.nombre || 'Entrenador', plan: user.plan ? `Plan ${user.plan}` : 'Plan Básico' } : { nombre: 'Entrenador', plan: 'Plan Básico' };
  });

  entrenadosAsociados: Signal<Entrenado[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadoService.entrenados().filter(e => e.entrenadoresId?.includes(entrenadorId)) : [];
  });

  rutinasCreadasCount = computed(() => this.entrenadorData()?.rutinasCreadasIds?.length || 0);
  ejerciciosCreadosCount = computed(() => this.entrenadorData()?.ejerciciosCreadasIds?.length || 0);
  entrenadosAsignadosCount = computed(() => this.entrenadorData()?.entrenadosAsignadosIds?.length || 0);

  entrenadosConRutinasProximas = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return [];

    const entrenados = this.entrenadosAsociados();
    const asignaciones = this.rutinaAsignadaService.getRutinasAsignadasByEntrenador(entrenadorId)();

    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + 3);
    limite.setHours(23, 59, 59, 999);

    const proximoMapa = new Map<string, any>();

    for (const entrenado of entrenados) {
      const asignacionesEntrenado = asignaciones.filter(a => a.entrenadoId === entrenado.id && a.activa);

      for (const asig of asignacionesEntrenado) {
        const fechaObj = this.calcularFecha(asig, hoy);
        if (fechaObj && fechaObj >= hoy && fechaObj <= limite) {
          const existing = proximoMapa.get(entrenado.id!);
          if (!existing || fechaObj < existing.proximaFecha) {
            const rutina = this.rutinaService.rutinas().find(r => r.id === asig.rutinaId);
            proximoMapa.set(entrenado.id!, {
              ...entrenado,
              proximaFecha: fechaObj,
              nombreRutina: rutina?.nombre || 'Rutina',
              diaTexto: this.getDiaTexto(fechaObj, hoy)
            });
          }
        }
      }
    }

    return Array.from(proximoMapa.values()).sort((a, b) => a.proximaFecha.getTime() - b.proximaFecha.getTime());
  });

  constructor() {
    addIcons({ peopleOutline, fitnessOutline, statsChartOutline, calendarOutline, chevronForwardOutline, barbellOutline });
    // Inicializar listeners para asegurar que los datos estén disponibles
    this.entrenadorService.initializeListener();
    this.entrenadoService.initializeListener();
    this.rutinaService.rutinas; // Trigger listener getter
    this.ejercicioService.ejercicios; // Trigger listener getter
    this.rutinaAsignadaService.getRutinasAsignadas(); // Trigger listener
  }

  private calcularFecha(asig: any, hoy: Date): Date | null {
    if (asig.fechaEspecifica) return new Date(asig.fechaEspecifica);
    if (asig.diaSemana) {
      const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const targetDow = dias.indexOf(asig.diaSemana.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      if (targetDow === -1) return null;
      const ref = new Date(hoy);
      const diff = (targetDow - ref.getDay() + 7) % 7;
      const proxima = new Date(ref);
      proxima.setDate(ref.getDate() + diff);
      proxima.setHours(0, 0, 0, 0);
      return proxima;
    }
    return null;
  }

  private getDiaTexto(fecha: Date, hoy: Date): string {
    const diff = Math.floor((fecha.getTime() - new Date(hoy).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    if (diff === 2) return 'Pasado mañana';
    return fecha.toLocaleDateString('es-ES', { weekday: 'long' });
  }
  ngOnInit(): void {
    // ...existing code...
  }

  getUserName(userId: string): string {
    const users = this.userService.users();
    const user = users.find(u => u.uid === userId);
    return user ? user.nombre || 'Sin nombre' : 'Usuario no encontrado';
  }


}
