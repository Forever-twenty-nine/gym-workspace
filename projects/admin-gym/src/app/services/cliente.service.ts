import { Injectable, signal, WritableSignal, Signal, inject } from '@angular/core';
import { Cliente } from '../models/cliente.model';
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

@Injectable({ providedIn: 'root' })
export class ClienteService {
    private readonly COLLECTION = 'clientes';
    private firestore = inject(Firestore);

    // Señal que contiene la lista de clientes (reactiva)
    private readonly _clientes: WritableSignal<Cliente[]> = signal<Cliente[]>([]);
    private readonly clienteSignals = new Map<string, WritableSignal<Cliente | null>>();
    private isListenerInitialized = false;

    constructor() {
        // 🔧 Inicializar el listener de forma diferida
        this.initializeListener();
    }

    /**
     * 🔄 Inicializa el listener de Firestore de forma segura
     */
    private initializeListener(): void {
        if (this.isListenerInitialized) return;
        
        try {
            const clientesCol = collection(this.firestore, this.COLLECTION);
            
            onSnapshot(clientesCol, (snapshot: QuerySnapshot) => {
                const list = snapshot.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                this._clientes.set(list);
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de clientes:', e);
        }
    }

    /**
     * Agrega o actualiza un cliente en Firestore.
     * @param cliente Cliente a guardar (si tiene `id` se hará upsert).
     * @returns Promise<void>
     */
    async guardarCliente(cliente: Cliente): Promise<void> {
        const clientesCol = collection(this.firestore, this.COLLECTION);
        const data = {
            ...cliente,
            fechaRegistro: cliente.fechaRegistro ? Timestamp.fromDate(cliente.fechaRegistro) : undefined
        } as any;

        if (cliente.id) {
            const docRef = doc(this.firestore, `${this.COLLECTION}/${cliente.id}`);
            await setDoc(docRef, data, { merge: true });
            return;
        }

        await addDoc(clientesCol, data);
    }

    /**
     * Obtiene una señal readonly con todos los clientes (reactiva, Timestamp -> Date).
     * @returns Signal<Cliente[]>
     */
    obtenerClientes(): Signal<Cliente[]> {
        return this._clientes.asReadonly();
    }

    /**
     * Obtiene una señal readonly de un cliente por id (listener en tiempo real).
     * @param id El ID del cliente a obtener.
     */
    obtenerClientePorId(id: string): Signal<Cliente | null> {
        if (!this.clienteSignals.has(id)) {
            const s = signal<Cliente | null>(null);
            this.clienteSignals.set(id, s);

            try {
                const docRef = doc(this.firestore, `${this.COLLECTION}/${id}`);
                onSnapshot(docRef, (snap: DocumentSnapshot) => {
                    if (snap.exists()) {
                        s.set(this.mapFromFirestore({ ...snap.data(), id: snap.id }));
                    } else {
                        s.set(null);
                    }
                });
            } catch (e) {
                console.warn(`Error obteniendo cliente ${id}:`, e);
                s.set(null);
            }
        }
        return this.clienteSignals.get(id)!.asReadonly();
    }    /**
     * Elimina un cliente por id en Firestore.
     */
    async eliminarCliente(id: string): Promise<void> {
        const docRef = doc(this.firestore, `${this.COLLECTION}/${id}`);
        await deleteDoc(docRef);
    }

    /**
     * Mapear documento Firestore a Cliente (Timestamp -> Date)
     */
    private mapFromFirestore(raw: any): Cliente {
        const fechaRegistro = raw.fechaRegistro && (raw.fechaRegistro as Timestamp).toDate ? (raw.fechaRegistro as Timestamp).toDate() : raw.fechaRegistro;
        return {
            id: raw.id,
            gimnasioId: raw.gimnasioId,
            activo: raw.activo,
            fechaRegistro,
            objetivo: raw.objetivo,
            rutinas: raw.rutinas
        } as Cliente;
    }
}