import { Component, inject, signal, computed } from '@angular/core';
import {
  IonContent, IonSegment, IonSegmentButton, IonLabel, IonHeader,
  SegmentCustomEvent, ModalController, ToastController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { PageBackgroundComponent } from '../../shared/components/page-background/page-background.component';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { MatchService } from '../../core/services/match.service';

import { DescubrirTabComponent } from './components/descubrir-tab/descubrir-tab.component';
import { MutualMatchOverlayComponent } from './components/mutual-match-overlay/mutual-match-overlay.component';
import { FeedTabComponent } from './components/para-ti-tab/feed-tab/feed-tab.component';
import { ParaTiTabComponent } from './components/para-ti-tab/para-ti-tab.component';
import { ChatDetailModalComponent } from '../../shared/components/chat/chat-detail-modal/chat-detail-modal.component';

import { Plan } from 'gym-library';
import { MatchActual } from '../../core/types/descubrir.types';

@Component({
  selector: 'app-social',
  templateUrl: './social.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonSegment, IonSegmentButton, IonLabel,
    DescubrirTabComponent,
    MutualMatchOverlayComponent,
    FeedTabComponent,
    ParaTiTabComponent,
    IonHeader,
    PageBackgroundComponent
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
  readonly isPremium = computed(() => this.currentUserSignal()?.plan === Plan.PREMIUM);

  selectedTab = signal<'para-ti' | 'siguiendo' | 'descubrir'>('para-ti');

  // ─── Descubrir tab ──────────────────────────────────────────────────────────

  /** Perfil Entrenado del usuario autenticado. */
  readonly currentEntrenado = computed(() => {
    const user = this.currentUserSignal();
    if (!user) return null;
    return this.entrenadoService.getEntrenado(user.uid)();
  });

  /**
   * Mazo completo de tarjetas, calculado en el servicio.
   * Se re-computa automáticamente cuando cambian usuarios, interacciones o entrenados.
   */
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

  segmentChanged(event: SegmentCustomEvent) {
    const val = event.detail.value as 'para-ti' | 'siguiendo' | 'descubrir' | undefined;
    if (val) this.selectedTab.set(val);
  }
}
