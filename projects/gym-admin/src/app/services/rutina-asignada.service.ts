import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import {
    Firestore,
    collection,
    addDoc,
    doc,
    deleteDoc,
    setDoc,
    onSnapshot,
    Timestamp,
    QuerySnapshot,
    DocumentSnapshot
} from '@angular/fire/firestore';
import { RutinaAsignada, Notificacion, TipoNotificacion } from 'gym-library';
import { NotificacionService } from './notificacion.service';
import { RutinaService } from './rutina.service';
import { ZoneRunnerService } from './zone-runner.service';

@Injectable({ providedIn: 'root' })
export class RutinaAsignadaService {
    private readonly firestore = inject(Firestore);
    private readonly injector = inject(Injector);
    private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
    private readonly COLLECTION = 'rutinas-asignadas';

    // Señal interna con todas las rutinas asignadas
    private readonly _rutinasAsignadas: WritableSignal<RutinaAsignada[]> = signal<RutinaAsignada[]>([]);
    private readonly rutinaAsignadaSignals = new Map<string, WritableSignal<RutinaAsignada | null>>();
    private isListenerInitialized = false;

    constructor() { }

    // Servicios auxiliares
    private readonly notificacionService: NotificacionService = inject(NotificacionService);
    private readonly rutinaService: RutinaService = inject(RutinaService);

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
            const rutinaSignal: WritableSignal<RutinaAsignada | null> = signal<RutinaAsignada | null>(null);
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
        return this.rutinaAsignadaSignals.get(id)!;
    }

    /**
     * 🔍 Obtiene todas las rutinas asignadas
     */
    getRutinasAsignadas(): Signal<RutinaAsignada[]> {
        this.initializeListener();
        return this._rutinasAsignadas;
    }

    /**
     * 🔍 Obtiene rutinas asignadas por entrenado
     */
    getRutinasAsignadasByEntrenado(entrenadoId: string): Signal<RutinaAsignada[]> {
        this.initializeListener();
        return computed(() =>
            this._rutinasAsignadas().filter(ra => ra.entrenadoId === entrenadoId)
        );
    }

    /**
     * 🔍 Obtiene rutinas asignadas por entrenador
     */
    getRutinasAsignadasByEntrenador(entrenadorId: string): Signal<RutinaAsignada[]> {
        this.initializeListener();
        return computed(() =>
            this._rutinasAsignadas().filter(ra => ra.entrenadorId === entrenadorId)
        );
    }

    /**
     * 🔍 Obtiene rutinas asignadas por rutina
     */
    getRutinasAsignadasByRutina(rutinaId: string): Signal<RutinaAsignada[]> {
        this.initializeListener();
        return computed(() =>
            this._rutinasAsignadas().filter(ra => ra.rutinaId === rutinaId)
        );
    }

    /**
     * 🔍 Obtiene rutinas asignadas activas por entrenado
     */
    getRutinasAsignadasActivasByEntrenado(entrenadoId: string): Signal<RutinaAsignada[]> {
        this.initializeListener();
        return computed(() =>
            this._rutinasAsignadas().filter(ra =>
                ra.entrenadoId === entrenadoId && ra.activa
            )
        );
    }

    /**
     * 💾 Guarda una rutina asignada
     */
    async save(rutinaAsignada: RutinaAsignada): Promise<void> {
        return this.runInZone(async () => {
            const data = this.mapToFirestore(rutinaAsignada);

            if (rutinaAsignada.id) {
                const rutinaAsignadaRef = doc(this.firestore, this.COLLECTION, rutinaAsignada.id);
                await setDoc(rutinaAsignadaRef, data);
            } else {
                const col = collection(this.firestore, this.COLLECTION);
                const docRef = await addDoc(col, data);
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
        const rutinaAsignada = this._rutinasAsignadas().find(ra => ra.id === id);
        if (rutinaAsignada) {
            const updated = { ...rutinaAsignada, activa: !rutinaAsignada.activa };
            await this.save(updated);
        }
    }

    /**
     * 🔄 Mapea modelo RutinaAsignada a datos de Firestore
     */
    private mapToFirestore(rutinaAsignada: RutinaAsignada): any {
        return {
            rutinaId: rutinaAsignada.rutinaId,
            entrenadoId: rutinaAsignada.entrenadoId,
            entrenadorId: rutinaAsignada.entrenadorId,
            diaSemana: rutinaAsignada.diaSemana || null,
            fechaEspecifica: rutinaAsignada.fechaEspecifica ? Timestamp.fromDate(rutinaAsignada.fechaEspecifica) : null,
            fechaAsignacion: Timestamp.fromDate(rutinaAsignada.fechaAsignacion),
            activa: rutinaAsignada.activa
        };
    }

    /**
     * 🔄 Mapea datos de Firestore a modelo RutinaAsignada
     */
    private mapFromFirestore(data: any): RutinaAsignada {
        return {
            id: data.id,
            rutinaId: data.rutinaId,
            entrenadoId: data.entrenadoId,
            entrenadorId: data.entrenadorId,
            diaSemana: data.diaSemana || undefined,
            fechaEspecifica: data.fechaEspecifica ? data.fechaEspecifica.toDate() : undefined,
            fechaAsignacion: data.fechaAsignacion.toDate(),
            activa: data.activa
        };
    }

    /**
     * Crea notificaciones de recordatorio para rutinas próximas de un entrenado en una ventana dada (por defecto 24h).
     * Idempotente: usa un ID determinista por rutinaAsignada y día objetivo.
     */
    async checkAndNotifyRutinasProximas(entrenadoId: string, windowHours: number = 24): Promise<void> {
        const ahora = new Date();
        const ventanaMs = windowHours * 60 * 60 * 1000;
        const limite = new Date(ahora.getTime() + ventanaMs);

        // Tomamos un snapshot de las rutinas asignadas activas del entrenado
        const asignadas = this.getRutinasAsignadasActivasByEntrenado(entrenadoId)();
        if (!asignadas || asignadas.length === 0) return;

        for (const ra of asignadas) {
            // Determinar la fecha objetivo próxima
            const fechaObjetivo = this.calcularProximaFechaObjetivo(ra, ahora);
            if (!fechaObjetivo) continue;

            // ¿Cae dentro de la ventana?
            if (fechaObjetivo.getTime() >= ahora.getTime() && fechaObjetivo.getTime() <= limite.getTime()) {
                const yyyyMMdd = this.formatearYYYYMMDD(fechaObjetivo);
                const notifId = `notif-rutina-proxima-${ra.id}-${yyyyMMdd}`;

                // Componer título/mensaje (con nombre si está disponible)
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

    /** Calcula la próxima fecha objetivo para una rutina asignada basada en fechaEspecifica o diaSemana */
    private calcularProximaFechaObjetivo(ra: RutinaAsignada, referencia: Date): Date | null {
        // Caso 1: fecha específica
        if (ra.fechaEspecifica) {
            return new Date(ra.fechaEspecifica);
        }

        // Caso 2: día de la semana
        if (ra.diaSemana) {
            const targetDow = this.mapDiaSemana(ra.diaSemana);
            if (targetDow === null) return null;
            const ref = new Date(referencia);
            const diff = (targetDow - ref.getDay() + 7) % 7;
            // si es hoy, consideramos hoy como próxima ocurrencia
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

    /** Mapea nombre de día (es/en, varias variantes) a número de getDay() (0=Domingo..6=Sábado) */
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
}
