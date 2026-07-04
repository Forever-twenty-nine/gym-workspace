import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, barbellOutline, fitnessOutline, calendarOutline, timeOutline } from 'ionicons/icons';
import { EstadisticasGeneralesEntrenador } from '../../../../../core/services/perfil-estadisticas.service';
import { NgApexchartsModule } from 'ng-apexcharts';

import {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexTheme
} from "ng-apexcharts";

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
  selector: 'app-entrenador-stats',
  standalone: true,
  imports: [
    CommonModule,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    NgApexchartsModule
],
  templateUrl: './entrenador-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadorStatsComponent {
  stats = input.required<EstadisticasGeneralesEntrenador>();
  
  isDarkMode = signal<boolean>(window.matchMedia('(prefers-color-scheme: dark)').matches);

  constructor() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.isDarkMode.set(e.matches);
    });
  }

  chartOptions = computed<ChartOptions>(() => {
    const s = this.stats();
    const sesiones = s.sesionesUltimos7Dias || [];
    
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

  objetivosChartOptions = computed<ChartOptions>(() => {
    const s = this.stats();
    const obj = s.distribucionObjetivo;
    return {
      series: [obj.salud, obj.volumen, obj.definicion, obj.fuerza],
      chart: {
        type: "donut",
        height: 250,
        toolbar: { show: false },
        background: 'transparent'
      },
      labels: ['Salud', 'Volumen', 'Definición', 'Fuerza'],
      colors: ['#2dd36f', '#3880ff', '#ffc409', '#eb445a'], // Success, Primary, Warning, Danger
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

  nivelChartOptions = computed<ChartOptions>(() => {
    const s = this.stats();
    const nivel = s.distribucionNivel;
    return {
      series: [nivel.principiante, nivel.intermedio, nivel.avanzado],
      chart: {
        type: "pie",
        height: 250,
        toolbar: { show: false },
        background: 'transparent'
      },
      labels: ['Principiante', 'Intermedio', 'Avanzado'],
      colors: ['#2fdf75', '#ffd534', '#ff4961'],
      dataLabels: {
        enabled: true,
      },
      theme: { mode: this.isDarkMode() ? 'dark' : 'light' },
      plotOptions: {},
      xaxis: { categories: [] },
      yaxis: {}
    } as any;
  });
}