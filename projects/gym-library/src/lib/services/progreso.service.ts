import { Injectable, computed, Signal, inject } from '@angular/core';
import { EntrenadoService } from './entrenado.service';
import { Entrenado } from '../models/entrenado.model';
import { ProgresoRutina, SesionRutina } from '../models/progreso-rutina.model';
import { EstadisticasEntrenado } from '../models/estadisticas-entrenado.model';

@Injectable({ providedIn: 'root' })
export class ProgresoService {
    private readonly entrenadoService = inject(EntrenadoService);

    // Configuración de sistema de niveles
    private readonly XP_BASE = 100; // XP necesario para nivel 1
    private readonly XP_MULTIPLICADOR = 1.5; // Multiplicador por nivel

    /**
     * 🏁 Inicia una rutina para un entrenado
     */
    async iniciarRutina(entrenadoId: string, rutinaId: string): Promise<void> {
        const entrenado = this.entrenadoService.entrenados().find((e: Entrenado) => e.id === entrenadoId);
        if (!entrenado) {
            throw new Error('Entrenado no encontrado');
        }

        const progresoRutinas = entrenado.progresoRutinas || [];
        const progresoExistente = progresoRutinas.find((p: ProgresoRutina) => p.rutinaId === rutinaId);

        if (progresoExistente) {
            // Actualizar fecha de inicio si ya existe
            progresoExistente.fechaInicio = new Date();
            progresoExistente.completado = false;
            progresoExistente.ejerciciosCompletados = [];
            progresoExistente.porcentajeProgreso = 0;
        } else {
            // Crear nuevo progreso
            const nuevoProgreso: ProgresoRutina = {
                rutinaId,
                fechaInicio: new Date(),
                vecesCompletada: 0,
                completado: false,
                ejerciciosCompletados: [],
                porcentajeProgreso: 0,
                sesiones: []
            };
            progresoRutinas.push(nuevoProgreso);
        }

        await this.entrenadoService.save({
            ...entrenado,
            progresoRutinas
        });
    }

    /**
     * ✅ Marca un ejercicio como completado
     */
    async completarEjercicio(
        entrenadoId: string, 
        rutinaId: string, 
        ejercicioId: string,
        totalEjercicios: number
    ): Promise<void> {
        const entrenado = this.entrenadoService.entrenados().find((e: Entrenado) => e.id === entrenadoId);
        if (!entrenado) {
            throw new Error('Entrenado no encontrado');
        }

        const progresoRutinas = entrenado.progresoRutinas || [];
        const progreso = progresoRutinas.find((p: ProgresoRutina) => p.rutinaId === rutinaId);

        if (!progreso) {
            throw new Error('Progreso de rutina no encontrado. Debes iniciar la rutina primero.');
        }

        // Agregar ejercicio si no está ya completado
        if (!progreso.ejerciciosCompletados.includes(ejercicioId)) {
            progreso.ejerciciosCompletados.push(ejercicioId);
            progreso.porcentajeProgreso = (progreso.ejerciciosCompletados.length / totalEjercicios) * 100;
        }

        await this.entrenadoService.save({
            ...entrenado,
            progresoRutinas
        });
    }

    /**
     * ❌ Desmarca un ejercicio como no completado
     */
    async descompletarEjercicio(
        entrenadoId: string, 
        rutinaId: string, 
        ejercicioId: string,
        totalEjercicios: number
    ): Promise<void> {
        const entrenado = this.entrenadoService.entrenados().find((e: Entrenado) => e.id === entrenadoId);
        if (!entrenado) {
            throw new Error('Entrenado no encontrado');
        }

        const progresoRutinas = entrenado.progresoRutinas || [];
        const progreso = progresoRutinas.find((p: ProgresoRutina) => p.rutinaId === rutinaId);

        if (!progreso) {
            throw new Error('Progreso de rutina no encontrado');
        }

        progreso.ejerciciosCompletados = progreso.ejerciciosCompletados.filter((id: string) => id !== ejercicioId);
        progreso.porcentajeProgreso = (progreso.ejerciciosCompletados.length / totalEjercicios) * 100;

        await this.entrenadoService.save({
            ...entrenado,
            progresoRutinas
        });
    }

