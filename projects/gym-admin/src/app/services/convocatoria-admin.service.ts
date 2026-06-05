import { Injectable, inject, signal } from '@angular/core';
import {
    Firestore,
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    setDoc,
    addDoc,
    Timestamp
} from 'firebase/firestore';
import { Convocatoria, Rol } from 'gym-library';
import { FIRESTORE } from './firebase.tokens';

@Injectable({
    providedIn: 'root'
})
export class ConvocatoriaAdminService {
    private readonly firestore = inject(FIRESTORE);
    private readonly COLLECTION = 'convocatorias';

    private _convocatorias = signal<Convocatoria[]>([]);
    public convocatorias = this._convocatorias.asReadonly();

    constructor() {
        this.initListener();
    }

    private initListener() {
        try {
            const colRef = collection(this.firestore, this.COLLECTION);
            const q = query(colRef, orderBy('fechaCreacion', 'desc'));

            onSnapshot(q, (snapshot) => {
                const list = snapshot.docs.map(doc => {
                    const data = doc.data() as any;
                    return {
                        id: doc.id,
                        creadorId: data.creadorId || '',
                        creadorNombre: data.creadorNombre || 'Anónimo',
                        creadorFoto: data.creadorFoto || null,
                        gimnasioId: data.gimnasioId || '',
                        fechaCreacion: data.fechaCreacion instanceof Timestamp ? data.fechaCreacion.toDate() : (data.fechaCreacion ? new Date(data.fechaCreacion) : new Date()),
                        fechaEntrenamiento: data.fechaEntrenamiento instanceof Timestamp ? data.fechaEntrenamiento.toDate() : (data.fechaEntrenamiento ? new Date(data.fechaEntrenamiento) : new Date()),
                        horaInicio: data.horaInicio || '00:00',
                        horaFin: data.horaFin || '00:00',
                        mensaje: data.mensaje || '',
                        interesados: data.interesados || [],
                        activo: data.activo ?? true,
                        creadorRol: data.creadorRol || Rol.ENTRENADO,
                        titulo: data.titulo || '',
                        esOficial: data.esOficial ?? false,
                        esSemanal: data.esSemanal ?? false
                    } as Convocatoria;
                });
                this._convocatorias.set(list);
            }, (error) => {
                console.warn('Error en listener de convocatorias admin:', error);
            });
        } catch (e) {
            console.warn('Error inicializando listener de convocatorias admin:', e);
        }
    }

    /**
     * Activa o desactiva una convocatoria
     */
    async toggleActivo(convocatoriaId: string, activoActual: boolean): Promise<void> {
        const ref = doc(this.firestore, this.COLLECTION, convocatoriaId);
        await updateDoc(ref, {
            activo: !activoActual
        });
    }

    /**
     * Marca o desmarca como oficial (WOD del gimnasio)
     */
    async toggleOficial(convocatoriaId: string, esOficialActual: boolean): Promise<void> {
        const ref = doc(this.firestore, this.COLLECTION, convocatoriaId);
        await updateDoc(ref, {
            esOficial: !esOficialActual
        });
    }

    /**
     * Elimina permanentemente una convocatoria
     */
    async eliminarConvocatoria(convocatoriaId: string): Promise<void> {
        const ref = doc(this.firestore, this.COLLECTION, convocatoriaId);
        await deleteDoc(ref);
    }

    /**
     * Quita un usuario de la lista de interesados
     */
    async removerInteresado(convocatoriaId: string, userId: string): Promise<void> {
        const ref = doc(this.firestore, this.COLLECTION, convocatoriaId);
        const current = this._convocatorias().find(c => c.id === convocatoriaId);
        const nuevos = (current?.interesados || []).filter(id => id !== userId);
        await updateDoc(ref, {
            interesados: nuevos
        });
    }

    /**
     * Guarda (crea o actualiza) una convocatoria.
     * Usado por el componente genérico de administración.
     */
    async save(convocatoria: Convocatoria): Promise<void> {
        return this.runInZoneIfAvailable(async () => {
            const dataToSave = this.mapToFirestore(convocatoria);

            if (convocatoria.id) {
                const ref = doc(this.firestore, this.COLLECTION, convocatoria.id);
                await setDoc(ref, dataToSave, { merge: true });
            } else {
                const col = collection(this.firestore, this.COLLECTION);
                const ref = await addDoc(col, dataToSave);
                // opcional: actualizar id en el objeto si se necesita
                (convocatoria as any).id = ref.id;
            }
        });
    }

    async crearConvocatoria(convocatoria: Convocatoria): Promise<void> {
        return this.save(convocatoria);
    }

    async actualizarConvocatoria(convocatoria: Convocatoria): Promise<void> {
        return this.save(convocatoria);
    }

    private async runInZoneIfAvailable<T>(fn: () => Promise<T>): Promise<T> {
        // Simple wrapper; el servicio actual no usa ZoneRunner como otros, pero lo dejamos preparado
        return fn();
    }

    private mapToFirestore(c: Convocatoria): any {
        const data: any = {
            creadorId: c.creadorId || '',
            creadorNombre: c.creadorNombre || '',
            gimnasioId: c.gimnasioId || '',
            horaInicio: c.horaInicio || '00:00',
            horaFin: c.horaFin || '00:00',
            interesados: c.interesados || [],
            activo: c.activo ?? true,
            esOficial: c.esOficial ?? false,
            esSemanal: c.esSemanal ?? false,
            titulo: c.titulo || '',
            mensaje: c.mensaje || '',
            creadorRol: c.creadorRol || Rol.ENTRENADO,
            creadorFoto: c.creadorFoto || null,
        };

        if (c.fechaCreacion) {
            data.fechaCreacion = c.fechaCreacion instanceof Date 
                ? Timestamp.fromDate(c.fechaCreacion) 
                : c.fechaCreacion;
        }
        if (c.fechaEntrenamiento) {
            data.fechaEntrenamiento = c.fechaEntrenamiento instanceof Date 
                ? Timestamp.fromDate(c.fechaEntrenamiento) 
                : c.fechaEntrenamiento;
        }

        return data;
    }
}
