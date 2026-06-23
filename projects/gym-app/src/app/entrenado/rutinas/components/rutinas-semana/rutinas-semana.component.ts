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
    IonAccordion,
    IonList
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { playCircle, bedOutline, chevronForwardOutline, calendarOutline } from 'ionicons/icons';
import { Rutina, Convocatoria } from 'gym-library';
import { DateBadgeComponent } from '../../../../shared/components/date-badge/date-badge.component';

interface SemanaDia {
  fecha: Date;
  rutinas: Rutina[];
  diaCorto: string;
  esHoy: boolean;
  esFuturo: boolean;
  encuentros?: Convocatoria[];
}

type Encuentro = Convocatoria; // alias for clarity in this component

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
        IonList,
        DateBadgeComponent,
    ],
    templateUrl: './rutinas-semana.component.html',
    styles: [`
        ::ng-deep ion-accordion[disabled] .ion-accordion-toggle-icon,
        ::ng-deep ion-accordion.accordion-disabled .ion-accordion-toggle-icon {
            display: none !important;
        }
    `]
})
export class RutinasSemanaComponent {
    @Input() rutinasPorDia: SemanaDia[] | null = [];
    @Output() verDetalles = new EventEmitter<{ rutina: Rutina, esFuturo: boolean }>();
    @Output() iniciarEntrenamientoDirecto = new EventEmitter<{ event: Event, rutina: Rutina }>();
    @Output() verEncuentro = new EventEmitter<Encuentro>();

    get tieneActividadProgramada(): boolean {
        return (this.rutinasPorDia ?? []).some(dia =>
            (dia.rutinas?.length ?? 0) > 0 || (dia.encuentros?.length ?? 0) > 0
        );
    }

    diaTieneActividad(dia: SemanaDia): boolean {
        return (dia.rutinas?.length ?? 0) > 0 || (dia.encuentros?.length ?? 0) > 0;
    }

    getDiaKey(dia: SemanaDia): string {
        return dia.fecha.toISOString().split('T')[0];
    }

    getEventCount(dia: SemanaDia): number {
        return (dia.rutinas?.length ?? 0) + (dia.encuentros?.length ?? 0);
    }

    getEventSummary(dia: SemanaDia): string {
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
            chevronForwardOutline,
            calendarOutline
        });
    }

    onVerDetalles(rutina: Rutina, esFuturo: boolean = false) {
        this.verDetalles.emit({ rutina, esFuturo });
    }

    onIniciarEntrenamientoDirecto(event: Event, rutina: Rutina) {
        this.iniciarEntrenamientoDirecto.emit({ event, rutina });
    }

    onVerEncuentro(encuentro: Encuentro) {
        this.verEncuentro.emit(encuentro);
    }
}
