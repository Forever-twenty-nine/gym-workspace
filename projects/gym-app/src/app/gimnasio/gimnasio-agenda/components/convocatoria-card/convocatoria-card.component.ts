import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard,
  IonIcon,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonCardContent,
  IonChip,
  IonList,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, timeOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-convocatoria-card',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonIcon,
    IonItem,
    IonLabel,
    IonAvatar,
    IonBadge,
    IonCardContent,
    IonChip,
    IonList,
    IonText
  ],
  templateUrl: './convocatoria-card.component.html'
})
export class ConvocatoriaCardComponent {
  convocatoria = input.required<any>();
  creadorName = input<string>('Sesión');
  creadorPhoto = input<string | null>(null);
  fechaFormateada = input<string>('');
  asistentes = input<{ name: string; photo: string | null }[]>([]);

  constructor() {
    addIcons({ calendarOutline, timeOutline, personOutline });
  }
}
