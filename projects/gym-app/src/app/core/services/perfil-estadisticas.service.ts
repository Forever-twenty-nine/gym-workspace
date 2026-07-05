import { Injectable, inject, computed, Signal } from '@angular/core';
import { RutinaService } from './rutina.service';
import { EjercicioService } from './ejercicio.service';
import { EntrenadoService } from './entrenado.service';
import { EntrenadorService } from './entrenador.service';
import { SesionRutinaService } from './sesion-rutina.service';
import { EstadisticasEntrenadoService } from './estadisticas-entrenado.service';
import { InvitacionService } from './invitacion.service';
import { UserService } from './user.service';
import { SesionRutina, User } from 'gym-library';

export interface EstadisticasGeneralesEntrenado {
  rutinasAsignadas: number;
  sesionesTotales: number;
  completadas: number;
  enProgreso: number;
  tiempoTotal: number;
  sesionesUltimos7Dias: SesionesPorDia[];
}

export interface SesionesPorDia {
  fecha: string;
  cantidad: number;
}

export interface EstadisticasGeneralesEntrenador {
  entrenadosAsignados: number;
  rutinasCreadas: number;
  ejerciciosCreados: number;
  gimnasiosCount: number;
  sesionesTotalesDeTusEntrenados: number;
  rutinasAsignadasActivas: number;
  sesionesUltimos7Dias: SesionesPorDia[];
  distribucionNivel: DesgloseNivel;
  distribucionObjetivo: DesgloseObjetivo;
}

export interface DesgloseNivel {
  total: number;
  principiante: number;
  intermedio: number;
  avanzado: number;
}

export interface DesgloseObjetivo {
  total: number;
  salud: number;
  volumen: number;
  definicion: number;
  fuerza: number;
}

export interface EstadisticasGeneralesGimnasio {
  totalUsuarios: number;
  usuariosActivos: number;
  tasaActivacion: number;

  totalEntrenadores: number;
  entrenadoresActivos: number;
  promedioEntrenadosPorEntrenador: number;
  rutinasCreadasPorEntrenadores: number;
  invitacionesPendientes: number;

  totalEntrenados: number;
  entrenadosActivos: number;
  entrenadosSinEntrenador: number;

  sesionesUltimos7Dias: SesionesPorDia[];

  distribucionNivel: DesgloseNivel;
  distribucionObjetivo: DesgloseObjetivo;
}

