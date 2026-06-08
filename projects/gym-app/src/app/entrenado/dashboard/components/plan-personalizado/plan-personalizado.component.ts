import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon, IonAvatar, IonListHeader } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { accessibilityOutline, medalOutline, todayOutline } from 'ionicons/icons';

@Component({
  selector: 'app-plan-personalizado',
  templateUrl: './plan-personalizado.component.html',
  standalone: true,
  imports: [IonListHeader, IonAvatar,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlanPersonalizadoComponent {

  @Input() nivel: string | undefined = '';
  @Input() objetivo: string = '';
  @Input() frecuencia: number = 0;
  @Input() photoURL: string | undefined = '';
  @Input() entrenadorAsignado: string | undefined = '';

  constructor() {
    addIcons({ accessibilityOutline, medalOutline, todayOutline });
  }
}
