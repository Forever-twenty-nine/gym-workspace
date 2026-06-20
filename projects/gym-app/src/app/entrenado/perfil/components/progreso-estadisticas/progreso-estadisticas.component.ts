import { Component, Input, computed } from '@angular/core';
import {
    IonCard,
    IonCardContent
} from '@ionic/angular/standalone';

@Component({
    selector: 'app-progreso-estadisticas',
    standalone: true,
    imports: [
        IonCard,
        IonCardContent
    ],
    templateUrl: './progreso-estadisticas.component.html'
})
export class ProgresoEstadisticasComponent {
    @Input() stats: any = null;                 // TODO: tipar con interfaz de estadísticas generales
    @Input() sesiones: import('gym-library').SesionRutina[] = [];
    @Input() dbStats: import('gym-library').EstadisticasEntrenado | null = null;

    // Computed chart data
    readonly weeklyActivity = computed(() => this.computeWeeklyActivity());
    readonly topRutinas = computed(() => this.computeTopRutinas());
    readonly completionRate = computed(() => this.computeCompletionRate());
    readonly maxWeeklyValue = computed(() => Math.max(1, ...this.weeklyActivity().map(d => d.value)));

    formatearTiempo(minutos: number): string {
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;

        if (horas > 0) {
            return `${horas}h ${mins}m`;
        }
        return `${mins}m`;
    }

    private computeWeeklyActivity() {
        if (!this.sesiones || this.sesiones.length === 0) {
            return Array.from({ length: 7 }, (_, i) => ({ label: this.dayLabel(i), value: 0, minutes: 0 }));
        }

        const now = new Date();
        const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
        const activity = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now);
            d.setDate(d.getDate() - (6 - i));
            return {
                label: dayNames[d.getDay()],
                dateKey: d.toISOString().slice(0, 10),
                value: 0,
                minutes: 0
            };
        });

        const map = new Map(activity.map(a => [a.dateKey, a]));

        this.sesiones.forEach((s) => {
            if (!s.fechaInicio || !s.completada) return;
            const d = new Date(s.fechaInicio);
            const key = d.toISOString().slice(0, 10);
            const entry = map.get(key);
            if (entry) {
                entry.value += 1;
                entry.minutes += Math.round((s.duracion || 0) / 60);
            }
        });

        return activity;
    }

    private dayLabel(offsetFromToday: number): string {
        const d = new Date();
        d.setDate(d.getDate() - (6 - offsetFromToday));
        return ['D','L','M','X','J','V','S'][d.getDay()];
    }

    private computeTopRutinas() {
        const counts = new Map<string, number>();
        (this.sesiones || []).filter((s) => s.completada).forEach((s) => {
            const name = s.rutinaResumen?.nombre || 'Rutina';
            counts.set(name, (counts.get(name) || 0) + 1);
        });
        const arr = Array.from(counts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 4);
        const max = Math.max(1, ...arr.map(a => a.count));
        return arr.map(a => ({ ...a, percent: Math.round((a.count / max) * 100) }));
    }

    private computeCompletionRate(): number {
        if (!this.sesiones || this.sesiones.length === 0) return 0;
        const completadas = this.sesiones.filter((s) => s.completada).length;
        return Math.round((completadas / this.sesiones.length) * 100);
    }

    getNivel(): number {
        return this.dbStats?.nivel || 1;
    }

    getExperiencia(): number {
        return this.dbStats?.experiencia || 0;
    }

    getExperienciaProximo(): number {
        return this.dbStats?.experienciaProximoNivel || 100;
    }

    getRacha(): number {
        return this.dbStats?.rachaActual || 0;
    }

    getMejorRacha(): number {
        return this.dbStats?.mejorRacha || 0;
    }

    getXpPercent(): number {
        const exp = this.getExperiencia();
        const next = this.getExperienciaProximo();
        return Math.min(100, Math.round((exp / Math.max(1, next)) * 100));
    }
}
