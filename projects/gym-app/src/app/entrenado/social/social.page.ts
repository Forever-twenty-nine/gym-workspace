import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { IonContent, IonSegment, IonSegmentButton, IonLabel, IonHeader, SegmentCustomEvent } from '@ionic/angular/standalone';
import { blurActiveElement } from '../../core/utils/modal.utils';
import { NgOptimizedImage, CommonModule } from '@angular/common';
import { PageBackgroundComponent } from '../components/page-background/page-background.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

import { ConvocatoriasComponent } from './components/convocatorias/convocatorias.component';
import { DescubrirTabComponent } from './components/descubrir-tab/descubrir-tab.component';
import { FeedTabComponent } from './components/feed-tab/feed-tab.component';
import { DesafiosStoriesComponent } from './components/desafios-stories/desafios-stories.component';

import { ConvocatoriaService } from '../../core/services/convocatoria.service';
import { DesafioService } from '../../core/services/desafio.service';
import { Plan, Convocatoria, Desafio } from 'gym-library';

import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline, personOutline } from 'ionicons/icons';

type StoryItem =
  | { type: 'convocatoria'; data: Convocatoria; time: Date }
  | { type: 'desafio'; data: Desafio; time: Date };

@Component({
  selector: 'app-social',
  templateUrl: './social.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonSegment, IonSegmentButton, IonLabel,
    IonIcon,
    ConvocatoriasComponent,
    DescubrirTabComponent,
    FeedTabComponent,
    DesafiosStoriesComponent,
    IonHeader,
    PageBackgroundComponent
]
})
export class SocialPage {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private convocatoriaService = inject(ConvocatoriaService);
  private desafioService = inject(DesafioService);

  readonly currentUserSignal = this.authService.currentUser;
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === Plan.PREMIUM);

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

    const des = this.desafioService.getDesafiosForGym(gymId)().filter(d => d.activo && new Date(d.fechaVencimiento) > now);

    return convos.length > 0 || des.length > 0;
  });

  @ViewChild(ConvocatoriasComponent) private convComp?: ConvocatoriasComponent;
  @ViewChild(DesafiosStoriesComponent) private desComp?: DesafiosStoriesComponent;

  // Combined stories computed directly from services (safe, no ViewChild dependency inside computed)
  combinedStories = computed<StoryItem[]>(() => {
    const gymId = this.currentUserSignal()?.gimnasioId;
    if (!gymId) return [];

    const now = new Date();
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const endOfNextWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    endOfNextWeek.setHours(23, 59, 59, 999);

    const convos = this.convocatoriaService.getConvocatoriasForGym(gymId)()
      .filter(c => {
        if (c.gimnasioId !== gymId || !c.activo) return false;
        const d = new Date(c.fechaEntrenamiento);
        if (c.esOficial) return d >= startOfToday && d <= endOfNextWeek;

        const end = new Date(c.fechaEntrenamiento);
        const [h, m] = c.horaFin.split(':').map(Number);
        end.setHours(h, m, 0, 0);
        return now < new Date(end.getTime() + 2 * 60 * 60 * 1000);
      })
      .map(c => {
        const t = new Date(c.fechaEntrenamiento);
        if (c.horaInicio) {
          const [hh, mm] = c.horaInicio.split(':').map(n => parseInt(n, 10));
          t.setHours(hh || 0, mm || 0, 0, 0);
        }
        return { type: 'convocatoria' as const, data: c, time: t };
      });

    const des = this.desafioService.getDesafiosForGym(gymId)()
      .filter(d => d.activo && new Date(d.fechaVencimiento) > now)
      .map(d => ({ type: 'desafio' as const, data: d, time: new Date(d.fechaVencimiento) }));

    const items: StoryItem[] = [...convos, ...des];
    items.sort((a, b) => a.time.getTime() - b.time.getTime());
    return items;
  });

  openStory(story: StoryItem) {
    if (story.type === 'convocatoria') {
      this.convComp?.openModal(story.data);
    } else {
      this.desComp?.openModal(story.data);
    }
  }

  getStoryTrack(story: StoryItem): string {
    return `${story.type}-${story.data?.id ?? ''}`;
  }

  getUserPhotoForStory(story: StoryItem): string | null {
    const uid = story.data?.creadorId;
    if (!uid) return null;

    const fromUser = this.userService.getUserByUid(uid)()?.photoURL;
    if (fromUser) return fromUser;

    // Fallback for legacy fields on the entity
    const extra = story.data as { creadorFoto?: string | null };
    return extra?.creadorFoto ?? null;
  }

  getStoryLabel(story: StoryItem): string {
    if (story.type === 'convocatoria') {
      const c = story.data as Convocatoria;
      const full = this.userService.getUserByUid(c.creadorId)()?.nombre || c.creadorNombre || 'Atleta';
      const first = full.split(' ')[0] || full;
      return first.length > 9 ? first.substring(0, 8) + '…' : first;
    } else {
      const d = story.data as Desafio;
      if (d.titulo) {
        const t = d.titulo.length > 11 ? d.titulo.slice(0, 10) + '…' : d.titulo;
        return t;
      }
      const name = this.userService.getUserByUid(d.creadorId)()?.nombre || d.creadorNombre || 'Atleta';
      const first = name.split(' ')[0] || name;
      return first.length > 10 ? first.slice(0, 9) + '…' : first;
    }
  }

  getStoryTimeHint(story: StoryItem): string {
    if (story.type === 'convocatoria') {
      const c = story.data as Convocatoria;
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
      const d = story.data as Desafio;
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

  segmentChanged(event: SegmentCustomEvent) {
    const val = event.detail.value as 'para-ti' | 'siguiendo' | 'descubrir' | undefined;
    if (val) this.selectedTab.set(val);
  }
}
