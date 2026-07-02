import { Component, inject, signal, computed } from '@angular/core';
import {
  IonContent, IonSegment, IonSegmentButton, IonLabel, IonHeader,
  SegmentCustomEvent, ModalController, ToastController, IonToolbar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { BackgroundComponent } from '../../shared/components/background/background.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { MatchService } from '../../core/services/match.service';

import { DescubrirTabComponent } from './components/descubrir-tab/descubrir-tab.component';
import { MutualMatchOverlayComponent } from './components/mutual-match-overlay/mutual-match-overlay.component';
import { FeedTabComponent } from './components/para-ti-tab/feed-tab/feed-tab.component';
import { ParaTiTabComponent } from './components/para-ti-tab/para-ti-tab.component';
import { ChatDetailModalComponent } from '../../shared/components/chat/chat-detail-modal/chat-detail-modal.component';

import { Convocatoria, Desafio } from 'gym-library';
import { MatchActual } from '../../core/types/descubrir.types';

import { ConvocatoriaService } from '../../core/services/convocatoria.service';
import { DesafioService } from '../../core/services/desafio.service';
import { StoriesComponent, StoryDisplayItem } from './components/stories/stories.component';
import { ConvocatoriaModalStoriesComponent } from './components/para-ti-tab/convocatoria-modal-stories/convocatoria-modal-stories.component';
import { DesafioModalStoriesComponent } from './components/para-ti-tab/desafio-modal-stories/desafio-modal-stories.component';

@Component({
  selector: 'app-social',
  templateUrl: './social.page.html',
  standalone: true,
  imports: [IonToolbar, 
    CommonModule,
    IonContent,
    IonSegment, IonSegmentButton, IonLabel,
    DescubrirTabComponent,
    MutualMatchOverlayComponent,
    FeedTabComponent,
    ParaTiTabComponent,
    IonHeader,
    BackgroundComponent,
    StoriesComponent,
    ConvocatoriaModalStoriesComponent,
    DesafioModalStoriesComponent
  ]
})
export class SocialPage {
  private authService      = inject(AuthService);
  private userService      = inject(UserService);
  private entrenadoService = inject(EntrenadoService);
  private matchService     = inject(MatchService);
  private modalCtrl        = inject(ModalController);
  private toastCtrl        = inject(ToastController);

  readonly currentUserSignal = this.authService.currentUser;

  selectedTab = signal<'para-ti' | 'siguiendo' | 'descubrir'>('para-ti');

  // ─── Descubrir tab ──────────────────────────────────────────────────────────

  /** Perfil Entrenado del usuario autenticado. */
  readonly currentEntrenado = computed(() => {
    const user = this.currentUserSignal();
    if (!user) return null;
    return this.entrenadoService.getEntrenado(user.uid)();
  });

  readonly tarjetas = computed(() => {
    const curr  = this.currentEntrenado();
    const gymId = this.currentUserSignal()?.gimnasioId;
    if (!curr || !gymId) return [];
    return this.matchService.getTarjetasDescubrir(curr, gymId)();
  });

  /** Índice local para avanzar visualmente antes de que llegue la actualización de Firestore */
  currentIndex = signal<number>(0);

  /** IDs de tarjetas que ya hemos interactuado en esta sesión localmente */
  localSwipedIds = signal<Set<string>>(new Set());

  /** Tarjeta actualmente en pantalla (o null si el mazo está agotado). */
  readonly tarjetaActiva = computed(() => {
    const list = this.tarjetas();
    const localSwipes = this.localSwipedIds();
    
    // Filtrar localmente las tarjetas que ya pasamos/chocamos en esta sesión
    const filteredList = list.filter(t => !localSwipes.has(t.data.id));
    
    // Como siempre filtramos localmente, la siguiente tarjeta siempre es la 0
    return filteredList.length > 0 ? filteredList[0] : null;
  });

  /** Foto de perfil del usuario autenticado. */
  readonly currentUserPhoto = computed(() =>
    this.currentUserSignal()?.photoURL ?? null
  );

  /** Datos del match mutuo para el popup de éxito (null = popup cerrado). */
  matchActual = signal<MatchActual | null>(null);

  // ─── Acciones Descubrir ─────────────────────────────────────────────────────

  /** El usuario descartó la tarjeta. Registra el pass en DB. */
  pasarTarjeta(): void { 
    const user   = this.currentUserSignal();
    const active = this.tarjetaActiva();
    if (!user || !active) return;
    
    const targetUserId = active.data.id;
    
    // Añadimos al filtro local inmediatamente para avanzar a la siguiente tarjeta sin saltos
    const currentSet = new Set(this.localSwipedIds());
    currentSet.add(targetUserId);
    this.localSwipedIds.set(currentSet);

    // Guardar en base de datos como no-interés (esInteres: false)
    this.matchService.registrarInteres(user.uid, targetUserId, active.tipo, false).catch(e => {
        console.error('Error al registrar rechazo:', e);
    });
  }

  /** El usuario presionó "Chocar los 5": registra el interés y, si hay match, muestra el popup. */
  async chocarLos5(): Promise<void> {
    const user   = this.currentUserSignal();
    const active = this.tarjetaActiva();
    if (!user || !active) return;

    let targetUserId = '';
    let referenciaId: string | undefined;

    targetUserId = active.data.id;

    // Añadimos al filtro local inmediatamente para avanzar a la siguiente tarjeta sin saltos
    const currentSet = new Set(this.localSwipedIds());
    currentSet.add(targetUserId);
    this.localSwipedIds.set(currentSet);

    try {
      const isMatch = await this.matchService.registrarInteres(
        user.uid,
        targetUserId,
        active.tipo,
        true, // esInteres
        referenciaId
      );

      if (isMatch) {
        const partnerProfile = this.userService.getUserByUid(targetUserId)();
        const partnerName    = partnerProfile?.nombre ?? 'Atleta';
        const mensaje        = this.matchService.buildMatchPopupMessage(active.tipo, active, partnerName);

        this.matchActual.set({
          partnerId:    targetUserId,
          partnerName,
          partnerPhoto: partnerProfile?.photoURL ?? null,
          tipo:         active.tipo,
          mensaje
        });
      }
    } catch (e) {
      console.error('Error al registrar interés:', e);
      const toast = await this.toastCtrl.create({
        message:  'No se pudo registrar tu interés. Intenta nuevamente.',
        duration: 3000,
        position: 'bottom',
        cssClass: 'premium-toast'
      });
      await toast.present();
    }
  }

  /** Abre el chat privado con el partner del match y cierra el popup. */
  async iniciarChatPrivado(): Promise<void> {
    const match = this.matchActual();
    if (!match) return;

    const partnerId = match.partnerId;
    this.cerrarMatch();

    const modal = await this.modalCtrl.create({
      component: ChatDetailModalComponent,
      componentProps: { otherUserId: partnerId },
      cssClass: 'premium-modal'
    });
    await modal.present();
  }

  /** Cierra el popup de match mutuo. */
  cerrarMatch(): void {
    this.matchActual.set(null);
  }

  /** Avanza al siguiente elemento del mazo una vez que la animación CSS termina. */
  onCardTransitionEnd(): void {
    // La tarjeta ya fue removida del array visual mediante localSwipedIds inmediatamente al hacer click.
    // No necesitamos hacer nada aquí.
  }

  // ─── Stories logic moved from para-ti-tab ──────────────────────────────────
  private readonly convocatoriaService = inject(ConvocatoriaService);
  private readonly desafioService = inject(DesafioService);

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
        const t = c.fechaCreacion ? new Date(c.fechaCreacion) : new Date(c.fechaEntrenamiento);
        return { type: 'convocatoria' as const, data: c, time: t };
      });

    const ocultos = this.ocultadosDesafios();
    const des = this.desafioService.getDesafiosForGym(gymId)()
      .filter(d => d.activo && new Date(d.fechaVencimiento) > now && !ocultos.includes(d.id))
      .map(d => ({ type: 'desafio' as const, data: d, time: d.fechaCreacion ? new Date(d.fechaCreacion) : new Date(d.fechaVencimiento) }));

    const items = [...convos, ...des];
    // Ordenar por fecha de creación descendente (las más nuevas primero)
    items.sort((a, b) => b.time.getTime() - a.time.getTime());

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

  segmentChanged(event: SegmentCustomEvent) {
    const val = event.detail.value as 'para-ti' | 'siguiendo' | 'descubrir' | undefined;
    if (val) this.selectedTab.set(val);
  }
}
