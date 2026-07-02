import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  add, calendarOutline, timeOutline, personOutline, 
  trashOutline, handRightOutline, checkmarkCircleOutline,
  chevronDownOutline, chevronUpOutline
} from 'ionicons/icons';
import { ConvocatoriaService } from '../../core/services/convocatoria.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { Convocatoria, Rol } from 'gym-library';

import { CrearAgendaModalComponent } from './components/crear-agenda-modal/crear-agenda-modal.component';
import { BackgroundComponent } from '../../shared/components/background/background.component';
import { ConvocatoriaListComponent } from './components/convocatoria-list/convocatoria-list.component';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    CrearAgendaModalComponent,
    BackgroundComponent,
    ConvocatoriaListComponent
  ]
})
export class AgendaPage implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private convocatoriaService = inject(ConvocatoriaService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  readonly currentUserSignal = this.authService.currentUser;
  
  // Segment: 'oficial' | 'atletas'
  segmentoActivo = signal<'oficial' | 'atletas'>('oficial');
  isCrearModalOpen = signal(false);

  // Convocatorias del gimnasio filtradas por tipo
  convocatoriasGimnasio = computed(() => {
    const list = this.convocatoriaService.convocatorias();
    const user = this.currentUserSignal();
    if (!user || !user.gimnasioId) return [];

    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfNextWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    endOfNextWeek.setHours(23, 59, 59, 999);

    return list
      .filter(c => {
        if (c.gimnasioId !== user.gimnasioId) return false;
        if (!c.activo) return false;

        if (c.esOficial) {
          const dateEntrenamiento = new Date(c.fechaEntrenamiento);
          return dateEntrenamiento >= startOfToday && dateEntrenamiento <= endOfNextWeek;
        } else {
          // No mostrar convocatorias de atletas pasadas hace más de 24 horas para mantener limpia la agenda
          const endTraining = new Date(c.fechaEntrenamiento);
          const [hours, minutes] = c.horaFin.split(':').map(Number);
          endTraining.setHours(hours, minutes, 0, 0);

          const expirationTime = new Date(endTraining.getTime() + 24 * 60 * 60 * 1000);
          return now < expirationTime;
        }
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

  mappedConvocatoriasOficiales = computed(() => {
    return this.convocatoriasOficiales().map(c => ({
      convocatoria: c,
      creadorName: c.titulo || 'Sesión de Entrenamiento',
      creadorPhoto: null,
      fechaFormateada: this.formatearFechaEntrenamiento(c.fechaEntrenamiento),
      asistentes: c.interesados.map(uid => ({
        name: this.getUsuarioName(uid),
        photo: this.getUsuarioPhoto(uid)
      }))
    }));
  });

  mappedConvocatoriasAtletas = computed(() => {
    return this.convocatoriasAtletas().map(c => ({
      convocatoria: c,
      creadorName: this.getUsuarioName(c.creadorId),
      creadorPhoto: this.getUsuarioPhoto(c.creadorId),
      fechaFormateada: this.formatearFechaEntrenamiento(c.fechaEntrenamiento),
      asistentes: c.interesados.map(uid => ({
        name: this.getUsuarioName(uid),
        photo: this.getUsuarioPhoto(uid)
      }))
    }));
  });

  constructor() {
    addIcons({ 
      add, calendarOutline, timeOutline, personOutline, 
      trashOutline, handRightOutline, checkmarkCircleOutline,
      chevronDownOutline, chevronUpOutline
    });
  }

  ngOnInit() {
    // Escuchar cambios de usuarios para asegurar que se resuelvan nombres
    this.userService.users;
  }

  abrirCrearModal() {
    this.isCrearModalOpen.set(true);
  }

  cerrarCrearModal() {
    this.isCrearModalOpen.set(false);
  }

  onSesionSaved() {
    // Firestore actualiza en tiempo real
  }

  cambiarSegmento(event: any) {
    this.segmentoActivo.set(event.detail.value);
  }

  async confirmarEliminacion(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar entrenamiento',
      message: '¿Estás seguro de que deseas eliminar esta sesión de la agenda?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.convocatoriaService.delete(id);
              this.showToast('Entrenamiento eliminado con éxito', 'success');
            } catch (e) {
              console.error(e);
              this.showToast('Error al eliminar la sesión', 'danger');
            }
          }
        }
      ],
      cssClass: 'premium-alert'
    });
    await alert.present();
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

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
      cssClass: 'premium-toast'
    });
    await toast.present();
  }
}
