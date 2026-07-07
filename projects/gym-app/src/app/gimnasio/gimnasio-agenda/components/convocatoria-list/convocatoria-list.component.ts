import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonCard, IonCardContent } from '@ionic/angular/standalone';
import { ConvocatoriaCardComponent } from '../convocatoria-card/convocatoria-card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-convocatoria-list',
  standalone: true,
  imports: [
    CommonModule,
    IonCard,
    IonCardContent,
    ConvocatoriaCardComponent,
    EmptyStateComponent
  ],
  templateUrl: './convocatoria-list.component.html'
})
export class ConvocatoriaListComponent {
  items = input<any[]>([]);
  emptyMessage = input<string>('No hay entrenamientos planificados para esta semana.');
  emptyIcon = input<string>('calendar-outline');
  emptyTitle = input<string>('Sin entrenamientos');
}
