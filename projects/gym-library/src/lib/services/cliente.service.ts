import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { Cliente } from '../models/cliente.model';

export interface IClienteFirestoreAdapter {
  initializeListener(onUpdate: (clientes: Cliente[]) => void): void;
  subscribeToCliente(id: string, onUpdate: (cliente: Cliente | null) => void): void;
  save(cliente: Cliente): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
    // Señal que contiene la lista de clientes (reactiva)
    private readonly _clientes: WritableSignal<Cliente[]> = signal<Cliente[]>([]);
    private readonly clienteSignals = new Map<string, WritableSignal<Cliente | null>>();
    private isListenerInitialized = false;
    private firestoreAdapter?: IClienteFirestoreAdapter;

    constructor() {
        // La inicialización se hará cuando se configure el adaptador
    }

    /**
     * Configura el adaptador de Firestore
     */
    setFirestoreAdapter(adapter: IClienteFirestoreAdapter): void {
        this.firestoreAdapter = adapter;
        this.initializeListener();
    }

    /**
     * 🔄 Inicializa el listener de Firestore de forma segura
     */
    private initializeListener(): void {
        if (this.isListenerInitialized || !this.firestoreAdapter) return;
        
        try {
            this.firestoreAdapter.initializeListener((clientes: Cliente[]) => {
                this._clientes.set(clientes);
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de clientes:', e);
        }
    }

    /**
     * 📊 Signal readonly con la lista de clientes
     */
    get clientes(): Signal<Cliente[]> {
        if (!this.isListenerInitialized && this.firestoreAdapter) {
            this.initializeListener();
        }
        return this._clientes.asReadonly();
    }

    /**
     * 📊 Obtiene un cliente específico por ID
     */
    getCliente(id: string): Signal<Cliente | null> {
        if (!this.clienteSignals.has(id)) {
            const clienteSignal = signal<Cliente | null>(null);
            this.clienteSignals.set(id, clienteSignal);
            
            if (this.firestoreAdapter) {
                this.firestoreAdapter.subscribeToCliente(id, (cliente) => {
                    clienteSignal.set(cliente);
                });
            }
        }
        return this.clienteSignals.get(id)!.asReadonly();
    }

    /**
     * 💾 Guarda o actualiza un cliente (upsert si tiene id)
     */
    async save(cliente: Cliente): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.save(cliente);
        } catch (error) {
            console.error('Error al guardar cliente:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina un cliente por ID
     */
    async delete(id: string): Promise<void> {
        if (!this.firestoreAdapter) {
            throw new Error('Firestore adapter no configurado');
        }
        
        try {
            await this.firestoreAdapter.delete(id);
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            throw error;
        }
    }

    /**
     * � Busca clientes por nombre
     */
    getClienteById(id: string): Signal<Cliente | null> {
        return computed(() => 
            this._clientes().find(cliente => cliente.id === id) || null
        );
    }

    /**
     * 🔍 Busca clientes por entrenador
     */
    getClientesByObjetivo(objetivo: string): Signal<Cliente[]> {
        return computed(() => 
            this._clientes().filter(cliente => 
                cliente.objetivo === objetivo
            )
        );
    }

    /**
     * � Busca clientes por gimnasio
     */
    getClientesByGimnasio(gimnasioId: string): Signal<Cliente[]> {
        return computed(() => 
            this._clientes().filter(cliente => 
                cliente.gimnasioId === gimnasioId
            )
        );
    }

    /**
     * 📊 Obtiene clientes activos
     */
    getClientesActivos(): Signal<Cliente[]> {
        return computed(() => 
            this._clientes().filter(cliente => cliente.activo)
        );
    }

    /**
     * 📊 Obtiene el conteo total de clientes
     */
    get clienteCount(): Signal<number> {
        return computed(() => this._clientes().length);
    }

    /**
     * 📊 Obtiene el conteo de clientes activos
     */
    get clienteActivoCount(): Signal<number> {
        return computed(() => this._clientes().filter(c => c.activo).length);
    }
}