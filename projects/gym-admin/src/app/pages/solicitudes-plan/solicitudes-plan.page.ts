import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanService } from '../../services/plan.service';
import { SolicitudPlan } from 'gym-library';

@Component({
    selector: 'app-solicitudes-plan',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './solicitudes-plan.page.html'
})
export class SolicitudesPlanPage {
    private planService = inject(PlanService);

    solicitudes = this.planService.solicitudes;

    // Filtro simple
    filtro = signal<'todas' | 'pendiente' | 'aprobada' | 'rechazada'>('pendiente');

    solicitudesFiltradas() {
        const f = this.filtro();
        if (f === 'todas') return this.solicitudes();
        return this.solicitudes().filter(s => s.estado === f);
    }

    setFiltro(f: 'todas' | 'pendiente' | 'aprobada' | 'rechazada') {
        this.filtro.set(f);
    }

    async aprobar(solicitud: SolicitudPlan) {
        if (confirm(`¿Estás seguro de aprobar la solicitud de ${solicitud.userName}?`)) {
            try {
                await this.planService.responderSolicitud(solicitud, true);
            } catch (error) {
                console.error('Error al aprobar:', error);
                alert('Error al aprobar la solicitud');
            }
        }
    }

    async rechazar(solicitud: SolicitudPlan) {
        const motivo = prompt('Ingresa el motivo del rechazo (opcional):');
        if (motivo !== null) {
            try {
                await this.planService.responderSolicitud(solicitud, false, motivo);
            } catch (error) {
                console.error('Error al rechazar:', error);
                alert('Error al rechazar la solicitud');
            }
        }
    }
}
