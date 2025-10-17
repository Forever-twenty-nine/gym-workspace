import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentSnapshot,
  deleteField
} from '@angular/fire/firestore';
import { Entrenado } from 'gym-library';

interface IEntrenadoFirestoreAdapter {
  initializeListener(onUpdate: (entrenados: Entrenado[]) => void): void;
  subscribeToEntrenado(id: string, onUpdate: (entrenado: Entrenado | null) => void): void;
  save(entrenado: Entrenado): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class EntrenadoFirestoreAdapter implements IEntrenadoFirestoreAdapter {
  private readonly COLLECTION = 'entrenados';
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  initializeListener(onUpdate: (entrenados: Entrenado[]) => void): void {
    runInInjectionContext(this.injector, () => {
      const entrenadosCol = collection(this.firestore, this.COLLECTION);
      
      onSnapshot(entrenadosCol, (snapshot: QuerySnapshot) => {
        const list = snapshot.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
        onUpdate(list);
      });
    });
  }

  subscribeToEntrenado(id: string, onUpdate: (entrenado: Entrenado | null) => void): void {
    runInInjectionContext(this.injector, () => {
      const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
      onSnapshot(entrenadoRef, (doc: DocumentSnapshot) => {
        if (doc.exists()) {
          onUpdate(this.mapFromFirestore({ ...doc.data(), id: doc.id }));
        } else {
          onUpdate(null);
        }
      });
    });
  }

  async save(entrenado: Entrenado): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const dataToSave = this.mapToFirestore(entrenado);
      
      if (entrenado.id) {
        // Usar setDoc con merge para upsert (crear si no existe, actualizar si existe)
        const entrenadoRef = doc(this.firestore, this.COLLECTION, entrenado.id);
        await setDoc(entrenadoRef, dataToSave, { merge: true });
      } else {
        // Crear nuevo entrenado
        await addDoc(collection(this.firestore, this.COLLECTION), dataToSave);
      }
    });
  }

  async delete(id: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
      await deleteDoc(entrenadoRef);
    });
  }

  /**
   * 🔄 Mapea datos de Firestore a modelo Entrenado
   */
  private mapFromFirestore(data: any): Entrenado {
    return {
      id: data.id,
      entrenadoresId: data.entrenadoresId || [],
      rutinasAsignadas: data.rutinasAsignadas || [],
      rutinasCreadas: data.rutinasCreadas || [],
      activo: data.activo ?? true,
      fechaRegistro: data.fechaRegistro?.toDate?.() || data.fechaRegistro || new Date(),
      objetivo: data.objetivo || undefined // Usar undefined en lugar de null para consistencia
    };
  }

  /**
   * 🔄 Mapea modelo Entrenado a datos de Firestore
   */
  private mapToFirestore(entrenado: Entrenado): any {
    const data: any = {
      activo: entrenado.activo
    };

    // Incluir campos, usando delete si son null
    if (entrenado.entrenadoresId !== undefined) {
      data.entrenadoresId = entrenado.entrenadoresId !== null ? entrenado.entrenadoresId : deleteField();
    }

    // Solo incluir objetivo si no es undefined
    if (entrenado.objetivo !== undefined) {
      data.objetivo = entrenado.objetivo !== null ? entrenado.objetivo : deleteField();
    }

    if (entrenado.fechaRegistro) {
      data.fechaRegistro = entrenado.fechaRegistro instanceof Date 
        ? Timestamp.fromDate(entrenado.fechaRegistro)
        : entrenado.fechaRegistro;
    }

    return data;
  }
}
