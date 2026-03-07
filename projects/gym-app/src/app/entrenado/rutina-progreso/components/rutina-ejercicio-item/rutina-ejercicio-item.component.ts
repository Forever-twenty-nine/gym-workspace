import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { Ejercicio } from 'gym-library';

@Component({
    selector: 'app-rutina-ejercicio-item',
    standalone: true,
    imports: [CommonModule, IonIcon],
    templateUrl: './rutina-ejercicio-item.component.html',
    styles: [`
    :host {
        display: block;
    }
  `]
})
export class RutinaEjercicioItemComponent {
    readonly ejercicio = input.required<Ejercicio>();
    readonly completado = input.required<boolean>();
    readonly toggle = output<void>();
    readonly showDetails = output<void>();
}

