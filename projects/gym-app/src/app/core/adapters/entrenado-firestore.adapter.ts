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
    // Ejecutar dentro del contexto de inyección
    runInInjectionContext(this.injector, () => {
      const entrenadosSignal = toSignal(
        collectionData(collection(this.firestore, this.COLLECTION), { idField: 'id' })
      );
      
      effect(() => {
        const data = entrenadosSignal();
        if (data) {
          const list = data.map((d: any) => this.mapFromFirestore(d));
          onUpdate(list);
        }
      });
    });
  }

  subscribeToEntrenado(id: string, onUpdate: (entrenado: Entrenado | null) => void): void {
    // Ejecutar la suscripción dentro del contexto de inyección
    runInInjectionContext(this.injector, () => {
      const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
      
      docData(entrenadoRef, { idField: 'id' }).subscribe({
        next: (data) => {
          if (data) {
            onUpdate(this.mapFromFirestore(data));
          } else {
            onUpdate(null);
          }
        },
        error: (error) => {
          console.error('Error subscribing to entrenado:', error);
          onUpdate(null);
        }
      });
    });
  }

  async save(entrenado: Entrenado): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const dataToSave = this.mapToFirestore(entrenado);
      
      if (entrenado.id) {
        // Actualizar entrenado existente
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

  private mapFromFirestore(data: any): Entrenado {
    return {
      id: data.id,
      activo: data.activo ?? true,
      fechaRegistro: data.fechaRegistro?.toDate?.() || data.fechaRegistro || new Date(),
      objetivo: data.objetivo || null,
      entrenadoresId: data.entrenadoresId || [],
      rutinasAsignadas: data.rutinasAsignadas || [],
      rutinasCreadas: data.rutinasCreadas || []
    };
  }

  private mapToFirestore(entrenado: Entrenado): any {
    const data: any = {
      activo: entrenado.activo
    };

    if (entrenado.objetivo !== undefined) {
      data.objetivo = entrenado.objetivo;
    }

    if (entrenado.fechaRegistro) {
      data.fechaRegistro = entrenado.fechaRegistro instanceof Date 
        ? Timestamp.fromDate(entrenado.fechaRegistro)
        : entrenado.fechaRegistro;
    }

    if (entrenado.entrenadoresId) {
      data.entrenadoresId = entrenado.entrenadoresId;
    }

    if (entrenado.rutinasAsignadas) {
      data.rutinasAsignadas = entrenado.rutinasAsignadas;
    }

    if (entrenado.rutinasCreadas) {
      data.rutinasCreadas = entrenado.rutinasCreadas;
    }

    return data;
  }
}
