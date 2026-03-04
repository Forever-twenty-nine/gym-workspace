import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonCard,
    IonCardContent,
    IonText,
    IonIcon,
    IonButton
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-acciones-rutina',
    templateUrl: './acciones-rutina.component.html',
    standalone: true,
    imports: [
        CommonModule,
        IonCard,
        IonCardContent,
        IonText,
        IonIcon,
        IonButton
    ]
})
export class AccionesRutinaComponent {
    hasReachedLimit = input.required<boolean>();
    limitMessage = input.required<string>();

    crearRutina = output<void>();
}
