import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonLabel,
  IonSegment,
  IonSegmentButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  calendarOutline, timeOutline, personOutline, handRightOutline 
} from 'ionicons/icons';
import { ConvocatoriaService } from '../../core/services/convocatoria.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { Convocatoria } from 'gym-library';
import { ConvocatoriaListComponent } from './components/convocatoria-list/convocatoria-list.component';
import { AgendaHelpPopoverComponent } from './components/agenda-help-popover/agenda-help-popover.component';
import { BackgroundComponent } from '../../shared/components/background/background.component';


@Component({
  selector: 'app-gimnasio-agenda',
  templateUrl: './agenda.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    ConvocatoriaListComponent,
    AgendaHelpPopoverComponent,
    BackgroundComponent
  ]
})
export class AgendaPage implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private convocatoriaService = inject(ConvocatoriaService);

  readonly currentUserSignal = this.authService.currentUser;
  
  // Segment: 'oficial' | 'atletas'
  segmentoActivo = signal<'oficial' | 'atletas'>('oficial');

  // Convocatorias del gimnasio filtradas (desde hoy hasta los próximos 7 días)
  convocatoriasGimnasio = computed(() => {
    const list = this.convocatoriaService.convocatorias();
    const user = this.currentUserSignal();
    if (!user || !user.gimnasioId) return [];

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfNextWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    endOfNextWeek.setHours(23, 59, 59, 999);

    return list
      .filter(c => {
        if (c.gimnasioId !== user.gimnasioId) return false;
        if (!c.activo) return false;

        const dateEntrenamiento = new Date(c.fechaEntrenamiento);
        return dateEntrenamiento >= startOfToday && dateEntrenamiento <= endOfNextWeek;
      })
      .sort((a, b) => {
        const dateA = new Date(a.fechaEntrenamiento).getTime();
        const dateB = new Date(b.fechaEntrenamiento).getTime();
        if (dateA !== dateB) return dateA - dateB;

        return a.horaInicio.localeCompare(b.horaInicio);
      });
  });

  // Convocatorias oficiales (creadas por entrenadores/gimnasio)
  convocatoriasOficiales = computed(() => {
    return this.convocatoriasGimnasio().filter(c => c.esOficial);
  });

  // Convocatorias propuestas por atletas
  convocatoriasAtletas = computed(() => {
    return this.convocatoriasGimnasio().filter(c => !c.esOficial);
  });

  readonly mappedConvocatoriasOficiales = computed(() => {
    return this.convocatoriasOficiales().map(c => this.mapConvocatoriaToListItem(c));
  });

  readonly mappedConvocatoriasAtletas = computed(() => {
    return this.convocatoriasAtletas().map(c => this.mapConvocatoriaToListItem(c));
  });

  private mapConvocatoriaToListItem(c: Convocatoria) {
    return {
      convocatoria: c,
      creadorName: this.getUsuarioName(c.creadorId),
      creadorPhoto: this.getUsuarioPhoto(c.creadorId),
      fechaFormateada: this.formatearFechaEntrenamiento(c.fechaEntrenamiento),
      asistentes: c.interesados.map(intId => ({
        name: this.getUsuarioName(intId),
        photo: this.getUsuarioPhoto(intId)
      }))
    };
  }

  constructor() {
    addIcons({ 
      calendarOutline, timeOutline, personOutline, handRightOutline 
    });
  }

  ngOnInit() {
    // Escuchar cambios de usuarios para asegurar que se resuelvan nombres
    this.userService.users;
  }

  cambiarSegmento(event: any) {
    this.segmentoActivo.set(event.detail.value);
  }

  formatearFechaEntrenamiento(fechaVal: any): string {
    if (!fechaVal) return '';
    const fecha = new Date(fechaVal);
    const hoy = new Date();
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);

    if (fecha.toDateString() === hoy.toDateString()) {
      return 'Hoy';
    } else if (fecha.toDateString() === manana.toDateString()) {
      return 'Mañana';
    } else {
      const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
      const str = fecha.toLocaleDateString('es-ES', opciones);
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  }

  getUsuarioName(uid: string): string {
    return this.userService.getUserByUid(uid)()?.nombre || 'Atleta';
  }

  getUsuarioPhoto(uid: string): string | null {
    return this.userService.getUserByUid(uid)()?.photoURL || null;
  }
}
