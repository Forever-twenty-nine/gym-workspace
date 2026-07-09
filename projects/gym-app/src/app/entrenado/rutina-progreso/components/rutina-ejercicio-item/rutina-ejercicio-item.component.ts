import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonCard,
    IonItem,
    IonAvatar,
    IonLabel,
    IonButton,
    IonIcon
} from '@ionic/angular/standalone';
import { Ejercicio } from 'gym-library';
import { addIcons } from 'ionicons';
import { checkmarkCircle, ellipseOutline, informationCircleOutline } from 'ionicons/icons';

@Component({
    selector: 'app-rutina-ejercicio-item',
    standalone: true,
    imports: [
        CommonModule,
        IonCard,
        IonItem,
        IonAvatar,
        IonLabel,
        IonButton,
        IonIcon
    ],
    templateUrl: './rutina-ejercicio-item.component.html',
})
export class RutinaEjercicioItemComponent {
    readonly ejercicio = input.required<Ejercicio>();
    readonly completado = input.required<boolean>();
    readonly toggle = output<void>();
    readonly showDetails = output<void>();

    constructor() {
        addIcons({ checkmarkCircle, ellipseOutline, informationCircleOutline });
    }
}