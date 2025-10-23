import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { RutinaAsignada } from '../models/rutina-asignada.model';

export interface IRutinaAsignadaFirestoreAdapter {
  initializeListener(onUpdate: (rutinasAsignadas: RutinaAsignada[]) => void): void;
  subscribeToRutinaAsignada(id: string, onUpdate: (rutinaAsignada: RutinaAsignada | null) => void): void;
  save(rutinaAsignada: RutinaAsignada): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class RutinaAsignadaService {
    // Señal interna con todas las rutinas asignadas
    private readonly _rutinasAsignadas: WritableSignal<RutinaAsignada[]> = signal<RutinaAsignada[]>([]);
    private readonly rutinaAsignadaSignals = new Map<string, WritableSignal<RutinaAsignada | null>>();
    private isListenerInitialized = false;
    private firestoreAdapter?: IRutinaAsignadaFirestoreAdapter;

    constructor() {
        // La inicialización se hará cuando se configure el adaptador
    }

    /**
     * Configura el adaptador de Firestore
     */
    setFirestoreAdapter(adapter: IRutinaAsignadaFirestoreAdapter): void {
        this.firestoreAdapter = adapter;
        this.initializeListener();
    }

    /**
     * 🔄 Inicializa el listener de Firestore de forma segura
     */
    private initializeListener(): void {
        if (this.isListenerInitialized || !this.firestoreAdapter) return;

        try {
            this.firestoreAdapter.initializeListener((rutinasAsignadas: RutinaAsignada[]) => {
                this._rutinasAsignadas.set(rutinasAsignadas);
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

            if (this.firestoreAdapter) {
                this.firestoreAdapter.subscribeToRutinaAsignada(id, (rutinaAsignada) => {
                    rutinaSignal.set(rutinaAsignada);
                });
            }
        }
        return this.rutinaAsignadaSignals.get(id)!;
    }

    /**
     * 🔍 Obtiene todas las rutinas asignadas
     */
    getRutinasAsignadas(): Signal<RutinaAsignada[]> {
        return this._rutinasAsignadas;
    }

    /**
     * 🔍 Obtiene rutinas asignadas por entrenado
     */
    getRutinasAsignadasByEntrenado(entrenadoId: string): Signal<RutinaAsignada[]> {
        return computed(() =>
            this._rutinasAsignadas().filter(ra => ra.entrenadoId === entrenadoId)
        );
    }

    /**
     * 🔍 Obtiene rutinas asignadas por entrenador
     */
    getRutinasAsignadasByEntrenador(entrenadorId: string): Signal<RutinaAsignada[]> {
        return computed(() =>
            this._rutinasAsignadas().filter(ra => ra.entrenadorId === entrenadorId)
        );
    }

    /**
     * 🔍 Obtiene rutinas asignadas por rutina
     */
    getRutinasAsignadasByRutina(rutinaId: string): Signal<RutinaAsignada[]> {
        return computed(() =>
            this._rutinasAsignadas().filter(ra => ra.rutinaId === rutinaId)
        );
    }

    /**
     * 🔍 Obtiene rutinas asignadas activas por entrenado
     */
    getRutinasAsignadasActivasByEntrenado(entrenadoId: string): Signal<RutinaAsignada[]> {
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
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter not configured');
        }
        await this.firestoreAdapter.save(rutinaAsignada);
    }

    /**
     * 🗑️ Elimina una rutina asignada
     */
    async delete(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter not configured');
        }
        await this.firestoreAdapter.delete(id);
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
}