import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, handRight, sparklesOutline } from 'ionicons/icons';
import { MatchCardComponent } from './match-card/match-card.component';
import { TarjetaDescubrir } from '../../../../core/types/descubrir.types';

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
  @Output() pasar = new EventEmitter<void>();
  @Output() chocarLos5 = new EventEmitter<void>();
  @Output() cardTransitionEnd = new EventEmitter<void>();

  animacionCard = signal<string>('scale-100 opacity-100 translate-x-0 rotate-0');
  private isExiting = signal(false);

  constructor() {
    addIcons({ close, handRight, sparklesOutline });
  }

  onPasar(): void {
    this.triggerExitAction('-translate-x-full opacity-0 scale-95 rotate-[-10deg] transition-all duration-300', () => this.pasar.emit());
  }

  onChocarLos5(): void {
    this.triggerExitAction('translate-x-full opacity-0 scale-95 rotate-[10deg] transition-all duration-300', () => this.chocarLos5.emit());
  }

  private triggerExitAction(animation: string, action: () => void): void {
    this.isExiting.set(true);
    this.animacionCard.set(animation);
    action();
  }

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
