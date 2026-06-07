import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { IonContent, IonSegment, IonSegmentButton, IonLabel, IonHeader } from '@ionic/angular/standalone';
import { NgOptimizedImage } from '@angular/common';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

import { ConvocatoriasComponent } from './components/convocatorias/convocatorias.component';
import { DescubrirTabComponent } from './components/descubrir-tab/descubrir-tab.component';
import { FeedTabComponent } from './components/feed-tab/feed-tab.component';
import { DesafiosStoriesComponent } from './components/desafios-stories/desafios-stories.component';

import { ConvocatoriaService } from '../../core/services/convocatoria.service';
import { DesafioService } from '../../core/services/desafio.service';

import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-social',
  templateUrl: './social.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    NgOptimizedImage,
    IonSegment, IonSegmentButton, IonLabel,
    IonIcon,
    ConvocatoriasComponent,
    DescubrirTabComponent,
    FeedTabComponent,
    DesafiosStoriesComponent,
    IonHeader
]
})
export class SocialPage {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private convocatoriaService = inject(ConvocatoriaService);
  private desafioService = inject(DesafioService);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === 'premium');

  selectedTab = signal<'para-ti' | 'siguiendo' | 'descubrir'>('para-ti');

  // Helper to show the unified stories row only when there is something
  hasActiveStories = computed(() => {
    const gymId = this.currentUserSignal()?.gimnasioId;
    if (!gymId) return false;

    const now = new Date();
    const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
    const endOfNextWeek = new Date(startOfToday.getTime() + 7*24*60*60*1000); endOfNextWeek.setHours(23,59,59,999);

    const convos = this.convocatoriaService.convocatorias().filter(c => {
      if (c.gimnasioId !== gymId || !c.activo) return false;
      const d = new Date(c.fechaEntrenamiento);
      if (c.esOficial) return d >= startOfToday && d <= endOfNextWeek;
      const end = new Date(c.fechaEntrenamiento);
      const [h,m] = c.horaFin.split(':').map(Number); end.setHours(h,m,0,0);
      return now < new Date(end.getTime() + 2*60*60*1000);
    });

    const des = this.desafioService.getDesafiosByGimnasio(gymId)().filter(d => d.activo && new Date(d.fechaVencimiento) > now);

    return convos.length > 0 || des.length > 0;
  });

  @ViewChild(ConvocatoriasComponent) private convComp?: ConvocatoriasComponent;
  @ViewChild(DesafiosStoriesComponent) private desComp?: DesafiosStoriesComponent;

  // Combined and sorted by temporal proximity (training time for conv, vencimiento for des)
  combinedStories = computed(() => {
    const convList = this.convComp?.convocatoriasActivas() ?? [];
    const desList = this.desComp?.desafiosActivos() ?? [];

    const items: Array<{ type: 'convocatoria' | 'desafio'; data: any; time: Date }> = [];

    for (const c of convList) {
      const t = new Date(c.fechaEntrenamiento);
      if (c.horaInicio) {
        const parts = c.horaInicio.split(':').map((x: string) => parseInt(x, 10));
        t.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
      }
      items.push({ type: 'convocatoria', data: c, time: t });
    }

    for (const d of desList) {
      items.push({ type: 'desafio', data: d, time: new Date(d.fechaVencimiento) });
    }

    items.sort((a, b) => a.time.getTime() - b.time.getTime());
    return items;
  });

  openStory(story: { type: 'convocatoria' | 'desafio'; data: any; time: Date }) {
    if (story.type === 'convocatoria') {
      this.convComp?.openModal(story.data);
    } else {
      this.desComp?.openModal(story.data);
    }
  }

  getStoryTrack(story: any) {
    return story.type + '-' + (story.data?.id ?? '');
  }

  getUserPhotoForStory(story: any): string | null {
    const uid = story.data?.creadorId;
    if (!uid) return null;
    return this.userService.getUserByUid(uid)()?.photoURL || story.data?.creadorFoto || null;
  }

  getStoryLabel(story: any): string {
    if (story.type === 'convocatoria') {
      const c = story.data;
      const full = this.userService.getUserByUid(c.creadorId)()?.nombre || 'Atleta';
      const first = full.split(' ')[0] || full;
      return first.length > 9 ? first.substring(0, 8) + '…' : first;
    } else {
      const d = story.data;
      if (d.titulo) {
        const t = d.titulo.length > 11 ? d.titulo.slice(0, 10) + '…' : d.titulo;
        return t;
      }
      const name = this.userService.getUserByUid(d.creadorId)()?.nombre || d.creadorNombre || 'Atleta';
      const first = name.split(' ')[0] || name;
      return first.length > 10 ? first.slice(0, 9) + '…' : first;
    }
  }

  getStoryTimeHint(story: any): string {
    if (story.type === 'convocatoria') {
      const c = story.data;
      const fecha = new Date(c.fechaEntrenamiento);
      const hoy = new Date();
      if (fecha.toDateString() === hoy.toDateString()) {
        return c.horaInicio || '';
      }
      const manana = new Date();
      manana.setDate(hoy.getDate() + 1);
      if (fecha.toDateString() === manana.toDateString()) {
        return 'mañ';
      }
      return fecha.toLocaleDateString('es-ES', { day: 'numeric' });
    } else {
      const d = story.data;
      if (!d.fechaVencimiento) return '';
      const diff = new Date(d.fechaVencimiento).getTime() - Date.now();
      if (diff <= 0) return 'fin';
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) return `${days}d`;
      return `${hours}h`;
    }
  }

  constructor() {
    addIcons({ trophyOutline, personOutline });
  }

  segmentChanged(event: any) {
    this.selectedTab.set(event.detail.value);
  }
}
