import { Injectable, signal, WritableSignal, Signal, inject } from "@angular/core";
import { Rutina } from "../models/rutina.model";
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
export class RutinaService {
    private readonly COLLECTION = 'rutinas';
    private firestore = inject(Firestore);

    // Señal interna con todas las rutinas
    private readonly _rutinas: WritableSignal<Rutina[]> = signal<Rutina[]>([]);
    private readonly rutinaSignals = new Map<string, WritableSignal<Rutina | null>>();
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
            const col = collection(this.firestore, this.COLLECTION);
            onSnapshot(col, (snap: QuerySnapshot) => {
                const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                this._rutinas.set(list);
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de rutinas:', e);
            // noop: si falla, señal queda vacía
        }
    }

    /**
     * ➕ Guarda o actualiza una rutina en Firestore (upsert si tiene id).
     */
    async guardarRutina(rutina: Rutina): Promise<void> {
        const col = collection(this.firestore, this.COLLECTION);
        
        // 🔧 Limpiar campos undefined para evitar errores de Firebase
        const cleanData = this.cleanUndefinedFields({
            ...rutina,
            fechaAsignacion: rutina.fechaAsignacion ? Timestamp.fromDate(rutina.fechaAsignacion) : undefined
        });

        if (rutina.id) {
            const docRef = doc(this.firestore, `${this.COLLECTION}/${rutina.id}`);
            await setDoc(docRef, cleanData, { merge: true });
            return;
        }

        await addDoc(col, cleanData);
    }

    /**
     * 📜 Obtiene una señal readonly con todas las rutinas.
     */
    obtenerRutinas(): Signal<Rutina[]> {
        return this._rutinas.asReadonly();
    }

    /**
     * 🔎 Obtiene una señal readonly de una rutina por id (listener en tiempo real).
     */
    obtenerRutinaPorId(id: string): Signal<Rutina | null> {
        if (!this.rutinaSignals.has(id)) {
            const s = signal<Rutina | null>(null);
            this.rutinaSignals.set(id, s);

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
                console.warn(`Error obteniendo rutina ${id}:`, e);
                s.set(null);
            }
        }
        return this.rutinaSignals.get(id)!.asReadonly();
    }

    /**
     * ❌ Elimina una rutina por id.
     */
    async eliminarRutina(id: string): Promise<void> {
        const docRef = doc(this.firestore, `${this.COLLECTION}/${id}`);
        await deleteDoc(docRef);
    }

    /**
     * 🧹 Limpia campos undefined de un objeto para evitar errores en Firebase
     */
    private cleanUndefinedFields(obj: any): any {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
                cleaned[key] = value;
            }
        }
        return cleaned;
    }

    private mapFromFirestore(raw: any): Rutina {
        const fechaAsignacion = raw.fechaAsignacion && (raw.fechaAsignacion as Timestamp).toDate ? (raw.fechaAsignacion as Timestamp).toDate() : raw.fechaAsignacion;
        return {
            id: raw.id,
            clienteId: raw.clienteId,
            nombre: raw.nombre,
            fechaAsignacion,
            ejercicios: raw.ejercicios,
            activa: raw.activa,
            entrenadorId: raw.entrenadorId,
            gimnasioId: raw.gimnasioId,
            duracion: raw.duracion,
            DiasSemana: raw.DiasSemana,
            completado: raw.completado,
            notas: raw.notas
        } as Rutina;
    }
}