    /**
     * 🏆 Completa una rutina
     */
    async completarRutina(
        entrenadoId: string, 
        rutinaId: string,
        duracionMinutos?: number
    ): Promise<void> {
        const entrenado = this.entrenadoService.entrenados().find((e: Entrenado) => e.id === entrenadoId);
        if (!entrenado) {
            throw new Error('Entrenado no encontrado');
        }

        const progresoRutinas = entrenado.progresoRutinas || [];
        const progreso = progresoRutinas.find((p: ProgresoRutina) => p.rutinaId === rutinaId);

        if (!progreso) {
            throw new Error('Progreso de rutina no encontrado');
        }

        const ahora = new Date();
        const sesion: SesionRutina = {
            fecha: ahora,
            duracion: duracionMinutos || this.calcularDuracion(progreso.fechaInicio, ahora),
            ejerciciosCompletados: progreso.ejerciciosCompletados.length,
            ejerciciosTotales: progreso.ejerciciosCompletados.length // Se puede pasar como parámetro si se conoce
        };

        progreso.sesiones = progreso.sesiones || [];
        progreso.sesiones.push(sesion);
        progreso.vecesCompletada++;
        progreso.completado = true;
        progreso.fechaUltimaCompletada = ahora;
        progreso.porcentajeProgreso = 100;

        // Actualizar estadísticas
        const estadisticas = this.actualizarEstadisticas(entrenado, sesion);

        await this.entrenadoService.save({
            ...entrenado,
            progresoRutinas,
            estadisticas
        });
    }

    /**
     * 🔄 Reinicia una rutina (para volverla a hacer)
     */
    async reiniciarRutina(entrenadoId: string, rutinaId: string): Promise<void> {
        const entrenado = this.entrenadoService.entrenados().find((e: Entrenado) => e.id === entrenadoId);
        if (!entrenado) {
            throw new Error('Entrenado no encontrado');
        }

        const progresoRutinas = entrenado.progresoRutinas || [];
        const progreso = progresoRutinas.find((p: ProgresoRutina) => p.rutinaId === rutinaId);

        if (progreso) {
            progreso.fechaInicio = new Date();
            progreso.completado = false;
            progreso.ejerciciosCompletados = [];
            progreso.porcentajeProgreso = 0;
        }

        await this.entrenadoService.save({
            ...entrenado,
            progresoRutinas
        });
    }

    /**
     * 📊 Obtiene el progreso de una rutina específica
     */
    getProgresoRutina(entrenadoId: string, rutinaId: string): Signal<ProgresoRutina | null> {
        return computed(() => {
            const entrenado = this.entrenadoService.entrenados().find((e: Entrenado) => e.id === entrenadoId);
            if (!entrenado) return null;

            return entrenado.progresoRutinas?.find((p: ProgresoRutina) => p.rutinaId === rutinaId) || null;
        });
    }

    /**
     * 📊 Obtiene todas las estadísticas de un entrenado
     */
    getEstadisticas(entrenadoId: string): Signal<EstadisticasEntrenado | null> {
        return computed(() => {
            const entrenado = this.entrenadoService.entrenados().find((e: Entrenado) => e.id === entrenadoId);
            return entrenado?.estadisticas || null;
        });
    }

    /**
     * 📊 Obtiene todas las rutinas en progreso (no completadas)
     */
    getRutinasEnProgreso(entrenadoId: string): Signal<ProgresoRutina[]> {
        return computed(() => {
            const entrenado = this.entrenadoService.entrenados().find((e: Entrenado) => e.id === entrenadoId);
            if (!entrenado) return [];

            return entrenado.progresoRutinas?.filter((p: ProgresoRutina) => !p.completado && p.porcentajeProgreso > 0) || [];
        });
    }

    /**
     * 📊 Obtiene todas las rutinas completadas
     */
    getRutinasCompletadas(entrenadoId: string): Signal<ProgresoRutina[]> {
        return computed(() => {
            const entrenado = this.entrenadoService.entrenados().find((e: Entrenado) => e.id === entrenadoId);
            if (!entrenado) return [];

            return entrenado.progresoRutinas?.filter((p: ProgresoRutina) => p.completado) || [];
        });
    }

    /**
     * ⏱️ Calcula la duración entre dos fechas en minutos
     */
    private calcularDuracion(inicio?: Date, fin?: Date): number {
        if (!inicio || !fin) return 0;
        const diff = fin.getTime() - inicio.getTime();
        return Math.round(diff / 60000); // Convertir a minutos
    }

    /**
     * 📈 Actualiza las estadísticas del entrenado
     */
    private actualizarEstadisticas(entrenado: Entrenado, sesion: SesionRutina): EstadisticasEntrenado {
        const estadisticas = entrenado.estadisticas || this.crearEstadisticasIniciales();

        // Incrementar contador de rutinas completadas
        estadisticas.totalRutinasCompletadas++;

        // Calcular racha
        const { rachaActual, mejorRacha } = this.calcularRacha(
            entrenado.progresoRutinas || [],
            sesion.fecha
        );
        estadisticas.rachaActual = rachaActual;
        estadisticas.mejorRacha = Math.max(mejorRacha, estadisticas.mejorRacha);
        estadisticas.ultimaFechaEntrenamiento = sesion.fecha;

        // Calcular experiencia y nivel
        const xpGanado = this.calcularXP(sesion);
        estadisticas.experiencia += xpGanado;

        // Calcular nivel basado en experiencia
        const nuevoNivel = this.calcularNivel(estadisticas.experiencia);
        if (nuevoNivel > estadisticas.nivel) {
            estadisticas.nivel = nuevoNivel;
        }
        estadisticas.experienciaProximoNivel = this.calcularXPProximoNivel(estadisticas.nivel);

        return estadisticas;
    }

