import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonBadge,
    IonButton,
    IonList,
    IonListHeader
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fitnessOutline, timeOutline, playCircle, bedOutline, calendarOutline, lockClosedOutline } from 'ionicons/icons';

@Component({
    selector: 'app-rutinas-semana',
    standalone: true,
    imports: [
        CommonModule,
        IonIcon,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonItem,
        IonLabel,
        IonBadge,
        IonButton,
        IonList
    ],
    templateUrl: './rutinas-semana.component.html'
})
export class RutinasSemanaComponent {
    @Input() rutinasPorDia: any[] | null = [];
    @Output() verDetalles = new EventEmitter<{ rutina: any, esFuturo: boolean }>();
    @Output() iniciarEntrenamientoDirecto = new EventEmitter<{ event: Event, rutina: any }>();

    constructor() {
        addIcons({
            fitnessOutline,
            timeOutline,
            playCircle,
            bedOutline,
            calendarOutline,
            lockClosedOutline
        });
    }

    onVerDetalles(rutina: any, esFuturo: boolean = false) {
        this.verDetalles.emit({ rutina, esFuturo });
    }

    onIniciarEntrenamientoDirecto(event: Event, rutina: any) {
        this.iniciarEntrenamientoDirecto.emit({ event, rutina });
    }
}
