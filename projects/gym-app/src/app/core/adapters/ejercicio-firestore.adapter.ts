import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  setDoc,
  onSnapshot,
  QuerySnapshot,
  DocumentSnapshot
} from '@angular/fire/firestore';
import { Ejercicio } from 'gym-library';

interface IEjercicioFirestoreAdapter {
  initializeListener(onUpdate: (ejercicios: Ejercicio[]) => void): void;
  subscribeToEjercicio(id: string, onUpdate: (ejercicio: Ejercicio | null) => void): void;
  save(ejercicio: Ejercicio): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class EjercicioFirestoreAdapter implements IEjercicioFirestoreAdapter {
  private readonly COLLECTION = 'ejercicios';
  private firestore = inject(Firestore);

  initializeListener(onUpdate: (ejercicios: Ejercicio[]) => void): void {
    const col = collection(this.firestore, this.COLLECTION);
    onSnapshot(col, (snap: QuerySnapshot) => {
      const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
      onUpdate(list);
    });
  }

  subscribeToEjercicio(id: string, onUpdate: (ejercicio: Ejercicio | null) => void): void {
    const ejercicioRef = doc(this.firestore, this.COLLECTION, id);
    onSnapshot(ejercicioRef, (doc: DocumentSnapshot) => {
      if (doc.exists()) {
        onUpdate(this.mapFromFirestore({ ...doc.data(), id: doc.id }));
      } else {
        onUpdate(null);
      }
    });
  }

  async save(ejercicio: Ejercicio): Promise<void> {
    const dataToSave = this.mapToFirestore(ejercicio);
    
    if (ejercicio.id) {
      const ejercicioRef = doc(this.firestore, this.COLLECTION, ejercicio.id);
      await setDoc(ejercicioRef, dataToSave, { merge: true });
    } else {
      await addDoc(collection(this.firestore, this.COLLECTION), dataToSave);
    }
  }

  async delete(id: string): Promise<void> {
    const ejercicioRef = doc(this.firestore, this.COLLECTION, id);
    await deleteDoc(ejercicioRef);
  }

  private mapFromFirestore(data: any): Ejercicio {
    return {
      id: data.id,
      nombre: data.nombre || '',
      descripcion: data.descripcion,
      series: data.series || 0,
      repeticiones: data.repeticiones || 0,
      peso: data.peso,
      descansoSegundos: data.descansoSegundos,
      serieSegundos: data.serieSegundos,
      // Nuevos campos
      creadorId: data.creadorId,
      creadorTipo: data.creadorTipo,
      fechaCreacion: data.fechaCreacion?.toDate?.() || data.fechaCreacion,
      fechaModificacion: data.fechaModificacion?.toDate?.() || data.fechaModificacion
    };
  }

  private mapToFirestore(ejercicio: Ejercicio): any {
    const data: any = {
      nombre: ejercicio.nombre,
      descripcion: ejercicio.descripcion,
      series: ejercicio.series,
      repeticiones: ejercicio.repeticiones,
      peso: ejercicio.peso,
      descansoSegundos: ejercicio.descansoSegundos,
      serieSegundos: ejercicio.serieSegundos
    };

    // Incluir campos opcionales solo si tienen valor
    if (ejercicio.creadorId) {
      data.creadorId = ejercicio.creadorId;
    }
    
    if (ejercicio.creadorTipo) {
      data.creadorTipo = ejercicio.creadorTipo;
    }
    
    if (ejercicio.fechaCreacion) {
      data.fechaCreacion = ejercicio.fechaCreacion instanceof Date 
        ? ejercicio.fechaCreacion
        : ejercicio.fechaCreacion;
    }
    
    if (ejercicio.fechaModificacion) {
      data.fechaModificacion = ejercicio.fechaModificacion instanceof Date 
        ? ejercicio.fechaModificacion
        : ejercicio.fechaModificacion;
    }

    return data;
  }
}
