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
import { addIcons } from 'ionicons';
import {
    calendarOutline,
    timeOutline,
    trashOutline,
    fitnessOutline,
    checkmarkCircleOutline
} from 'ionicons/icons';

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
    @Input({ required: true }) sesiones: any[] = [];
    @Output() eliminar = new EventEmitter<string>();

    filtroSeleccionado = 'esta_semana';
    sesionSeleccionada: any = null;

    constructor() {
        addIcons({
            calendarOutline,
            timeOutline,
            trashOutline,
            fitnessOutline,
            checkmarkCircleOutline
        });
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

    getEstadoSesion(sesion: any): string {
        if (sesion.completada) return 'Completada';
        if (sesion.fechaInicio) return 'En progreso';
        return 'Pendiente';
    }

    getColorEstado(sesion: any): string {
        if (sesion.completada) return 'success';
        if (sesion.fechaInicio) return 'primary';
        return 'medium';
    }

    getProgresoSesion(sesion: any): number {
        return sesion.porcentajeCompletado || 0;
    }

    redondearMinutos(segundos: number): number {
        return Math.round((segundos || 0) / 60);
    }

    onEliminar(sesionId: string) {
        this.eliminar.emit(sesionId);
    }

    cambiarFiltro(event: any) {
        this.filtroSeleccionado = event.detail.value;
    }

    verDetalle(sesion: any) {
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