@Injectable({
  providedIn: 'root'
})
export class PerfilEstadisticasService {
  private readonly rutinaService = inject(RutinaService);
  private readonly ejercicioService = inject(EjercicioService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly sesionRutinaService = inject(SesionRutinaService);
  private readonly estadisticasDbService = inject(EstadisticasEntrenadoService);
  private readonly invitacionService = inject(InvitacionService);
  private readonly userService = inject(UserService);

  // ============================================================
  // 🧑‍🏫 ENTRENADO
  // ============================================================

  getEstadisticasGenerales(user: User): Signal<EstadisticasGeneralesEntrenado | null> {
    return computed(() => {
      if (user.role === 'entrenado') {
        const sesiones = this.getHistorialSesiones(user)();
        const rutinas = this.getRutinasAsignadas(user)();

        const completadas = sesiones.filter(s => s.completada).length;
        const enProgreso = sesiones.filter(s => !s.completada).length;
        const tiempoSegundos = sesiones.reduce((total, s) => total + (s.duracion || 0), 0);

        // Calcular últimos 7 días
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hace7Dias = new Date(hoy);
        hace7Dias.setDate(hace7Dias.getDate() - 6);

        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const sesionesPorDiaMap = new Map<string, number>();

        for (let i = 0; i < 7; i++) {
          const d = new Date(hace7Dias);
          d.setDate(d.getDate() + i);
          const diaStr = `${d.getDate()}/${d.getMonth()+1} - ${diasSemana[d.getDay()]}`;
          sesionesPorDiaMap.set(diaStr, 0);
        }

        sesiones.forEach(s => {
          const fechaSesion = s.fechaInicio instanceof Date ? s.fechaInicio : new Date(s.fechaInicio);
          fechaSesion.setHours(0, 0, 0, 0);
          if (fechaSesion >= hace7Dias && fechaSesion <= hoy) {
             const diaStr = `${fechaSesion.getDate()}/${fechaSesion.getMonth()+1} - ${diasSemana[fechaSesion.getDay()]}`;
             if (sesionesPorDiaMap.has(diaStr)) {
               sesionesPorDiaMap.set(diaStr, sesionesPorDiaMap.get(diaStr)! + 1);
             }
          }
        });

        const sesionesUltimos7Dias: SesionesPorDia[] = Array.from(sesionesPorDiaMap.entries()).map(([fecha, cantidad]) => ({ fecha, cantidad }));

        return {
          rutinasAsignadas: rutinas.length,
          sesionesTotales: sesiones.length,
          completadas,
          enProgreso,
          tiempoTotal: Math.round(tiempoSegundos / 60),
          sesionesUltimos7Dias
        };
      }
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

  // ============================================================
  // 🏋️ ENTRENADOR
  // ============================================================

  getEstadisticasEntrenador(user: User): Signal<EstadisticasGeneralesEntrenador | null> {
    return computed(() => {
      if (user.role !== 'entrenador') return null;

      const entrenador = this.entrenadorService.getEntrenadorById(user.uid)();
      const entrenadorId = user.uid;

      // Entrenados asignados (los que tienen al entrenador en su array)
      const entrenadosAsignados = this.entrenadoService.entrenados()
        .filter(e => e.entrenadoresId?.includes(entrenadorId));

      // Sesiones de tus entrenados (agregadas)
      let sesionesTotales = 0;
      const sesionesTodosLosEntrenados: SesionRutina[] = [];
      entrenadosAsignados.forEach(e => {
        const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(e.id)();
        sesionesTotales += sesiones.length;
        sesionesTodosLosEntrenados.push(...sesiones);
      });

      // Calcular últimos 7 días
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hace7Dias = new Date(hoy);
      hace7Dias.setDate(hace7Dias.getDate() - 6);

      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const sesionesPorDiaMap = new Map<string, number>();

      // Inicializar el map con los últimos 7 días en orden
      for (let i = 0; i < 7; i++) {
        const d = new Date(hace7Dias);
        d.setDate(d.getDate() + i);
        const diaStr = `${d.getDate()}/${d.getMonth()+1} - ${diasSemana[d.getDay()]}`;
        sesionesPorDiaMap.set(diaStr, 0);
      }

      sesionesTodosLosEntrenados.forEach(s => {
        const fechaSesion = s.fechaInicio instanceof Date ? s.fechaInicio : new Date(s.fechaInicio);
        fechaSesion.setHours(0, 0, 0, 0);
        if (fechaSesion >= hace7Dias && fechaSesion <= hoy) {
           const diaStr = `${fechaSesion.getDate()}/${fechaSesion.getMonth()+1} - ${diasSemana[fechaSesion.getDay()]}`;
           if (sesionesPorDiaMap.has(diaStr)) {
             sesionesPorDiaMap.set(diaStr, sesionesPorDiaMap.get(diaStr)! + 1);
           }
        }
      });

      const sesionesUltimos7Dias: SesionesPorDia[] = Array.from(sesionesPorDiaMap.entries()).map(([fecha, cantidad]) => ({ fecha, cantidad }));

      // Rutinas asignadas activas (rutinas que este entrenador tiene asignadas y están activas)
      const rutinasAsignadasActivas = entrenador?.rutinasCreadasIds?.length || 0;

      // Desglose por nivel
      let principiante = 0;
      let intermedio = 0;
      let avanzado = 0;
      // Desglose por objetivo
      let salud = 0;
      let volumen = 0;
      let definicion = 0;
      let fuerza = 0;

      entrenadosAsignados.forEach(tp => {
        const lvl = tp.nivel?.toLowerCase();
        if (lvl === 'novato' || lvl === 'principiante') principiante++;
        else if (lvl === 'intermedio') intermedio++;
        else if (lvl === 'avanzado' || lvl === 'experto') avanzado++;

        const obj = tp.objetivo?.toLowerCase();
        if (obj === 'salud') salud++;
        else if (obj === 'volumen') volumen++;
        else if (obj === 'definicion') definicion++;
        else if (obj === 'fuerza') fuerza++;
      });

      const totalEntrenados = entrenador?.entrenadosAsignadosIds?.length || entrenadosAsignados.length;

      return {
        entrenadosAsignados: totalEntrenados,
        rutinasCreadas: this.rutinaService.rutinas().filter(r => r.creadorId === user.uid).length,
        ejerciciosCreados: this.ejercicioService.ejercicios().filter(e => e.creadorId === user.uid).length,
        gimnasiosCount: entrenador?.gimnasioId?.length || 0,
        sesionesTotalesDeTusEntrenados: sesionesTotales,
        rutinasAsignadasActivas,
        sesionesUltimos7Dias,
        distribucionNivel: {
          total: totalEntrenados,
          principiante,
          intermedio,
          avanzado,
        },
        distribucionObjetivo: {
          total: totalEntrenados,
          salud,
          volumen,
          definicion,
          fuerza,
        },
      };
    });
  }

  // ============================================================
  // 🏢 GIMNASIO
  // ============================================================

  getEstadisticasGimnasio(user: User): Signal<EstadisticasGeneralesGimnasio | null> {
    return computed(() => {
      if (user.role !== 'gimnasio') return null;

      const gymId = user.uid;

      // 1. Usuarios asociados a este gimnasio
      const gymUsers = this.userService.users().filter(u => u.gimnasioId === gymId);
      const totalUsuarios = gymUsers.length;
      const usuariosActivos = gymUsers.filter(u => u.onboarded).length;
      const tasaActivacion = totalUsuarios > 0 ? Math.round((usuariosActivos / totalUsuarios) * 100) : 0;

      // 2. Entrenadores del gimnasio
      const trainers = gymUsers.filter(u => u.role === 'entrenador');
      const totalEntrenadores = trainers.length;
      const entrenadoresActivos = trainers.filter(t => t.onboarded).length;
      const trainerIds = trainers.map(t => t.uid);

      const trainerProfiles = this.entrenadorService.entrenadores();
      const gymTrainerProfiles = trainerProfiles.filter(tp => trainerIds.includes(tp.id!));
      const totalAsignados = gymTrainerProfiles.reduce((acc, tp) => acc + (tp.entrenadosAsignadosIds?.length || 0), 0);
      const promedioEntrenadosPorEntrenador = totalEntrenadores > 0
        ? parseFloat((totalAsignados / totalEntrenadores).toFixed(1))
        : 0;

      const rutinasCreadasPorEntrenadores = this.rutinaService.rutinas()
        .filter(r => r.creadorId && trainerIds.includes(r.creadorId)).length;

      const invitacionesPendientes = this.invitacionService.invitaciones().filter(inv =>
        inv.remitenteId === gymId &&
        inv.tipo === 'gimnasio_a_entrenador' &&
        inv.estado === 'pendiente' &&
        inv.activa
      ).length;

      // 3. Entrenados del gimnasio
      const trainees = gymUsers.filter(u => u.role === 'entrenado');
      const totalEntrenados = trainees.length;
      const entrenadosActivos = trainees.filter(t => t.onboarded).length;
      const traineeIds = trainees.map(t => t.uid);

      const traineeProfiles = this.entrenadoService.entrenados();
      const gymTraineeProfiles = traineeProfiles.filter(tp => traineeIds.includes(tp.id!));
      const entrenadosSinEntrenador = gymTraineeProfiles
        .filter(tp => !tp.entrenadoresId || tp.entrenadoresId.length === 0).length;

      // Desglose por nivel
      let principiante = 0;
      let intermedio = 0;
      let avanzado = 0;
      // Desglose por objetivo
      let salud = 0;
      let volumen = 0;
      let definicion = 0;
      let fuerza = 0;

      gymTraineeProfiles.forEach(tp => {
        const lvl = tp.nivel?.toLowerCase();
        if (lvl === 'novato' || lvl === 'principiante') principiante++;
        else if (lvl === 'intermedio') intermedio++;
        else if (lvl === 'avanzado' || lvl === 'experto') avanzado++;

        const obj = tp.objetivo?.toLowerCase();
        if (obj === 'salud') salud++;
        else if (obj === 'volumen') volumen++;
        else if (obj === 'definicion') definicion++;
        else if (obj === 'fuerza') fuerza++;
      });

      // Sesiones de todos los entrenados del gimnasio
      const sesionesTotalesGym: SesionRutina[] = [];
      gymTraineeProfiles.forEach(tp => {
        const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(tp.id!)();
        sesionesTotalesGym.push(...sesiones);
      });

      // Calcular últimos 7 días
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hace7Dias = new Date(hoy);
      hace7Dias.setDate(hace7Dias.getDate() - 6);

      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const sesionesPorDiaMap = new Map<string, number>();

      for (let i = 0; i < 7; i++) {
        const d = new Date(hace7Dias);
        d.setDate(d.getDate() + i);
        const diaStr = `${d.getDate()}/${d.getMonth()+1} - ${diasSemana[d.getDay()]}`;
        sesionesPorDiaMap.set(diaStr, 0);
      }

      sesionesTotalesGym.forEach(s => {
        const fechaSesion = s.fechaInicio instanceof Date ? s.fechaInicio : new Date(s.fechaInicio);
        fechaSesion.setHours(0, 0, 0, 0);
        if (fechaSesion >= hace7Dias && fechaSesion <= hoy) {
           const diaStr = `${fechaSesion.getDate()}/${fechaSesion.getMonth()+1} - ${diasSemana[fechaSesion.getDay()]}`;
           if (sesionesPorDiaMap.has(diaStr)) {
             sesionesPorDiaMap.set(diaStr, sesionesPorDiaMap.get(diaStr)! + 1);
           }
        }
      });

      const sesionesUltimos7Dias: SesionesPorDia[] = Array.from(sesionesPorDiaMap.entries()).map(([fecha, cantidad]) => ({ fecha, cantidad }));

      return {
        totalUsuarios,
        usuariosActivos,
        tasaActivacion,

        totalEntrenadores,
        entrenadoresActivos,
        promedioEntrenadosPorEntrenador,
        rutinasCreadasPorEntrenadores,
        invitacionesPendientes,

        totalEntrenados,
        entrenadosActivos,
        entrenadosSinEntrenador,

        sesionesUltimos7Dias,

        distribucionNivel: {
          total: totalEntrenados,
          principiante,
          intermedio,
          avanzado,
        },
        distribucionObjetivo: {
          total: totalEntrenados,
          salud,
          volumen,
          definicion,
          fuerza,
        },
      };
    });
  }
}