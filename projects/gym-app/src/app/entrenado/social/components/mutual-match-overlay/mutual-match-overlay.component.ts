import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonAvatar, IonModal, IonItem, IonList,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonIcon, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, chatbubbleOutline, personOutline } from 'ionicons/icons';
import { MatchActual } from '../../../../core/types/descubrir.types';

@Component({
  selector: 'app-mutual-match-overlay',
  templateUrl: './mutual-match-overlay.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonAvatar, IonModal, IonItem, IonList,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonIcon, IonText,
  ],
})
export class MutualMatchOverlayComponent {
  @Input({ required: true }) matchActual!: MatchActual;
  @Input() currentUserPhoto: string | null = null;

  @Output() iniciarChat = new EventEmitter<void>();
  @Output() cerrarMatch = new EventEmitter<void>();

  get partnerPhoto(): string | null { return this.matchActual?.partnerPhoto ?? null; }
  get matchMessage(): string { return this.matchActual?.mensaje ?? ''; }

  constructor() {
    addIcons({ closeOutline, chatbubbleOutline, personOutline });
  }

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
