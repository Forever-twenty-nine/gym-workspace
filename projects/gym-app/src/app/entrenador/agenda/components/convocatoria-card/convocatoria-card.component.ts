import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonCard, 
  IonIcon,
  IonButton
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
    IonButton
  ],
  templateUrl: './convocatoria-card.component.html'
})
export class ConvocatoriaCardComponent {
  convocatoria = input.required<any>();
  creadorName = input<string>('Sesión');
  creadorPhoto = input<string | null>(null);
  fechaFormateada = input<string>('');
  asistentes = input<{ name: string; photo: string | null }[]>([]);

  eliminar = output<string>();

  constructor() {
    addIcons({ calendarOutline, timeOutline, personOutline, trashOutline });
  }

  onEliminar() {
    this.eliminar.emit(this.convocatoria().id);
  }
}
