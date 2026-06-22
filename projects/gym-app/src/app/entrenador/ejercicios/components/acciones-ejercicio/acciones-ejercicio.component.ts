import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton,
  IonIcon,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbellOutline, lockClosed } from 'ionicons/icons';

@Component({
  selector: 'app-acciones-ejercicio',
  templateUrl: './acciones-ejercicio.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonText
  ]
})
export class AccionesEjercicioComponent {
  hasReachedLimit = input.required<boolean>();
  limitMessage = input.required<string>();

  crearEjercicio = output<void>();

  constructor() {
    addIcons({ barbellOutline, lockClosed });
  }

  onCrear() {
    this.crearEjercicio.emit();
  }
}
