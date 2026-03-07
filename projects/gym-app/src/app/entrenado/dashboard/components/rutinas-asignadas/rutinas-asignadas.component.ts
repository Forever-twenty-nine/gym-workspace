import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, 
  IonCardContent, 
  IonIcon, 
  IonButton,
  IonAvatar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbellOutline, chevronForwardOutline, playOutline, calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-rutinas-asignadas',
  templateUrl: './rutinas-asignadas.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonCard, 
    IonCardContent, 
    IonIcon, 
    IonButton,
    IonAvatar
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RutinasAsignadasComponent {
  @Input() rutinas: any[] = [];
  @Input() entrenador: any = null;
  @Output() verDetalle = new EventEmitter<any>();
  @Output() verTodas = new EventEmitter<void>();

  constructor() {
    addIcons({ barbellOutline, chevronForwardOutline, playOutline, calendarOutline });
  }
}
