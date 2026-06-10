import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonAvatar, IonModal, IonItem, IonAccordion, IonLabel } from '@ionic/angular/standalone';
import { MatchActual } from '../../../../core/types/descubrir.types';

@Component({
  selector: 'app-mutual-match-overlay',
  templateUrl: './mutual-match-overlay.component.html',
  standalone: true,
  imports: [IonLabel, IonItem,
    CommonModule,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonAvatar,
    IonModal],
  styles: [`
    ion-modal {
      --width: min(90%, 360px);
      --height: auto;
      --border-radius: 16px;
    }
  `]
})
export class MutualMatchOverlayComponent {
  @Input({ required: true }) matchActual!: MatchActual;
  @Input() currentUserPhoto: string | null = null;

  @Output() iniciarChat = new EventEmitter<void>();
  @Output() cerrarMatch = new EventEmitter<void>();

  get partnerPhoto(): string | null { return this.matchActual?.partnerPhoto ?? null; }
  get matchMessage(): string { return this.matchActual?.mensaje ?? ''; }

  onIniciarChat(): void {
    this.iniciarChat.emit();
  }

  onCerrarMatch(): void {
    this.cerrarMatch.emit();
  }

  onDidDismiss(): void {
    this.cerrarMatch.emit();
  }
}
