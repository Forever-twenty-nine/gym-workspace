import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import {
    Firestore,
    collection,
    doc,
    addDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
    QuerySnapshot,
    DocumentSnapshot,
    Timestamp,
    query,
    where
} from 'firebase/firestore';

import { RutinaAsignada, Notificacion, TipoNotificacion } from 'gym-library';
import { NotificacionService } from './notificacion.service';
import { RutinaService } from './rutina.service';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';

@Injectable({ providedIn: 'root' })
export class RutinaAsignadaService {
    private readonly firestore = inject(FIRESTORE);
    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION = 'rutinas-asignadas';

    private readonly _rutinasAsignadas: WritableSignal<RutinaAsignada[]> = signal<RutinaAsignada[]>([]);
    private readonly rutinaAsignadaSignals = new Map<string, WritableSignal<RutinaAsignada | null>>();
    private isListenerInitialized = false;

    // Servicios auxiliares
    private readonly notificacionService: NotificacionService = inject(NotificacionService);
    private readonly rutinaService: RutinaService = inject(RutinaService);

    constructor() { }

    /**
     * Ejecuta el callback en el contexto correcto (zona o inyección)
     */
    private runInZone<T>(callback: () => T | Promise<T>): T | Promise<T> {
        if (this.zoneRunner) {
            return this.zoneRunner.run(callback);
        }
        return runInInjectionContext(this.injector, callback as any);
    }

