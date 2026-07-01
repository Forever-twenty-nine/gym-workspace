import { Injectable, signal, WritableSignal, Signal, computed, inject } from '@angular/core';
import {
    Firestore,
    collection,
    addDoc,
    doc,
    deleteDoc,
    setDoc,
    onSnapshot,
    QuerySnapshot,
    DocumentSnapshot,
    query,
    where,
    updateDoc,
    arrayUnion,
    arrayRemove
} from 'firebase/firestore';
import { Entrenado } from 'gym-library';
import { FIRESTORE } from '../firebase.tokens';

@Injectable({ providedIn: 'root' })
export class EntrenadoService {
    private readonly firestore = inject(FIRESTORE);
    private readonly COLLECTION = 'entrenados';

    // Señal que contiene la lista de entrenados (reactiva)
    private readonly _entrenados: WritableSignal<Entrenado[]> = signal<Entrenado[]>([]);
    private readonly entrenadoSignals = new Map<string, WritableSignal<Entrenado | null>>();
    private isListenerInitialized = false;

    constructor() { }


    initializeListener(gymId?: string): void {
        if (this.isListenerInitialized) return;

        try {
            const col = collection(this.firestore, this.COLLECTION);
            let q: any = col;

            if (gymId) {
                q = query(col, where('gimnasioId', '==', gymId));
            }

            onSnapshot(q, (snap: QuerySnapshot) => {
                const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
                this._entrenados.set(list);
            });
            this.isListenerInitialized = true;
        } catch (e) {
            console.warn('Error inicializando listener de entrenados:', e);
        }
    }

