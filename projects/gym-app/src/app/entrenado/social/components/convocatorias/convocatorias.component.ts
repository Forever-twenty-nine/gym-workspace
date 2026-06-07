import { Component, inject, computed, signal, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  add, closeOutline, handRightOutline, handRight, trashOutline, 
  timeOutline, personOutline, peopleOutline
} from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { ConvocatoriaService } from '../../../../core/services/convocatoria.service';
import { Convocatoria } from 'gym-library';
import { ConvocatoriaModalComponent } from './convocatoria-modal/convocatoria-modal.component';

@Component({
  selector: 'app-convocatorias',
  templateUrl: './convocatorias.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    ConvocatoriaModalComponent
  ]
})
export class ConvocatoriasComponent {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private convocatoriaService = inject(ConvocatoriaService);
  private router = inject(Router);

  @Input() showHeader = true;
  @Input() renderCircles = true;

  @HostBinding('class.contents') 
  get isNaked() { return !this.showHeader; }

  readonly currentUserSignal = this.authService.currentUser;

  // Modal state (stories click → centered modal)
  selectedConvocatoria = signal<Convocatoria | null>(null);
  isModalOpen = signal(false);

  // Obtener convocatorias de Firestore filtradas y ordenadas (con vencimiento)
  convocatoriasActivas = computed(() => {
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
          const endTraining = new Date(c.fechaEntrenamiento);
          const [hours, minutes] = c.horaFin.split(':').map(Number);
          endTraining.setHours(hours, minutes, 0, 0);

          const expirationTime = new Date(endTraining.getTime() + 2 * 60 * 60 * 1000);
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

  constructor() {
    addIcons({ 
      add, closeOutline, handRightOutline, handRight, trashOutline, 
      timeOutline, personOutline, peopleOutline
    });
  }

  irACreaciones() {
    this.router.navigate(['/entrenado-tabs/creaciones']);
  }

  openModal(c: Convocatoria) {
    this.selectedConvocatoria.set(c);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    // allow exit animation then clear
    setTimeout(() => this.selectedConvocatoria.set(null), 280);
  }

  onModalDeleted(_id: string) {
    this.closeModal();
  }

  getUsuarioName(uid: string): string {
    return this.userService.getUserByUid(uid)()?.nombre || 'Atleta';
  }

  getUsuarioPhoto(uid: string): string | null {
    return this.userService.getUserByUid(uid)()?.photoURL || null;
  }

  // Label shown under story circle (first name, truncated)
  getStoryLabel(c: Convocatoria): string {
    const full = this.getUsuarioName(c.creadorId);
    const first = full.split(' ')[0] || full;
    return first.length > 9 ? first.substring(0, 8) + '…' : first;
  }

  // Tiny time hint inside story circle (hora or relative day)
  getStoryTimeHint(c: Convocatoria): string {
    const fecha = new Date(c.fechaEntrenamiento);
    const hoy = new Date();
    if (fecha.toDateString() === hoy.toDateString()) {
      return c.horaInicio;
    }
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);
    if (fecha.toDateString() === manana.toDateString()) {
      return 'mañ';
    }
    return fecha.toLocaleDateString('es-ES', { day: 'numeric' });
  }
}
