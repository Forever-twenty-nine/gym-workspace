import { Injectable, inject } from '@angular/core';
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

  initializeListener(onUpdate: (entrenados: Entrenado[]) => void): void {
    const entrenadosCol = collection(this.firestore, this.COLLECTION);
    
    onSnapshot(entrenadosCol, (snapshot: QuerySnapshot) => {
      const list = snapshot.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
      onUpdate(list);
    });
  }

  subscribeToEntrenado(id: string, onUpdate: (entrenado: Entrenado | null) => void): void {
    const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
    onSnapshot(entrenadoRef, (doc: DocumentSnapshot) => {
      if (doc.exists()) {
        onUpdate(this.mapFromFirestore({ ...doc.data(), id: doc.id }));
      } else {
        onUpdate(null);
      }
    });
  }

  async save(entrenado: Entrenado): Promise<void> {
    const dataToSave = this.mapToFirestore(entrenado);
    
    if (entrenado.id) {
      // Actualizar entrenado existente
      const entrenadoRef = doc(this.firestore, this.COLLECTION, entrenado.id);
      await setDoc(entrenadoRef, dataToSave, { merge: true });
    } else {
      // Crear nuevo entrenado
      await addDoc(collection(this.firestore, this.COLLECTION), dataToSave);
    }
  }

  async delete(id: string): Promise<void> {
    const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
    await deleteDoc(entrenadoRef);
  }

  /**
   * 🔄 Mapea datos de Firestore a modelo Entrenado
   */
  private mapFromFirestore(data: any): Entrenado {
    return {
      id: data.id,
      gimnasioId: data.gimnasioId || '',
      entrenadorId: data.entrenadorId || '',
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

    // Solo incluir campos si no son undefined
    if (entrenado.gimnasioId !== undefined && entrenado.gimnasioId !== null) {
      data.gimnasioId = entrenado.gimnasioId;
    }
    
    if (entrenado.entrenadorId !== undefined && entrenado.entrenadorId !== null) {
      data.entrenadorId = entrenado.entrenadorId;
    }

    // Solo incluir objetivo si no es undefined o null
    if (entrenado.objetivo !== undefined && entrenado.objetivo !== null) {
      data.objetivo = entrenado.objetivo;
    }

    if (entrenado.fechaRegistro) {
      data.fechaRegistro = entrenado.fechaRegistro instanceof Date 
        ? Timestamp.fromDate(entrenado.fechaRegistro)
        : entrenado.fechaRegistro;
    }

    return data;
  }
}