    get entrenados(): Signal<Entrenado[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener();
        }
        return this._entrenados.asReadonly();
    }

    getEntrenadosForGym(gymId: string): Signal<Entrenado[]> {
        if (!this.isListenerInitialized) {
            this.initializeListener(gymId);
        }
        return this._entrenados.asReadonly();
    }

    getEntrenado(id: string): Signal<Entrenado | null> {
        if (!this.entrenadoSignals.has(id)) {
            const entrenadoSignal = signal<Entrenado | null>(null);
            this.entrenadoSignals.set(id, entrenadoSignal);

            const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
            onSnapshot(entrenadoRef, (docSnap: DocumentSnapshot) => {
                if (docSnap.exists()) {
                    entrenadoSignal.set(this.mapFromFirestore({ ...docSnap.data(), id: docSnap.id }));
                } else {
                    entrenadoSignal.set(null);
                }
            });
        }
        return this.entrenadoSignals.get(id)!.asReadonly();
    }

    async save(entrenado: Entrenado): Promise<void> {
        const dataToSave = this.mapToFirestore(entrenado);
        if (entrenado.id) {
            const entrenadoRef = doc(this.firestore, this.COLLECTION, entrenado.id);
            await setDoc(entrenadoRef, dataToSave, { merge: true });
        } else {
            const col = collection(this.firestore, this.COLLECTION);
            const docRef = await addDoc(col, dataToSave);
            entrenado.id = docRef.id;
        }
    }

    async delete(id: string): Promise<void> {
        const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
        await deleteDoc(entrenadoRef);
    }

    async followUser(currentUserId: string, targetUserId: string): Promise<void> {
        const currentUserRef = doc(this.firestore, this.COLLECTION, currentUserId);
        const targetUserRef = doc(this.firestore, this.COLLECTION, targetUserId);
        await updateDoc(currentUserRef, { seguidos: arrayUnion(targetUserId) });
        await updateDoc(targetUserRef, { seguidores: arrayUnion(currentUserId) });
    }

    async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
        const currentUserRef = doc(this.firestore, this.COLLECTION, currentUserId);
        const targetUserRef = doc(this.firestore, this.COLLECTION, targetUserId);
        await updateDoc(currentUserRef, { seguidos: arrayRemove(targetUserId) });
        await updateDoc(targetUserRef, { seguidores: arrayRemove(currentUserId) });
    }

    getEntrenadoById(id: string): Signal<Entrenado | null> {
        return computed(() =>
            this._entrenados().find(entrenado => entrenado.id === id) || null
        );
    }

    getEntrenadosByObjetivo(objetivo: string): Signal<Entrenado[]> {
        return computed(() =>
            this._entrenados().filter(entrenado =>
                entrenado.objetivo === objetivo
            )
        );
    }

    getEntrenadosByEntrenador(entrenadorId: string): Signal<Entrenado[]> {
        return computed(() =>
            this._entrenados().filter(entrenado =>
                entrenado.entrenadoresId?.includes(entrenadorId)
            )
        );
    }


    getEntrenadosByRutinaAsignada(rutinaId: string): Signal<Entrenado[]> {

        return computed(() => []);
    }
    getEntrenadosByRutinaCreada(rutinaId: string): Signal<Entrenado[]> {
        return computed(() =>
            this._entrenados().filter(entrenado =>
                entrenado.rutinasCreadas?.includes(rutinaId)
            )
        );
    }

    getEntrenadosActivos(): Signal<Entrenado[]> {
        return computed(() =>
            this._entrenados()
        );
    }

    get entrenadoCount(): Signal<number> {
        return computed(() => this._entrenados().length);
    }

    get entrenadoActivoCount(): Signal<number> {
        return computed(() => this._entrenados().length);
    }

    private mapFromFirestore(data: any): Entrenado {
        return {
            id: data.id,
            gimnasioId: data.gimnasioId || [],
            objetivo: data.objetivo || null,
            entrenadoresId: data.entrenadoresId || [],
            rutinasAsignadasIds: data.rutinasAsignadasIds || [],
            rutinasCreadas: data.rutinasCreadas || [],
            ejerciciosCreadosIds: data.ejerciciosCreadosIds || [],
            nivel: data.nivel || null,
            seguidores: data.seguidores || [],
            seguidos: data.seguidos || [],
            bio: data.bio || '',
            franjaHoraria: data.franjaHoraria || null,
            visibleDescubrir: data.visibleDescubrir ?? true,
            photoSocialURL: data.photoSocialURL || null
        };
    }

    private mapToFirestore(entrenado: Entrenado): any {
        const data: any = {};
        if (entrenado.gimnasioId !== undefined) data.gimnasioId = entrenado.gimnasioId;
        if (entrenado.objetivo !== undefined) data.objetivo = entrenado.objetivo;
        if (entrenado.entrenadoresId) data.entrenadoresId = entrenado.entrenadoresId;
        if (entrenado.rutinasAsignadasIds) data.rutinasAsignadasIds = entrenado.rutinasAsignadasIds;
        if (entrenado.rutinasCreadas) data.rutinasCreadas = entrenado.rutinasCreadas;
        if (entrenado.ejerciciosCreadosIds) data.ejerciciosCreadosIds = entrenado.ejerciciosCreadosIds;
        if (entrenado.nivel !== undefined) data.nivel = entrenado.nivel;
        if (entrenado.seguidores) data.seguidores = entrenado.seguidores;
        if (entrenado.seguidos) data.seguidos = entrenado.seguidos;
        if (entrenado.bio !== undefined) data.bio = entrenado.bio;
        if (entrenado.franjaHoraria !== undefined) data.franjaHoraria = entrenado.franjaHoraria;
        if (entrenado.visibleDescubrir !== undefined) data.visibleDescubrir = entrenado.visibleDescubrir;
        if (entrenado.photoSocialURL !== undefined) data.photoSocialURL = entrenado.photoSocialURL;
        return data;
    }

    async addEjercicioCreado(entrenadoId: string, ejercicioId: string): Promise<void> {
        const entrenado = this.getEntrenado(entrenadoId)();
        if (!entrenado) return;

        const ejerciciosCreadosIds = [...(entrenado.ejerciciosCreadosIds || [])];
        if (!ejerciciosCreadosIds.includes(ejercicioId)) {
            ejerciciosCreadosIds.push(ejercicioId);
            await this.save({ ...entrenado, ejerciciosCreadosIds });
        }
    }

    async removeEjercicioCreado(entrenadoId: string, ejercicioId: string): Promise<void> {
        const entrenado = this.getEntrenado(entrenadoId)();
        if (entrenado) {
            const ejerciciosCreadosIds = (entrenado.ejerciciosCreadosIds || []).filter((id: string) => id !== ejercicioId);
            await this.save({ ...entrenado, ejerciciosCreadosIds });
        }
    }

    async addRutinaCreada(entrenadoId: string, rutinaId: string): Promise<void> {
        const entrenadoRef = doc(this.firestore, this.COLLECTION, entrenadoId);
        await updateDoc(entrenadoRef, {
            rutinasCreadas: arrayUnion(rutinaId)
        });
    }

    async removeRutinaCreada(entrenadoId: string, rutinaId: string): Promise<void> {
        const entrenado = this.getEntrenado(entrenadoId)();
        if (entrenado) {
            const rutinasCreadas = (entrenado.rutinasCreadas || []).filter((id: string) => id !== rutinaId);
            await this.save({ ...entrenado, rutinasCreadas });
        }
    }
}

