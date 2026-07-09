import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonModal,
    IonIcon,
    IonContent,
    IonText,
    IonList,
    IonItem,
    IonLabel,
    IonCard,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonNote,
    IonButton,
    IonCardHeader, IonCardTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fitnessOutline, timeOutline, playCircle, lockClosed } from 'ionicons/icons';

@Component({
    selector: 'app-rutina-detalle-modal',
    standalone: true,
    imports: [
        IonCardTitle, IonCardHeader,
        CommonModule,
        IonModal,
        IonIcon,
        IonContent,
        IonText,
        IonList,
        IonItem,
        IonLabel,
        IonCard,
        IonCardContent,
        IonGrid,
        IonRow,
        IonCol,
        IonNote,
        IonButton,
    ],
    templateUrl: './rutina-detalle-modal.component.html',

})
export class RutinaDetalleModalComponent {
    @Input() isOpen = false;
    @Input() esFuturo = false;
    @Input() rutina: import('gym-library').Rutina | null = null;
    @Input() ejercicios: import('gym-library').Ejercicio[] = [];
    @Output() didDismiss = new EventEmitter<void>();
    @Output() iniciarEntrenamiento = new EventEmitter<import('gym-library').Rutina>();

    constructor() {
        addIcons({ fitnessOutline, timeOutline, playCircle, lockClosed });
    }

    cerrarModal() {
        this.didDismiss.emit();
    }

    iniciar() {
        if (this.rutina) this.iniciarEntrenamiento.emit(this.rutina);
    }
}
