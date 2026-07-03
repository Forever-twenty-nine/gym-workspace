import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, 
  IonIcon,
  IonButton,
  IonText,
  IonItem,
  IonLabel,
  IonBadge,
  IonCardContent,
  IonChip,
  IonList,
  IonListHeader,
  IonAvatar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, timeOutline, personOutline, trashOutline } from 'ionicons/icons';

@Component({
  selector: 'app-convocatoria-card',
  standalone: true,
  imports: [
    CommonModule, 
    IonCard, 
    IonIcon,
    IonButton,
    IonText,
    IonItem,
    IonLabel,
    IonBadge,
    IonCardContent,
    IonChip,
    IonList,
    IonListHeader,
    IonAvatar
  ],
  templateUrl: './convocatoria-card.component.html'
})
export class ConvocatoriaCardComponent {
  convocatoria = input.required<any>();
  creadorName = input<string>('Sesión');
  creadorPhoto = input<string | null>(null);
  fechaFormateada = input<string>('');
  asistentes = input<{ name: string; photo: string | null }[]>([]);
  canDelete = input<boolean>(true);

  eliminar = output<string>();

  constructor() {
    addIcons({ calendarOutline, timeOutline, personOutline, trashOutline });
  }

  onEliminar() {
    this.eliminar.emit(this.convocatoria().id);
  }
}
