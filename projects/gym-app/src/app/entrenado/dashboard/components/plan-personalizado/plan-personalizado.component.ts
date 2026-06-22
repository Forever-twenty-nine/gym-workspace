import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import {
  IonCard,
  IonGrid,
  IonRow,
  IonCol,
  IonAvatar,
  IonLabel, IonCardHeader, IonCardContent } from '@ionic/angular/standalone';
  import { Objetivo } from 'gym-library';

@Component({
  selector: 'app-plan-personalizado',
  templateUrl: './plan-personalizado.component.html',
  standalone: true,
  imports: [IonCardContent, IonCardHeader, 
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
  @Input() objetivo: Objetivo | string | undefined = undefined;
  @Input() frecuencia: number = 0;
  @Input() photoURL: string | undefined = '';
  @Input() entrenadorAsignado: string | undefined = '';

}
