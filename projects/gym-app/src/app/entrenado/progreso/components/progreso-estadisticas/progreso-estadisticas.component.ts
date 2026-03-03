import { Component, Input } from '@angular/core';
import {
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    checkmarkCircleOutline,
    timeOutline,
    fitnessOutline,
    flameOutline,
    trophyOutline
} from 'ionicons/icons';

@Component({
    selector: 'app-progreso-estadisticas',
    standalone: true,
    imports: [
        IonIcon, IonCard, IonCardHeader, IonCardTitle,
        IonCardSubtitle, IonCardContent, IonGrid, IonRow, IonCol, IonText
    ],
    templateUrl: './progreso-estadisticas.component.html'
})
export class ProgresoEstadisticasComponent {
    @Input({ required: true }) stats!: {
        rutinasAsignadas: number;
        sesionesTotales: number;
        completadas: number;
        enProgreso: number;
        tiempoTotal: number;
    };

    constructor() {
        addIcons({
            checkmarkCircleOutline,
            timeOutline,
            fitnessOutline,
            flameOutline,
            trophyOutline
        });
    }

    formatearTiempo(minutos: number): string {
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;

        if (horas > 0) {
            return `${horas}h ${mins}m`;
        }
        return `${mins}m`;
    }
}
