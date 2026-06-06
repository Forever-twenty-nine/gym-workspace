import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
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
import { fitnessOutline, timeOutline, playCircle, bedOutline, calendarOutline, lockClosedOutline, peopleOutline } from 'ionicons/icons';

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
        IonList,
    ],
    templateUrl: './rutinas-semana.component.html'
})
export class RutinasSemanaComponent {
    @Input() rutinasPorDia: any[] | null = [];
    @Output() verDetalles = new EventEmitter<{ rutina: any, esFuturo: boolean }>();
    @Output() iniciarEntrenamientoDirecto = new EventEmitter<{ event: Event, rutina: any }>();
    @Output() verEncuentro = new EventEmitter<any>();

    get tieneActividadProgramada(): boolean {
        return (this.rutinasPorDia ?? []).some(dia =>
            (dia.rutinas?.length ?? 0) > 0 || (dia.encuentros?.length ?? 0) > 0
        );
    }

    diaTieneActividad(dia: any): boolean {
        return (dia.rutinas?.length ?? 0) > 0 || (dia.encuentros?.length ?? 0) > 0;
    }

    constructor() {
        addIcons({
            fitnessOutline,
            timeOutline,
            playCircle,
            bedOutline,
            calendarOutline,
            lockClosedOutline,
            peopleOutline
        });
    }

    onVerDetalles(rutina: any, esFuturo: boolean = false) {
        this.verDetalles.emit({ rutina, esFuturo });
    }

    onIniciarEntrenamientoDirecto(event: Event, rutina: any) {
        this.iniciarEntrenamientoDirecto.emit({ event, rutina });
    }

    onVerEncuentro(encuentro: any) {
        this.verEncuentro.emit(encuentro);
    }
}
