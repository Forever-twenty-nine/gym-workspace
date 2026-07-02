import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IonCard, IonGrid, IonRow, IonCol, IonAvatar, IonLabel, IonItem, IonBadge, IonNote, IonText } from '@ionic/angular/standalone';
import { Objetivo } from 'gym-library';

@Component({
  selector: 'app-plan-personalizado',
  templateUrl: './plan-personalizado.component.html',
  standalone: true,
  imports: [
    IonNote,
    IonItem,
    IonCard,
    IonGrid,
    IonRow,
    IonCol,
    IonAvatar,
    IonLabel,
    IonBadge,
    IonText
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class PlanPersonalizadoComponent {

  @Input() nivel: string | undefined = '';
  @Input() objetivo: Objetivo | string | undefined = undefined;
  @Input() frecuencia: number = 0;
  @Input() photoURL: string | undefined = '';
  @Input() entrenadorAsignado: string | undefined = '';

}
