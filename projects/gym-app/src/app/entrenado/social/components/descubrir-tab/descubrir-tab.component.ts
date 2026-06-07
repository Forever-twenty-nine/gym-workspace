import { Component, inject, computed, signal, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton, ModalController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  trophyOutline, barbellOutline, sparklesOutline,
  close, handRight, sparkles, chatbubbles, person
} from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { EntrenadoService } from '../../../../core/services/entrenado.service';
import { MatchService } from '../../../../core/services/match.service';
import { DesafioService } from '../../../../core/services/desafio.service';
import { UserService } from '../../../../core/services/user.service';
import { MatchCardComponent } from '../match-card/match-card.component';
import { ChatDetailModalComponent } from '../chat/chat-detail-modal/chat-detail-modal.component';

@Component({
  selector: 'app-descubrir-tab',
  templateUrl: './descubrir-tab.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    IonButton,
    MatchCardComponent
  ]
})
export class DescubrirTabComponent {
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private matchService = inject(MatchService);
  private desafioService = inject(DesafioService);
  private userService = inject(UserService);
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  currentIndex = signal<number>(0);
  animacionCard = signal<string>('scale-100 opacity-100 translate-x-0 rotate-0');
  matchActual = signal<any>(null); // Datos del match mutuo para popup

  currentEntrenado = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return null;
    return this.entrenadoService.getEntrenado(user.uid)();
  });

  // Enriched with photoURL so that photos are available as soon as UserService has data.
  // Reading userService.users() here creates the dependency so these (and downstream tarjetas) re-compute when users load.
  sugerenciasAfinidad = computed(() => {
    const curr = this.currentEntrenado();
    if (!curr) return [];
    const base = this.matchService.getSugerenciasAfinidad(curr)();
    const _ = this.userService.users(); // dependency for reactivity on first load
    return base.map(u => ({
      ...u,
      photoURL: this.userService.getUserByUid(u.id)()?.photoURL || null
    }));
  });

  sugerenciasHorario = computed(() => {
    const curr = this.currentEntrenado();
    if (!curr) return [];
    const base = this.matchService.getSugerenciasHorario(curr)();
    const _ = this.userService.users(); // dependency for reactivity on first load
    return base.map(u => ({
      ...u,
      photoURL: this.userService.getUserByUid(u.id)()?.photoURL || null
    }));
  });

  desafiosActivos = computed(() => {
    const gimnasioId = this.authService.currentUser()?.gimnasioId;
    if (!gimnasioId) return [];
    return this.desafioService.getDesafiosByGimnasio(gimnasioId)();
  });

  // Mazo combinado de tarjetas (Afinidad, Horario, Desafíos)
  tarjetas = computed(() => {
    const curr = this.currentEntrenado();
    if (!curr) return [];

    // Note: the enriched sugerencias* already read users(), so this list will re-compute when users arrive.
    // Obtener interacciones existentes del usuario
    const interactions = this.matchService.getInteractions(curr.id)();
    const interactedIds = new Set(interactions.map(i => i.referenciaId || i.usuarioDestinoId));

    const list: Array<{ id: string, tipo: 'horario' | 'desafio' | 'afinidad', data: any, photoURL?: string | null }> = [];

    // 1. Sugerencias de Horario (already enriched with photoURL in the suggestion computed)
    const horario = this.sugerenciasHorario();
    for (const u of horario) {
      if (!interactedIds.has(u.id)) {
        list.push({ id: `horario-${u.id}`, tipo: 'horario', data: u, photoURL: u.photoURL ?? null });
      }
    }

    // 2. Sugerencias de Afinidad (already enriched)
    const afinidad = this.sugerenciasAfinidad();
    for (const u of afinidad) {
      if (!interactedIds.has(u.id)) {
        list.push({ id: `afinidad-${u.id}`, tipo: 'afinidad', data: u, photoURL: u.photoURL ?? null });
      }
    }

    // 3. Desafíos creados por otros
    const desafios = this.desafiosActivos();
    for (const d of desafios) {
      if (d.creadorId !== curr.id && !interactedIds.has(d.id)) {
        list.push({ id: `desafio-${d.id}`, tipo: 'desafio', data: d });
      }
    }

    return list;
  });

  // Tarjeta que se muestra actualmente en la pila
  tarjetaActiva = computed(() => {
    const list = this.tarjetas();
    const idx = this.currentIndex();
    return idx < list.length ? list[idx] : null;
  });

  currentUserPhoto = computed(() => {
    return this.authService.currentUser()?.photoURL || null;
  });

  partnerPhoto = computed(() => {
    const match = this.matchActual();
    return match ? match.partnerPhoto : null;
  });

  matchMessage = computed(() => {
    const match = this.matchActual();
    return match ? match.mensaje : '';
  });

  constructor() {
    // Ensure UserService listener starts early
    this.userService.users;

    // When users populate (first snapshot after entering the tab), aggressively refresh the current card
    // so the photo appears even on the very first render/iteration of Descubrir.
    effect(() => {
      const users = this.userService.users();
      if (users.length > 0) {
        // Rebuild the list (the enriched sugerencias* + tarjetas depend on users())
        this.tarjetas();

        // Always poke currentIndex on first users load. This guarantees that tarjetaActiva()
        // re-reads from the now photo-enriched list and the template binding updates the card.
        this.currentIndex.update(i => i);

        // Force view check so the card and @if react immediately.
        this.cdr.markForCheck();
      }
    });

    addIcons({
      trophyOutline, barbellOutline, sparklesOutline,
      close, handRight, sparkles, chatbubbles, person
    });
  }

  pasar() {
    // Animación de deslizamiento a la izquierda
    this.animacionCard.set('-translate-x-full opacity-0 scale-95 rotate-[-10deg] transition-all duration-300');
    setTimeout(() => {
      this.currentIndex.update(idx => idx + 1);
      this.animacionCard.set('translate-y-4 opacity-0 scale-95 rotate-0');
      setTimeout(() => {
        this.animacionCard.set('scale-100 opacity-100 translate-x-0 rotate-0 transition-all duration-300');
      }, 50);
    }, 300);
  }

  async chocarLos5() {
    const user = this.authService.currentUser();
    const active = this.tarjetaActiva();
    if (!user || !active) return;

    let targetUserId = '';
    let referenciaId: string | undefined = undefined;

    if (active.tipo === 'desafio') {
      targetUserId = active.data.creadorId;
      referenciaId = active.data.id;
    } else {
      targetUserId = active.data.id;
    }

    // Animación de deslizamiento a la derecha
    this.animacionCard.set('translate-x-full opacity-0 scale-95 rotate-[10deg] transition-all duration-300');

    try {
      const isMatch = await this.matchService.registrarInteres(
        user.uid,
        targetUserId,
        active.tipo,
        referenciaId
      );

      if (isMatch) {
        // Conexión mutua establecida. Cargamos el perfil de la contraparte para el popup
        const partnerProfile = this.userService.getUserByUid(targetUserId)();
        let msg = '';
        if (active.tipo === 'horario') {
          msg = `¡Hay equipo para el turno tarde! A ambos les queda bien entrenar en el rango de ${active.data.franjaHoraria?.inicio} a ${active.data.franjaHoraria?.fin}.`;
        } else if (active.tipo === 'desafio') {
          msg = `¡Reto Aceptado! A vos y a ${partnerProfile?.nombre || 'tu compañero'} les gusta el mismo ritmo. ¿Por qué no arman un grupo?`;
        } else {
          msg = `¡Hay equipo! Encontramos a tu partner ideal para esta semana. ¿Vamos a entrenar?`;
        }

        this.matchActual.set({
          partnerId: targetUserId,
          partnerName: partnerProfile?.nombre || 'Atleta',
          partnerPhoto: partnerProfile?.photoURL || null,
          tipo: active.tipo,
          mensaje: msg
        });
      }

      setTimeout(() => {
        this.currentIndex.update(idx => idx + 1);
        this.animacionCard.set('translate-y-4 opacity-0 scale-95 rotate-0');
        setTimeout(() => {
          this.animacionCard.set('scale-100 opacity-100 translate-x-0 rotate-0 transition-all duration-300');
        }, 50);
      }, 300);

    } catch (e) {
      console.error(e);
      // Revertir animación en caso de error
      this.animacionCard.set('scale-100 opacity-100 translate-x-0 rotate-0 transition-all duration-300');
    }
  }

  async iniciarChatPrivado() {
    const match = this.matchActual();
    if (!match) return;

    const partnerId = match.partnerId;
    this.cerrarMatch();

    const modal = await this.modalCtrl.create({
      component: ChatDetailModalComponent,
      componentProps: {
        otherUserId: partnerId
      },
      cssClass: 'premium-modal'
    });
    await modal.present();
  }

  cerrarMatch() {
    this.matchActual.set(null);
  }
}

