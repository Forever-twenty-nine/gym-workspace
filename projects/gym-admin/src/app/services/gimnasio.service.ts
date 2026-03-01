import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { Gimnasio } from 'gym-library';

export interface IGimnasioFirestoreAdapter {
    subscribeToGimnasios(callback: (gimnasios: Gimnasio[]) => void): void;
    subscribeToGimnasio(id: string, callback: (gimnasio: Gimnasio | null) => void): void;
    save(gimnasio: Gimnasio): Promise<void>;
    delete(id: string): Promise<void>;
}

export const GIMNASIO_FIRESTORE_ADAPTER = Symbol('GIMNASIO_FIRESTORE_ADAPTER');

@Injectable({ providedIn: 'root' })
export class GimnasioService {
    private readonly _gimnasios: WritableSignal<Gimnasio[]> = signal<Gimnasio[]>([]);
    private readonly gimnasioSignals = new Map<string, WritableSignal<Gimnasio | null>>();
    private isListenerInitialized = false;
    private firestoreAdapter?: IGimnasioFirestoreAdapter;

    constructor() {
        // La inicialización se hará cuando se configure el adaptador
    }

    /**
     * Configura el adaptador de Firestore
     */
    setFirestoreAdapter(adapter: IGimnasioFirestoreAdapter): void {
        this.firestoreAdapter = adapter;
        // No inicializar automáticamente, se hará manualmente cuando sea necesario
    }

    /**
     * � Inicializa el listener de gimnasios (llamar manualmente cuando sea necesario)
     */
    initializeListener(): void {
        if (!this.isListenerInitialized && this.firestoreAdapter) {
            this.firestoreAdapter.subscribeToGimnasios((gimnasios) => {
                this._gimnasios.set(gimnasios);
            });
            this.isListenerInitialized = true;
        }
    }

    /**
     * 📊 Signal readonly con todos los gimnasios
     */
    get gimnasios(): Signal<Gimnasio[]> {
        // No inicializar automáticamente, debe hacerse manualmente
        return this._gimnasios.asReadonly();
    }

    /**
     * 📊 Obtiene un gimnasio específico por ID
     */
    getGimnasio(id: string): Signal<Gimnasio | null> {
        if (!this.gimnasioSignals.has(id)) {
            const gimnasioSignal = signal<Gimnasio | null>(null);
            this.gimnasioSignals.set(id, gimnasioSignal);
            
            if (this.firestoreAdapter) {
                this.firestoreAdapter.subscribeToGimnasio(id, (gimnasio) => {
                    gimnasioSignal.set(gimnasio);
                });
            }
        }
        return this.gimnasioSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza un gimnasio (upsert si tiene id)
     */
    async save(gimnasio: Gimnasio): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        await this.firestoreAdapter.save(gimnasio);
    }

    /**
     * 🗑️ Elimina un gimnasio por ID
     */
    async delete(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        await this.firestoreAdapter.delete(id);
    }

    /**
     * 🔍 Obtiene un gimnasio específico por ID
     */
    getGimnasioById(id: string): Signal<Gimnasio | null> {
        return computed(() => 
            this._gimnasios().find(gimnasio => gimnasio.id === id) || null
        );
    }

    /**
     * 🔍 Busca gimnasios activos
     */
    getGimnasiosActivos(): Signal<Gimnasio[]> {
        return computed(() => 
            this._gimnasios().filter(gimnasio => gimnasio.activo)
        );
    }

    /**
     * 🔍 Busca gimnasios por dirección
     */
    getGimnasiosByDireccion(direccion: string): Signal<Gimnasio[]> {
        return computed(() => 
            this._gimnasios().filter(gimnasio => 
                gimnasio.direccion.toLowerCase().includes(direccion.toLowerCase())
            )
        );
    }

    /**
     * 📊 Obtiene el conteo total de gimnasios
     */
    get gimnasioCount(): Signal<number> {
        return computed(() => this._gimnasios().length);
    }

    /**
     * 📊 Obtiene el conteo de gimnasios activos
     */
    get gimnasioActivoCount(): Signal<number> {
        return computed(() => 
            this._gimnasios().filter(gimnasio => gimnasio.activo).length
        );
    }
}