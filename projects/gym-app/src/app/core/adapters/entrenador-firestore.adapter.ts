import { Injectable, inject, Injector, effect, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  deleteDoc,
  setDoc,
  updateDoc,
  Timestamp,
  collectionData,
  docData
} from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Entrenador } from 'gym-library';

interface IEntrenadorFirestoreAdapter {
  getEntrenadores(callback: (entrenadores: Entrenador[]) => void): () => void;
  subscribeToEntrenador(id: string, callback: (entrenador: Entrenador | null) => void): void;
  create(entrenador: Omit<Entrenador, 'id'>): Promise<string>;
  createWithId?(id: string, entrenador: Omit<Entrenador, 'id'>): Promise<void>;
  update(id: string, entrenador: Partial<Entrenador>): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class EntrenadorFirestoreAdapter implements IEntrenadorFirestoreAdapter {
  private readonly COLLECTION = 'entrenadores';
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  getEntrenadores(callback: (entrenadores: Entrenador[]) => void): () => void {
    // Ejecutar dentro del contexto de inyección
    runInInjectionContext(this.injector, () => {
      const entrenadoresSignal = toSignal(
        collectionData(collection(this.firestore, this.COLLECTION), { idField: 'id' })
      );

      effect(() => {
        const data = entrenadoresSignal();
        if (data) {
          const list = data.map((d: any) => this.mapFromFirestore(d));
          callback(list);
        }
      });
    });

    // Retornar función para unsubscribe (simplificada)
    return () => {};
  }

  subscribeToEntrenador(id: string, onUpdate: (entrenador: Entrenador | null) => void): void {
    // Ejecutar la suscripción dentro del contexto de inyección
    runInInjectionContext(this.injector, () => {
      const entrenadorRef = doc(this.firestore, this.COLLECTION, id);
      const entrenadorSignal = toSignal(docData(entrenadorRef, { idField: 'id' }));

      effect(() => {
        const data = entrenadorSignal();
        if (data) {
          onUpdate(this.mapFromFirestore(data));
        } else {
          onUpdate(null);
        }
      });
    });
  }

  async create(entrenador: Omit<Entrenador, 'id'>): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      const docRef = await addDoc(collection(this.firestore, this.COLLECTION), this.mapToFirestore(entrenador));
      return docRef.id;
    });
  }

  async createWithId(id: string, entrenador: Omit<Entrenador, 'id'>): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      await setDoc(doc(this.firestore, this.COLLECTION, id), this.mapToFirestore(entrenador));
    });
  }

  async update(id: string, entrenador: Partial<Entrenador>): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const dataToUpdate = this.mapPartialToFirestore(entrenador);
      await updateDoc(doc(this.firestore, this.COLLECTION, id), dataToUpdate);
    });
  }

  async delete(id: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      await deleteDoc(doc(this.firestore, this.COLLECTION, id));
    });
  }

  private mapToFirestore(entrenador: Omit<Entrenador, 'id'> | Entrenador): any {
    const data = { ...entrenador };
    // No hay fechas que convertir en este modelo
    return data;
  }

  private mapFromFirestore(data: any): Entrenador {
    const entrenador = { ...data };
    // No hay timestamps que convertir en este modelo
    return entrenador as Entrenador;
  }

  private mapPartialToFirestore(entrenador: Partial<Entrenador>): any {
    const data: any = {};

    if (entrenador.gimnasioId !== undefined) {
      data.gimnasioId = entrenador.gimnasioId;
    }

    if (entrenador.activo !== undefined) {
      data.activo = entrenador.activo;
    }

    if (entrenador.entrenados !== undefined) {
      data.entrenados = entrenador.entrenados;
    }

    if (entrenador.rutinas !== undefined) {
      data.rutinas = entrenador.rutinas;
    }

    return data;
  }
}