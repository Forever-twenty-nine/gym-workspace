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
    IonAccordionGroup,
    IonAccordion
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, bedOutline, chevronForwardOutline } from 'ionicons/icons';

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
        IonAccordionGroup,
        IonAccordion,
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

    getDiaKey(dia: any): string {
        return dia.fecha.toISOString().split('T')[0];
    }

    getEventCount(dia: any): number {
        return (dia.rutinas?.length ?? 0) + (dia.encuentros?.length ?? 0);
    }

    getEventSummary(dia: any): string {
        const r = dia.rutinas?.length ?? 0;
        const e = dia.encuentros?.length ?? 0;
        const parts: string[] = [];
        if (r > 0) parts.push(`${r} ${r === 1 ? 'rutina' : 'rutinas'}`);
        if (e > 0) parts.push(`${e} ${e === 1 ? 'encuentro' : 'encuentros'}`);
        return parts.join(' • ');
    }



    constructor() {
        addIcons({
            playCircle,
            bedOutline,
            chevronForwardOutline
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
