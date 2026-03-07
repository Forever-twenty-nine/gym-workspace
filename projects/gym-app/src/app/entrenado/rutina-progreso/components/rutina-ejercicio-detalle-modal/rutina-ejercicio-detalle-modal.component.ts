import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent
} from '@ionic/angular/standalone';
import { Ejercicio } from 'gym-library';
import { addIcons } from 'ionicons';
import { close, repeatOutline, timeOutline, barbellOutline, informationCircleOutline } from 'ionicons/icons';

@Component({
    selector: 'app-rutina-ejercicio-detalle-modal',
    standalone: true,
    imports: [
        CommonModule,
        IonModal,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonIcon,
        IonContent
    ],
    templateUrl: './rutina-ejercicio-detalle-modal.component.html',
    styles: [`
    :host {
        display: block;
    }
  `]
})
export class RutinaEjercicioDetalleModalComponent {
    readonly ejercicio = input<Ejercicio | null>(null);
    readonly isOpen = input.required<boolean>();
    readonly closeModal = output<void>();

    constructor() {
        addIcons({ close, repeatOutline, timeOutline, barbellOutline, informationCircleOutline });
    }

    onWillDismiss() {
        this.closeModal.emit();
    }
}
