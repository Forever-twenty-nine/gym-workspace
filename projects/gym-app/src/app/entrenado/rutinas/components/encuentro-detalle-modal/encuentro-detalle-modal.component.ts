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
    IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    close,
    peopleOutline,
    timeOutline,
    calendarOutline,
    personOutline,
    chatbubbleOutline,
    handRightOutline
} from 'ionicons/icons';

@Component({
    selector: 'app-encuentro-detalle-modal',
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
        IonBadge
    ],
    templateUrl: './encuentro-detalle-modal.component.html',
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
export class EncuentroDetalleModalComponent {
    @Input() isOpen = false;
    @Input() encuentro: import('gym-library').Convocatoria | null = null;
    @Output() didDismiss = new EventEmitter<void>();
    @Output() irASocial = new EventEmitter<void>();

    get fechaFormateada(): string {
        const enc = this.encuentro;
        if (!enc?.fechaEntrenamiento) return '';

        const f = enc.fechaEntrenamiento instanceof Date
            ? enc.fechaEntrenamiento
            : new Date(enc.fechaEntrenamiento);

        return f.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    }

    constructor() {
        addIcons({
            close,
            peopleOutline,
            timeOutline,
            calendarOutline,
            personOutline,
            chatbubbleOutline,
            handRightOutline
        });
    }

    cerrarModal() {
        this.didDismiss.emit();
    }

    navegarASocial() {
        this.irASocial.emit();
    }
}