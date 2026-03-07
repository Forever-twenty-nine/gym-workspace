import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonFooter,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, fitnessOutline, timeOutline, repeatOutline, playCircle, syncCircleOutline, lockClosed } from 'ionicons/icons';

@Component({
    selector: 'app-rutina-detalle-modal',
    standalone: true,
    imports: [
        CommonModule,
        IonModal,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonButton,
        IonIcon,
        IonTitle,
        IonContent,
        IonFooter,
        IonList,
        IonItem,
        IonLabel,
        IonBadge
    ],
    templateUrl: './rutina-detalle-modal.component.html',
    styles: [`
        ion-modal {
            align-items: flex-start;
            --height: calc(100% - 100px);
        }
        ion-content::part(scroll) {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        ion-content::part(scroll)::-webkit-scrollbar {
            display: none;
        }
    `]
})
export class RutinaDetalleModalComponent {
    @Input() isOpen = false;
    @Input() esFuturo = false;
    @Input() rutina: any = null;
    @Input() ejercicios: any[] = [];
    @Output() didDismiss = new EventEmitter<void>();
    @Output() iniciarEntrenamiento = new EventEmitter<any>();

    constructor() {
        addIcons({
            close,
            fitnessOutline,
            timeOutline,
            repeatOutline,
            playCircle,
            syncCircleOutline,
            lockClosed
        });
    }

    cerrarModal() {
        this.didDismiss.emit();
    }

    iniciar() {
        this.iniciarEntrenamiento.emit(this.rutina);
    }
}