    /**
     * 🔄 Inicializa el listener de Firestore de forma segura
     */
    private initializeListener(): void {
        if (this.isListenerInitialized) return;

        try {
            const col = collection(this.firestore, this.COLLECTION);
            onSnapshot(col, (snap: QuerySnapshot) => {
                this.runInZone(() => {
                    const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                    this._rutinasAsignadas.set(list);
                });
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de rutinas asignadas:', e);
        }
    }

    /**
     * 📡 Suscribe a cambios en una rutina asignada específica
     */
    subscribeToRutinaAsignada(id: string): Signal<RutinaAsignada | null> {
        if (!this.rutinaAsignadaSignals.has(id)) {
            const rutinaSignal = signal<RutinaAsignada | null>(null);
            this.rutinaAsignadaSignals.set(id, rutinaSignal);

            const rutinaAsignadaRef = doc(this.firestore, this.COLLECTION, id);
            onSnapshot(rutinaAsignadaRef, (docSnap: DocumentSnapshot) => {
                this.runInZone(() => {
                    if (docSnap.exists()) {
                        rutinaSignal.set(this.mapFromFirestore({ ...docSnap.data(), id: docSnap.id }));
                    } else {
                        rutinaSignal.set(null);
                    }
                });
            });
        }
        return this.rutinaAsignadaSignals.get(id)!.asReadonly();
    }

    /**
     * 🔍 Obtiene todas las rutinas asignadas
     */
    getRutinasAsignadas(): Signal<RutinaAsignada[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return this._rutinasAsignadas.asReadonly();
    }

    /**
     * 🔍 Obtiene rutinas asignadas por entrenado
     */
    getRutinasAsignadasByEntrenado(entrenadoId: string): Signal<RutinaAsignada[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return computed(() =>
            this._rutinasAsignadas().filter(ra => ra.entrenadoId === entrenadoId)
        );
    }

    /**
     * 🔍 Obtiene rutinas asignadas por entrenador
     */
    getRutinasAsignadasByEntrenador(entrenadorId: string): Signal<RutinaAsignada[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return computed(() =>
            this._rutinasAsignadas().filter(ra => ra.entrenadorId === entrenadorId)
        );
    }

    /**
     * 🔍 Obtiene rutinas asignadas por rutina
     */
    getRutinasAsignadasByRutina(rutinaId: string): Signal<RutinaAsignada[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return computed(() =>
            this._rutinasAsignadas().filter(ra => ra.rutinaId === rutinaId)
        );
    }

    /**
     * 🔍 Obtiene rutinas asignadas activas por entrenado
     */
    getRutinasAsignadasActivasByEntrenado(entrenadoId: string): Signal<RutinaAsignada[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return computed(() =>
            this._rutinasAsignadas().filter(ra =>
                ra.entrenadoId === entrenadoId && ra.activa
            )
        );
    }

    /**
     * 🕒 Obtiene las próximas 3 rutinas para el dashboard de un entrenado
     * Encapsula la lógica de búsqueda en los próximos 7 días y relleno con rutinas del entrenado.
     */
    getProximasRutinasDashboard(userId: string, rutinasEntrenado: any[]): Signal<any[]> {
        return computed(() => {
            const rutinas = this.rutinaService.rutinas();
            const asignaciones = this.getRutinasAsignadasByEntrenado(userId)();
            const rutinasDelEntrenado = rutinasEntrenado;

            if (!rutinas.length) return [];

            const hoy = new Date();
            const proximas: any[] = [];
            const idsAgregados = new Set<string>();
            const nombresAgregados = new Set<string>();

            const diasSemanaSinTilde = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
            const diaCortoArr = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            const diasSemanaMapa: Record<string, string> = {
                'domingo': 'domingo', 'lunes': 'lunes', 'martes': 'martes',
                'miercoles': 'miercoles', 'jueves': 'jueves', 'viernes': 'viernes',
                'sabado': 'sabado', 'dom': 'domingo', 'lun': 'lunes', 'mar': 'martes',
                'mie': 'miercoles', 'jue': 'jueves', 'vie': 'viernes', 'sab': 'sabado'
            };

            for (let i = 0; i < 7 && proximas.length < 3; i++) {
                const fechaBucle = new Date(hoy);
                fechaBucle.setDate(hoy.getDate() + i);

                const diaSemanaIndex = fechaBucle.getDay();
                const diaSemanaNombre = diasSemanaSinTilde[diaSemanaIndex];
                const esHoy = i === 0;

                const asignacionesDelDia = asignaciones.filter(asig => {
                    if (!asig.diaSemana) return false;
                    const diaAsigNorm = asig.diaSemana.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    return (diasSemanaMapa[diaAsigNorm] || diaAsigNorm) === diaSemanaNombre;
                });

                for (const asig of asignacionesDelDia) {
                    if (proximas.length >= 3) break;
                    const rId = asig.rutinaId;
                    if (!rId || idsAgregados.has(rId)) continue;

                    const rutinaOriginal = rutinas.find(r => r.id === rId);
                    if (rutinaOriginal) {
                        if (nombresAgregados.has(rutinaOriginal.nombre)) continue;
                        idsAgregados.add(rId);
                        nombresAgregados.add(rutinaOriginal.nombre);

                        proximas.push({
                            ...rutinaOriginal,
                            asignadoPor: 'Entrenador',
                            diaCorto: esHoy ? 'Hoy' : diaCortoArr[diaSemanaIndex],
                            esEjecutable: esHoy
                        });
                    }
                }
            }

            if (proximas.length < 3 && rutinasDelEntrenado.length > 0) {
                for (const rutina of rutinasDelEntrenado) {
                    if (proximas.length >= 3) break;
                    if (!idsAgregados.has(rutina.id) && !nombresAgregados.has(rutina.nombre)) {
                        idsAgregados.add(rutina.id);
                        nombresAgregados.add(rutina.nombre);
                        proximas.push({
                            ...rutina,
                            asignadoPor: 'Entrenador',
                            diaCorto: '',
                            esEjecutable: false
                        });
                    }
                }
            }

            return proximas;
        });
    }

    /**
     * 💾 Guarda una rutina asignada
     */
    async save(rutinaAsignada: RutinaAsignada): Promise<void> {
        return this.runInZone(async () => {
            const dataToSave = this.mapToFirestore(rutinaAsignada);
            if (rutinaAsignada.id) {
                const rutinaAsignadaRef = doc(this.firestore, this.COLLECTION, rutinaAsignada.id);
                await setDoc(rutinaAsignadaRef, dataToSave, { merge: true });
            } else {
                const col = collection(this.firestore, this.COLLECTION);
                const docRef = await addDoc(col, dataToSave);
                rutinaAsignada.id = docRef.id;
            }
        });
    }

    /**
     * 🗑️ Elimina una rutina asignada
     */
    async delete(id: string): Promise<void> {
        return this.runInZone(async () => {
            const rutinaAsignadaRef = doc(this.firestore, this.COLLECTION, id);
            await deleteDoc(rutinaAsignadaRef);
        });
    }

    /**
     * 🔄 Actualiza el estado de una rutina asignada
     */
    async toggleActiva(id: string): Promise<void> {
        const rutinas = this.getRutinasAsignadas()();
        const rutinaAsignada = rutinas.find(ra => ra.id === id);
        if (rutinaAsignada) {
            const updated = { ...rutinaAsignada, activa: !rutinaAsignada.activa };
            await this.save(updated);
        }
    }

    /**
     * Crea notificaciones de recordatorio para rutinas próximas de un entrenado en una ventana dada (por defecto 24h).
     */
    async checkAndNotifyRutinasProximas(entrenadoId: string, windowHours: number = 24): Promise<void> {
        const ahora = new Date();
        const ventanaMs = windowHours * 60 * 60 * 1000;
        const limite = new Date(ahora.getTime() + ventanaMs);

        const asignadas = this.getRutinasAsignadasActivasByEntrenado(entrenadoId)();
        if (!asignadas || asignadas.length === 0) return;

        for (const ra of asignadas) {
            const fechaObjetivo = this.calcularProximaFechaObjetivo(ra, ahora);
            if (!fechaObjetivo) continue;

            if (fechaObjetivo.getTime() >= ahora.getTime() && fechaObjetivo.getTime() <= limite.getTime()) {
                const yyyyMMdd = this.formatearYYYYMMDD(fechaObjetivo);
                const notifId = `notif-rutina-proxima-${ra.id}-${yyyyMMdd}`;

                const rutina = this.rutinaService.rutinas().find(r => r.id === ra.rutinaId);
                const nombreRutina = rutina?.nombre || 'tu rutina asignada';

                const notificacion: Notificacion = {
                    id: notifId,
                    usuarioId: entrenadoId,
                    tipo: TipoNotificacion.RECORDATORIO,
                    titulo: 'Rutina próxima',
                    mensaje: `Tienes ${nombreRutina} próximamente (${fechaObjetivo.toLocaleDateString('es-ES')}).`,
                    leida: false,
                    datos: {
                        rutinaAsignadaId: ra.id,
                        rutinaId: ra.rutinaId,
                        fechaObjetivo: fechaObjetivo,
                    },
                    fechaCreacion: new Date()
                };

                try {
                    await this.notificacionService.save(notificacion);
                } catch (e) {
                    console.warn('No se pudo guardar notificación de rutina próxima:', e);
                }
            }
        }
    }

    private calcularProximaFechaObjetivo(ra: RutinaAsignada, referencia: Date): Date | null {
        if (ra.fechaEspecifica) {
            return new Date(ra.fechaEspecifica);
        }

        if (ra.diaSemana) {
            const targetDow = this.mapDiaSemana(ra.diaSemana);
            if (targetDow === null) return null;
            const ref = new Date(referencia);
            const diff = (targetDow - ref.getDay() + 7) % 7;
            const proxima = new Date(ref);
            proxima.setHours(23, 59, 59, 999);
            proxima.setDate(ref.getDate() + diff);
            return proxima;
        }

        return null;
    }

    private formatearYYYYMMDD(d: Date): string {
        const y = d.getFullYear();
        const m = `${d.getMonth() + 1}`.padStart(2, '0');
        const day = `${d.getDate()}`.padStart(2, '0');
        return `${y}${m}${day}`;
    }

    private mapDiaSemana(dia: string): number | null {
        const v = dia.trim().toLowerCase();
        const map: Record<string, number> = {
            'domingo': 0, 'dom': 0, 'sun': 0, 'sunday': 0,
            'lunes': 1, 'lun': 1, 'mon': 1, 'monday': 1,
            'martes': 2, 'mar': 2, 'tue': 2, 'tuesday': 2,
            'miercoles': 3, 'miércoles': 3, 'mie': 3, 'mié': 3, 'wed': 3, 'wednesday': 3,
            'jueves': 4, 'jue': 4, 'thu': 4, 'thursday': 4,
            'viernes': 5, 'vie': 5, 'fri': 5, 'friday': 5,
            'sabado': 6, 'sábado': 6, 'sab': 6, 'sáb': 6, 'sat': 6, 'saturday': 6,
        };
        return map[v] ?? null;
    }

    private mapToFirestore(rutinaAsignada: RutinaAsignada): any {
        return {
            rutinaId: rutinaAsignada.rutinaId,
            entrenadoId: rutinaAsignada.entrenadoId,
            entrenadorId: rutinaAsignada.entrenadorId,
            diaSemana: rutinaAsignada.diaSemana || null,
            fechaEspecifica: rutinaAsignada.fechaEspecifica ? Timestamp.fromDate(rutinaAsignada.fechaEspecifica) : null,
            fechaAsignacion: rutinaAsignada.fechaAsignacion ? Timestamp.fromDate(rutinaAsignada.fechaAsignacion) : Timestamp.now(),
            activa: rutinaAsignada.activa
        };
    }

    private mapFromFirestore(data: any): RutinaAsignada {
        return {
            id: data.id,
            rutinaId: data.rutinaId,
            entrenadoId: data.entrenadoId,
            entrenadorId: data.entrenadorId,
            diaSemana: data.diaSemana || undefined,
            fechaEspecifica: data.fechaEspecifica instanceof Timestamp ? data.fechaEspecifica.toDate() : (data.fechaEspecifica ? new Date(data.fechaEspecifica) : undefined),
            fechaAsignacion: data.fechaAsignacion instanceof Timestamp ? data.fechaAsignacion.toDate() : (data.fechaAsignacion ? new Date(data.fechaAsignacion) : new Date()),
            activa: data.activa
        } as RutinaAsignada;
    }
}
