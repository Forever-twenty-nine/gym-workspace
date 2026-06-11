import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { ConvocatoriaService } from '../../../../core/services/convocatoria.service';
import { DesafioService } from '../../../../core/services/desafio.service';
import { StoriesComponent, StoryDisplayItem } from '../stories/stories.component';
import { ConvocatoriaModalStoriesComponent } from './convocatoria-modal-stories/convocatoria-modal-stories.component';
import { DesafioModalStoriesComponent } from './desafio-modal-stories/desafio-modal-stories.component';
import { FeedTabComponent } from './feed-tab/feed-tab.component';
import { Convocatoria, Desafio } from 'gym-library';

@Component({
  selector: 'app-para-ti-tab',
  standalone: true,
  imports: [
    CommonModule,
    StoriesComponent,
    ConvocatoriaModalStoriesComponent,
    DesafioModalStoriesComponent,
    FeedTabComponent
  ],
  templateUrl: './para-ti-tab.component.html'
})
export class ParaTiTabComponent {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly convocatoriaService = inject(ConvocatoriaService);
  private readonly desafioService = inject(DesafioService);

  readonly currentUserSignal = this.authService.currentUser;

  isConvoModalOpen = signal(false);
  selectedConvocatoria = signal<Convocatoria | null>(null);

  isDesafioModalOpen = signal(false);
  selectedDesafio = signal<Desafio | null>(null);
  ocultadosDesafios = signal<string[]>([]);

  readonly storiesList = computed<StoryDisplayItem[]>(() => {
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

    const ocultos = this.ocultadosDesafios();
    const des = this.desafioService.getDesafiosForGym(gymId)()
      .filter(d => d.activo && new Date(d.fechaVencimiento) > now && !ocultos.includes(d.id))
      .map(d => ({ type: 'desafio' as const, data: d, time: new Date(d.fechaVencimiento) }));

    const items = [...convos, ...des];
    items.sort((a, b) => a.time.getTime() - b.time.getTime());

    return items.map(item => {
      const uid = item.data?.creadorId;
      let photoUrl: string | null = null;
      if (uid) {
        photoUrl = this.userService.getUserByUid(uid)()?.photoURL ?? null;
      }
      if (!photoUrl && item.data) {
        const extra = item.data as { creadorFoto?: string | null };
        photoUrl = extra?.creadorFoto ?? null;
      }

      let timeHint = '';
      if (item.type === 'convocatoria') {
        const c = item.data as Convocatoria;
        const fecha = new Date(c.fechaEntrenamiento);
        if (fecha.toDateString() === now.toDateString()) {
          timeHint = c.horaInicio || '';
        } else {
          const manana = new Date();
          manana.setDate(now.getDate() + 1);
          if (fecha.toDateString() === manana.toDateString()) {
            timeHint = 'mañ';
          } else {
            timeHint = fecha.toLocaleDateString('es-ES', { day: 'numeric' });
          }
        }
      } else {
        const d = item.data as Desafio;
        if (d.fechaVencimiento) {
          const diff = new Date(d.fechaVencimiento).getTime() - Date.now();
          if (diff <= 0) {
            timeHint = 'fin';
          } else {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timeHint = days > 0 ? `${days}d` : `${hours}h`;
          }
        }
      }

      return {
        id: `${item.type}-${item.data?.id ?? ''}`,
        type: item.type,
        label: '',
        photoUrl,
        timeHint,
        esOficial: item.type === 'convocatoria' ? (item.data as Convocatoria).esOficial : undefined,
        esSemanal: item.type === 'convocatoria' ? (item.data as Convocatoria).esSemanal : undefined,
        esCreador: item.type === 'desafio' ? (item.data as Desafio).creadorId === this.currentUserSignal()?.uid : undefined,
        rawStory: item.data
      };
    });
  });

  handleStoryClick(story: StoryDisplayItem) {
    if (story.type === 'convocatoria') {
      this.selectedConvocatoria.set(story.rawStory);
      this.isConvoModalOpen.set(true);
    } else {
      this.selectedDesafio.set(story.rawStory);
      this.isDesafioModalOpen.set(true);
    }
  }

  closeConvoModal() {
    this.isConvoModalOpen.set(false);
    this.selectedConvocatoria.set(null);
  }

  closeDesafioModal() {
    this.isDesafioModalOpen.set(false);
    this.selectedDesafio.set(null);
  }

  onDesafioDeleted(_id: string) {
    this.closeDesafioModal();
  }

  onDesafioPasar(id: string) {
    this.ocultadosDesafios.update(list => [...list, id]);
    this.closeDesafioModal();
  }
}
