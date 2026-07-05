import { Component, Input, computed, signal } from '@angular/core';
import {
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonNote,
    IonProgressBar,
    IonText,
    IonList
} from '@ionic/angular/standalone';

import { NgApexchartsModule, ApexAxisChartSeries, ApexNonAxisChartSeries, ApexChart, ApexDataLabels, ApexPlotOptions, ApexXAxis, ApexYAxis, ApexTheme } from 'ng-apexcharts';
import { EstadisticasGeneralesEntrenado } from '../../../../../core/services/perfil-estadisticas.service';

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  theme: ApexTheme;
  colors: string[];
  labels: string[];
};

@Component({
    selector: 'app-progreso-estadisticas',
    standalone: true,
    imports: [
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardSubtitle,
        IonCardContent,
        IonGrid,
        IonRow,
        IonCol,
        IonItem,
        IonLabel,
        IonNote,
        IonProgressBar,
        IonText,
        IonList,
        NgApexchartsModule
    ],
    templateUrl: './progreso-estadisticas.component.html'
})
export class ProgresoEstadisticasComponent {
    @Input() stats: EstadisticasGeneralesEntrenado | null = null;
    @Input() sesiones: import('gym-library').SesionRutina[] = [];
    @Input() dbStats: import('gym-library').EstadisticasEntrenado | null = null;

    isDarkMode = signal<boolean>(window.matchMedia('(prefers-color-scheme: dark)').matches);

    constructor() {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        this.isDarkMode.set(e.matches);
      });
    }

    // Computed chart data
    readonly topRutinas = computed(() => this.computeTopRutinas());
    readonly completionRate = computed(() => this.computeCompletionRate());

    formatearTiempo(minutos: number): string {
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;

        if (horas > 0) {
            return `${horas}h ${mins}m`;
        }
        return `${mins}m`;
    }

    areaChartOptions = computed<ChartOptions>(() => {
        const sesiones = this.stats?.sesionesUltimos7Dias || [];
        
        return {
          series: [
            {
              name: "Sesiones Completadas",
              data: sesiones.map(dia => dia.cantidad)
            }
          ],
          chart: {
            type: "area",
            height: 280,
            toolbar: { show: false },
            background: 'transparent'
          },
          colors: ['#3880ff'], // Primary ionic color
          plotOptions: {
            bar: {
              horizontal: false,
            }
          },
          dataLabels: {
            enabled: true,
            style: {
              colors: ['#3880ff']
            },
            background: {
              enabled: true,
              foreColor: '#ffffff',
              borderWidth: 0,
            }
          },
          xaxis: {
            categories: sesiones.map(dia => dia.fecha),
            labels: {
              style: {
                colors: '#8e8e93'
              }
            }
          },
          yaxis: {
            labels: {
              style: {
                colors: '#8e8e93',
                fontSize: '12px'
              }
            },
            min: 0,
            forceNiceScale: true,
            decimalsInFloat: 0
          },
          theme: {
            mode: this.isDarkMode() ? 'dark' : 'light'
          },
          labels: []
        };
    });

    donutChartOptions = computed<ChartOptions>(() => {
        const comp = this.stats?.completadas || 0;
        const prog = this.stats?.enProgreso || 0;
        
        return {
          series: [comp, prog],
          chart: {
            type: "donut",
            height: 250,
            toolbar: { show: false },
            background: 'transparent'
          },
          labels: ['Completadas', 'En Progreso'],
          colors: ['#2dd36f', '#ffc409'], // Success, Warning
          plotOptions: {
            pie: {
              donut: {
                size: '65%'
              }
            }
          },
          dataLabels: {
            enabled: false
          },
          theme: { mode: this.isDarkMode() ? 'dark' : 'light' },
          xaxis: { categories: [] },
          yaxis: {}
        } as any;
    });

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
