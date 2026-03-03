import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonProgressBar, IonIcon } from '@ionic/angular/standalone';

@Component({
    selector: 'app-rutina-progreso-header',
    standalone: true,
    imports: [CommonModule, IonProgressBar, IonIcon],
    templateUrl: './rutina-progreso-header.component.html',
    styles: [`
    :host {
        display: block;
    }
  `]
})
export class RutinaProgresoHeaderComponent {
    readonly porcentaje = input.required<number>();
    readonly tiempo = input.required<string>();
    readonly estado = input.required<string>();
    readonly iniciada = input.required<boolean>();
}
