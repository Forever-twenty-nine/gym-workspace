import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonText, IonCard, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, handRightOutline } from 'ionicons/icons';
import { ConvocatoriaCardComponent } from '../convocatoria-card/convocatoria-card.component';

@Component({
  selector: 'app-convocatoria-list',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    IonCard,
    IonCardTitle,
    IonCardContent,
    ConvocatoriaCardComponent
],
  templateUrl: './convocatoria-list.component.html'
})
export class ConvocatoriaListComponent {
  items = input<any[]>([]);
  emptyMessage = input<string>('No hay entrenamientos planificados para esta semana.');
  emptyIcon = input<string>('calendar-outline');
  emptyTitle = input<string>('Sin entrenamientos');
  canDelete = input<boolean>(true);

  eliminar = output<string>();

  constructor() {
    addIcons({ calendarOutline, handRightOutline });
  }

  onEliminar(id: string) {
    this.eliminar.emit(id);
  }
}
