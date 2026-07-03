import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, handRightOutline, trashOutline, pencilOutline, timeOutline } from 'ionicons/icons';
import { ConvocatoriaCardComponent } from '../convocatoria-card/convocatoria-card.component';
import { DateBadgeComponent } from '../../../../shared/components/date-badge/date-badge.component';

@Component({
  selector: 'app-convocatoria-list',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    ConvocatoriaCardComponent,
    DateBadgeComponent
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
  editar = output<any>();

  constructor() {
    addIcons({ calendarOutline, handRightOutline, trashOutline, pencilOutline, timeOutline });
  }

  onEliminar(id: string) {
    this.eliminar.emit(id);
  }

  onEditar(convocatoria: any) {
    this.editar.emit(convocatoria);
  }
}
