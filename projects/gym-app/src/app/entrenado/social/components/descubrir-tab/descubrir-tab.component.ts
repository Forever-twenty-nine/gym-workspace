import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, handRight, sparkles, chatbubbles, person, sparklesOutline } from 'ionicons/icons';
import { MatchCardComponent } from '../match-card/match-card.component';
import { TarjetaDescubrir, MatchActual } from '../../descubrir.types';

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

  @Input({ required: true }) tarjetaActiva: TarjetaDescubrir | null = null;
  @Input() matchActual: MatchActual | null = null;
  @Input() currentUserPhoto: string | null = null;
  @Output() pasar = new EventEmitter<void>();
  @Output() chocarLos5 = new EventEmitter<void>();
  @Output() iniciarChat = new EventEmitter<void>();
  @Output() cerrarMatch = new EventEmitter<void>();
  @Output() cardTransitionEnd = new EventEmitter<void>();

  get partnerPhoto(): string | null { return this.matchActual?.partnerPhoto ?? null; }
  get matchMessage(): string        { return this.matchActual?.mensaje ?? '';        }

  animacionCard = signal<string>('scale-100 opacity-100 translate-x-0 rotate-0');
  private isExiting = signal(false);

  constructor() {
    addIcons({ close, handRight, sparkles, chatbubbles, person, sparklesOutline });
  }

  onPasar(): void {
    this.isExiting.set(true);
    this.animacionCard.set('-translate-x-full opacity-0 scale-95 rotate-[-10deg] transition-all duration-300');
    this.pasar.emit();
  }

  onChocarLos5(): void {
    this.isExiting.set(true);
    this.animacionCard.set('translate-x-full opacity-0 scale-95 rotate-[10deg] transition-all duration-300');
    this.chocarLos5.emit();
  }

  onIniciarChat(): void   { this.iniciarChat.emit(); }
  onCerrarMatch(): void   { this.cerrarMatch.emit(); }

  onCardTransitionEnd(): void {
    if (!this.isExiting()) return;

    this.animacionCard.set('translate-y-4 opacity-0 scale-95 rotate-0 transition-none');

    requestAnimationFrame(() => {
      this.animacionCard.set('scale-100 opacity-100 translate-x-0 rotate-0 transition-all duration-300');
      this.isExiting.set(false);
    });

    this.cardTransitionEnd.emit();
  }
}
