import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
    IonList
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    playCircle,
    chevronForwardOutline,
    chevronUpOutline,
    chevronDownOutline,
    calendarOutline
} from 'ionicons/icons';
import { Rutina, Convocatoria } from 'gym-library';
import { DateBadgeComponent } from '../../../../shared/components/date-badge/date-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

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
        IonList,
        DateBadgeComponent,
        EmptyStateComponent,
    ],
    templateUrl: './rutinas-semana.component.html',
})
export class RutinasSemanaComponent implements OnInit, OnChanges {
    @Input() rutinasPorDia: SemanaDia[] | null = [];
    @Output() verDetalles = new EventEmitter<{ rutina: Rutina, esFuturo: boolean }>();
    @Output() iniciarEntrenamientoDirecto = new EventEmitter<{ event: Event, rutina: Rutina }>();
    @Output() verEncuentro = new EventEmitter<Encuentro>();

    /** Set de day-keys (yyyy-mm-dd) actualmente expandidos */
    expandedDays = new Set<string>();

    constructor() {
        addIcons({
            playCircle,
            chevronForwardOutline,
            chevronUpOutline,
            chevronDownOutline,
            calendarOutline
        });
    }

    ngOnInit() {
        this.autoExpandToday();
    }

    /** Reaccionar al @Input() cuando llega async desde el page (signals → @Input) */
    ngOnChanges(changes: SimpleChanges) {
        if (changes['rutinasPorDia'] && this.rutinasPorDia) {
            this.autoExpandToday();
        }
    }

    /** Auto-expand el día de hoy si tiene actividad (idempotente) */
    private autoExpandToday() {
        if (!this.rutinasPorDia) return;
        for (const dia of this.rutinasPorDia) {
            if (dia.esHoy && this.diaTieneActividad(dia)) {
                this.expandedDays.add(this.getDiaKey(dia));
            }
        }
    }

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

    /** Toggle del estado expandido de un día (no-op si el día no tiene actividad) */
    toggleDay(dia: SemanaDia) {
        if (!this.diaTieneActividad(dia)) return;
        const key = this.getDiaKey(dia);
        if (this.expandedDays.has(key)) {
            this.expandedDays.delete(key);
        } else {
            this.expandedDays.add(key);
        }
    }

    isExpanded(dia: SemanaDia): boolean {
        return this.expandedDays.has(this.getDiaKey(dia));
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
