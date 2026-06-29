import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPopover,
    IonButton,
    IonIcon,
    IonAvatar,
    IonList,
    IonItem,
    IonLabel,
    IonListHeader
} from '@ionic/angular/standalone';
import { Entrenado } from 'gym-library';

@Component({
    selector: 'app-entrenado-detalle-popover',
    templateUrl: './entrenado-detalle-popover.component.html',
    styleUrls: ['./entrenado-detalle-popover.component.css'],
    standalone: true,
    imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonPopover,
    IonButton,
    IonAvatar,
    IonList,
    IonItem,
    IonLabel,
    IonListHeader
]
})
export class EntrenadoDetallePopoverComponent {
    isOpen = input.required<boolean>();
    entrenado = input<Entrenado | null>(null);
    estadisticas = input<any>(null);

    // Callbacks
    getUserName = input.required<(id: string) => string>();
    formatearTiempo = input.required<(segundos: number) => string>();
    getAntiguedadDias = input.required<(userId: string) => number | null>();

    close = output<void>();

    // Estadísticas generadas dinámicamente para iterar con @for
    itemsEstadisticas = computed(() => {
        const stats = this.estadisticas();
        const entr = this.entrenado();
        if (!stats) return [];

        const antiguedad = entr ? this.getAntiguedadDias()(entr.id) : null;

        return [
            {
                icon: 'fitness_center',
                color: 'primary',
                titulo: 'Rutinas asignadas',
                valor: `${stats.rutinasAsignadas} rutinas activas`
            },
            {
                icon: 'check_circle',
                color: 'success',
                titulo: 'Entrenamientos finalizados',
                valor: `${stats.completadas} sesiones`
            },
            {
                icon: 'whatshot',
                color: 'tertiary',
                titulo: 'Sesiones en progreso',
                valor: `${stats.enProgreso} sesiones`
            },
            {
                icon: 'schedule',
                color: 'warning',
                titulo: 'Tiempo total entrenado',
                valor: this.formatearTiempo()(stats.tiempoTotal)
            },
            {
                icon: 'calendar_month',
                color: 'medium',
                titulo: 'Antigüedad',
                valor: antiguedad !== null ? `${antiguedad} días` : 'Sin registro'
            }
        ];
    });
}
