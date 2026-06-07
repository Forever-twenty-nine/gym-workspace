import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonSelect,
    IonSelectOption
} from '@ionic/angular/standalone';
import { ProgresoHistorialDetalleComponent } from '../progreso-historial-detalle/progreso-historial-detalle.component';
import { SesionRutina } from 'gym-library';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';

@Component({
    selector: 'app-progreso-historial',
    standalone: true,
    imports: [
        CommonModule,
        IonItem,
        IonLabel,
        IonButton,
        IonIcon,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonList,
        IonSelect,
        IonSelectOption,
        ProgresoHistorialDetalleComponent
    ],
    templateUrl: './progreso-historial.component.html'
})
export class ProgresoHistorialComponent {
    @Input({ required: true }) sesiones: SesionRutina[] = [];
    @Output() eliminar = new EventEmitter<string>();

    filtroSeleccionado = 'esta_semana';
    sesionSeleccionada: SesionRutina | null = null;

    constructor() {
        addIcons({ trashOutline });
    }

    formatearFecha(fecha?: Date | string): string {
        if (!fecha) return 'Sin fecha';
        const date = fecha instanceof Date ? fecha : new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }



    getProgresoSesion(sesion: SesionRutina): number {
        return sesion.porcentajeCompletado || 0;
    }

    redondearMinutos(segundos: number): number {
        return Math.round((segundos || 0) / 60);
    }

    onEliminar(sesionId: string) {
        this.eliminar.emit(sesionId);
    }

    cambiarFiltro(event: { detail?: { value?: string } }) {
        if (event?.detail?.value) {
            this.filtroSeleccionado = event.detail.value;
        }
    }

    verDetalle(sesion: SesionRutina) {
        this.sesionSeleccionada = sesion;
    }

    cerrarDetalle() {
        this.sesionSeleccionada = null;
    }

    get sesionesFiltradas() {
        if (!this.sesiones || this.sesiones.length === 0) return [];

        const ahora = new Date();
        const diaSemana = ahora.getDay();
        const diffLunes = ahora.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        const inicioSemanaActual = new Date(ahora.getFullYear(), ahora.getMonth(), diffLunes);
        inicioSemanaActual.setHours(0, 0, 0, 0);

        const inicioSemanaPasada = new Date(inicioSemanaActual);
        inicioSemanaPasada.setDate(inicioSemanaPasada.getDate() - 7);

        return this.sesiones.filter(sesion => {
            if (!sesion.fechaInicio) return false;

            const fecha = new Date(sesion.fechaInicio);

            if (this.filtroSeleccionado === 'esta_semana') {
                return fecha >= inicioSemanaActual;
            } else if (this.filtroSeleccionado === 'semana_pasada') {
                return fecha >= inicioSemanaPasada && fecha < inicioSemanaActual;
            }
            return false;
        });
    }
}
