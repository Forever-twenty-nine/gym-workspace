import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RutinaAsignada } from 'gym-library';

// Tipos locales
type RutinaAsignadaConInfo = RutinaAsignada & {
  rutina?: any;
  tipoAsignacion?: string;
};

interface DiaInfo {
  fecha: Date;
  diaNombre: string;
  diaNumero: number;
  rutinas: RutinaAsignadaConInfo[];
  esHoy: boolean;
  fechaFormateada: string;
}

@Component({
  selector: 'app-rutinas-semanal',
  imports: [CommonModule],
  templateUrl: './rutinas-semanal.html',
  styleUrls: ['./rutinas-semanal.css']
})
export class RutinasSemanalComponent {

  // Inputs
  rutinasAsignadas = input.required<RutinaAsignadaConInfo[]>();
  entrenadoId = input.required<string>();

  // Output
  abrirModal = output<string>();

  // Función para obtener los próximos 7 días
  private getProximos7Dias(): DiaInfo[] {
    const dias: DiaInfo[] = [];
    const hoy = new Date();

    for (let i = 0; i < 7; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);

      const diaNumero = fecha.getDay();
      const nombresDias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const diaNombre = nombresDias[diaNumero];

      dias.push({
        fecha,
        diaNombre,
        diaNumero,
        rutinas: [], // Inicializar vacío, se llena después
        esHoy: false, // Se calcula después
        fechaFormateada: '' // Se calcula después
      });
    }

    return dias;
  }

  // Rutinas organizadas por días de la semana (vista semanal)
  readonly rutinasPorDia = computed(() => {
    const rutinasAsignadas = this.rutinasAsignadas();
    const proximos7Dias = this.getProximos7Dias();

    return proximos7Dias.map(diaInfo => {
      const rutinasDelDia: RutinaAsignadaConInfo[] = [];

      // Agregar rutinas asignadas por día de la semana
      rutinasAsignadas.forEach(item => {
        // Verificar si diaSemana es un array (múltiples días) o un string (día único)
        const diasAsignados = Array.isArray(item.diaSemana) ? item.diaSemana : [item.diaSemana];

        if (diasAsignados.includes(diaInfo.diaNombre)) {
          rutinasDelDia.push({
            ...item,
            tipoAsignacion: 'dia_semana'
          });
        }
      });

      // Agregar rutinas con fecha específica para este día
      rutinasAsignadas.forEach(item => {
        if (item.fechaEspecifica) {
          const fechaRutina = item.fechaEspecifica.toISOString().split('T')[0];
          const fechaDia = diaInfo.fecha.toISOString().split('T')[0];
          if (fechaRutina === fechaDia) {
            rutinasDelDia.push({
              ...item,
              tipoAsignacion: 'fecha_especifica'
            });
          }
        }
      });

      return {
        ...diaInfo,
        rutinas: rutinasDelDia,
        esHoy: diaInfo.fecha.toDateString() === new Date().toDateString(),
        fechaFormateada: diaInfo.fecha.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'short'
        })
      };
    });
  });

  // Verificar si no hay rutinas asignadas en toda la semana
  readonly noHayRutinasAsignadas = computed(() => {
    return this.rutinasPorDia().every(dia => dia.rutinas.length === 0);
  });

  // Método para abrir modal
  onAbrirModal(rutinaId: string) {
    this.abrirModal.emit(rutinaId);
  }
}
