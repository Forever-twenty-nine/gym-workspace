import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import {
  IonCard,
  IonGrid,
  IonRow,
  IonCol,
  IonAvatar,
  IonLabel
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-plan-personalizado',
  templateUrl: './plan-personalizado.component.html',
  standalone: true,
  imports: [
    IonCard,
    IonGrid,
    IonRow,
    IonCol,
    IonAvatar,
    IonLabel
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanPersonalizadoComponent {

  @Input() nivel: string | undefined = '';
  @Input() objetivo: string = '';
  @Input() frecuencia: number = 0;
  @Input() photoURL: string | undefined = '';
  @Input() entrenadorAsignado: string | undefined = '';

}
