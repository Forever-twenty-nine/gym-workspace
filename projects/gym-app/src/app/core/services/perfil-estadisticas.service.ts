import { Injectable, inject, computed, Signal } from '@angular/core';
import { RutinaService } from './rutina.service';
import { EntrenadoService } from './entrenado.service';
import { SesionRutinaService } from './sesion-rutina.service';
import { EstadisticasEntrenadoService } from './estadisticas-entrenado.service';
import { SesionRutina, User } from 'gym-library';

export interface EstadisticasGenerales {
  rutinasAsignadas: number;
  sesionesTotales: number;
  completadas: number;
  enProgreso: number;
  tiempoTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerfilEstadisticasService {
  private readonly rutinaService = inject(RutinaService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly sesionRutinaService = inject(SesionRutinaService);
  private readonly estadisticasDbService = inject(EstadisticasEntrenadoService);

  getEstadisticasGenerales(user: User): Signal<EstadisticasGenerales | null> {
    return computed(() => {
      if (user.role === 'entrenado') {
        const sesiones = this.getHistorialSesiones(user)();
        const rutinas = this.getRutinasAsignadas(user)();

        const completadas = sesiones.filter(s => s.completada).length;
        const enProgreso = sesiones.filter(s => !s.completada).length;
        const tiempoSegundos = sesiones.reduce((total, s) => total + (s.duracion || 0), 0);

        return {
          rutinasAsignadas: rutinas.length,
          sesionesTotales: sesiones.length,
          completadas,
          enProgreso,
          tiempoTotal: Math.round(tiempoSegundos / 60)
        };
      }
      
      // En el futuro: agregar lógica para 'entrenador' y 'gimnasio'
      return null; 
    });
  }

  getHistorialSesiones(user: User): Signal<SesionRutina[]> {
    return computed(() => {
      if (user.role === 'entrenado') {
        const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(user.uid)();
        return [...sesiones].sort((a, b) => {
          const dateA = a.fechaInicio instanceof Date ? a.fechaInicio : new Date(a.fechaInicio);
          const dateB = b.fechaInicio instanceof Date ? b.fechaInicio : new Date(b.fechaInicio);
          return dateB.getTime() - dateA.getTime();
        });
      }
      return [];
    });
  }

  getRutinasAsignadas(user: User) {
    return computed(() => {
      if (user.role === 'entrenado') {
        const rutinas = this.rutinaService.rutinas();
        const entrenado = this.entrenadoService.getEntrenado(user.uid)();
        if (!rutinas.length || !entrenado?.rutinasAsignadasIds) return [];
        return rutinas.filter(rutina => entrenado.rutinasAsignadasIds!.includes(rutina.id));
      }
      return [];
    });
  }

  getDbEstadisticas(user: User) {
    return computed(() => {
      if (user.role === 'entrenado') {
        return this.estadisticasDbService.getEstadisticas(user.uid)();
      }
      return null;
    });
  }
}
