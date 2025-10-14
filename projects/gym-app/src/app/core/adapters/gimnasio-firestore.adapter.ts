import { Injectable, inject, Injector, effect, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  deleteDoc,
  setDoc,
  Timestamp,
  collectionData,
  docData
} from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Gimnasio } from 'gym-library';

interface IGimnasioFirestoreAdapter {
  subscribeToGimnasios(callback: (gimnasios: Gimnasio[]) => void): void;
  subscribeToGimnasio(id: string, callback: (gimnasio: Gimnasio | null) => void): void;
  save(gimnasio: Gimnasio): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class GimnasioFirestoreAdapter implements IGimnasioFirestoreAdapter {
  private readonly COLLECTION = 'gimnasios';
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  subscribeToGimnasios(callback: (gimnasios: Gimnasio[]) => void): void {
    // Ejecutar dentro del contexto de inyección
    runInInjectionContext(this.injector, () => {
      const gimnasiosSignal = toSignal(
        collectionData(collection(this.firestore, this.COLLECTION), { idField: 'id' })
      );

      effect(() => {
        const data = gimnasiosSignal();
        if (data) {
          const list = data.map((d: any) => this.mapFromFirestore(d));
          callback(list);
        }
      });
    });
  }

  subscribeToGimnasio(id: string, onUpdate: (gimnasio: Gimnasio | null) => void): void {
    // Ejecutar la suscripción dentro del contexto de inyección
    runInInjectionContext(this.injector, () => {
      const gimnasioRef = doc(this.firestore, this.COLLECTION, id);
      const gimnasioSignal = toSignal(docData(gimnasioRef, { idField: 'id' }));

      effect(() => {
        const data = gimnasioSignal();
        if (data) {
          onUpdate(this.mapFromFirestore(data));
        } else {
          onUpdate(null);
        }
      });
    });
  }

  async save(gimnasio: Gimnasio): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      await setDoc(doc(this.firestore, this.COLLECTION, gimnasio.id), this.mapToFirestore(gimnasio));
    });
  }

  async delete(id: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      await deleteDoc(doc(this.firestore, this.COLLECTION, id));
    });
  }

  private mapToFirestore(gimnasio: Gimnasio): any {
    const data = { ...gimnasio };
    // No hay fechas que convertir en este modelo
    return data;
  }

  private mapFromFirestore(data: any): Gimnasio {
    const gimnasio = { ...data };
    // No hay timestamps que convertir en este modelo
    return gimnasio as Gimnasio;
  }
}