    /**
     * 🎯 Crea estadísticas iniciales
     */
    private crearEstadisticasIniciales(): EstadisticasEntrenado {
        return {
            totalRutinasCompletadas: 0,
            rachaActual: 0,
            mejorRacha: 0,
            nivel: 1,
            experiencia: 0,
            experienciaProximoNivel: this.XP_BASE
        };
    }

    /**
     * 🔥 Calcula la racha de entrenamiento
     */
    private calcularRacha(progresoRutinas: ProgresoRutina[], fechaActual: Date): { rachaActual: number; mejorRacha: number } {
        // Obtener todas las fechas de sesiones
        const fechasSesiones: Date[] = [];
        progresoRutinas.forEach(progreso => {
            if (progreso.sesiones) {
                progreso.sesiones.forEach(sesion => {
                    fechasSesiones.push(new Date(sesion.fecha));
                });
            }
        });

        // Ordenar fechas de más reciente a más antigua
        fechasSesiones.sort((a, b) => b.getTime() - a.getTime());

        if (fechasSesiones.length === 0) {
            return { rachaActual: 1, mejorRacha: 1 };
        }

        let rachaActual = 1;
        let mejorRacha = 1;
        let rachaTemp = 1;

        // Normalizar fechas (solo día, sin hora)
        const normalizarFecha = (fecha: Date) => {
            const f = new Date(fecha);
            f.setHours(0, 0, 0, 0);
            return f;
        };

        const hoy = normalizarFecha(fechaActual);
        const fechaMasReciente = normalizarFecha(fechasSesiones[0]);

        // Verificar si la fecha más reciente es hoy o ayer
        const diffDias = Math.floor((hoy.getTime() - fechaMasReciente.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDias > 1) {
            // Racha rota
            return { rachaActual: 0, mejorRacha };
        }

        // Calcular racha actual y mejor racha
        for (let i = 0; i < fechasSesiones.length - 1; i++) {
            const fechaActualNorm = normalizarFecha(fechasSesiones[i]);
            const fechaSiguienteNorm = normalizarFecha(fechasSesiones[i + 1]);
            
            const diff = Math.floor((fechaActualNorm.getTime() - fechaSiguienteNorm.getTime()) / (1000 * 60 * 60 * 24));

            if (diff === 1) {
                rachaTemp++;
                mejorRacha = Math.max(mejorRacha, rachaTemp);
            } else if (diff > 1) {
                rachaTemp = 1;
            }
        }

        rachaActual = rachaTemp;

        return { rachaActual, mejorRacha };
    }

    /**
     * ⭐ Calcula XP ganado por sesión
     */
    private calcularXP(sesion: SesionRutina): number {
        let xp = 50; // XP base por completar rutina

        // Bonus por ejercicios completados
        if (sesion.ejerciciosCompletados && sesion.ejerciciosTotales) {
            const porcentaje = sesion.ejerciciosCompletados / sesion.ejerciciosTotales;
            xp += Math.round(porcentaje * 50);
        }

        // Bonus por duración (máximo 30 minutos de bonus)
        if (sesion.duracion) {
            xp += Math.min(sesion.duracion, 30);
        }

        return xp;
    }

    /**
     * 📊 Calcula el nivel basado en experiencia
     */
    private calcularNivel(experiencia: number): number {
        let nivel = 1;
        let xpRequerido = 0;

        while (xpRequerido <= experiencia) {
            xpRequerido += Math.round(this.XP_BASE * Math.pow(this.XP_MULTIPLICADOR, nivel - 1));
            if (xpRequerido <= experiencia) {
                nivel++;
            }
        }

        return nivel;
    }

    /**
     * 🎯 Calcula XP necesario para el próximo nivel
     */
    private calcularXPProximoNivel(nivelActual: number): number {
        return Math.round(this.XP_BASE * Math.pow(this.XP_MULTIPLICADOR, nivelActual));
    }

    /**
     * 📈 Obtiene el progreso hacia el próximo nivel (0-100)
     */
    getProgresoNivel(entrenadoId: string): Signal<number> {
        return computed(() => {
            const estadisticas = this.getEstadisticas(entrenadoId)();
            if (!estadisticas) return 0;

            const xpNivelAnterior = this.calcularXPProximoNivel(estadisticas.nivel - 1);
            const xpNivelActual = estadisticas.experienciaProximoNivel;
            const xpEnNivel = estadisticas.experiencia - xpNivelAnterior;
            const xpRequerido = xpNivelActual - xpNivelAnterior;

            return Math.round((xpEnNivel / xpRequerido) * 100);
        });
    }
}
