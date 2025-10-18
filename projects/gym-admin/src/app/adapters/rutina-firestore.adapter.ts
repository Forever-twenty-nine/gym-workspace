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
import { Rutina } from 'gym-library';

interface IRutinaFirestoreAdapter {
  initializeListener(onUpdate: (rutinas: Rutina[]) => void): void;
  subscribeToRutina(id: string, onUpdate: (rutina: Rutina | null) => void): void;
  save(rutina: Rutina): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class RutinaFirestoreAdapter implements IRutinaFirestoreAdapter {
  private readonly COLLECTION = 'rutinas';
  private firestore = inject(Firestore);

  initializeListener(onUpdate: (rutinas: Rutina[]) => void): void {
    const col = collection(this.firestore, this.COLLECTION);
    onSnapshot(col, (snap: QuerySnapshot) => {
      const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
      onUpdate(list);
    });
  }

  subscribeToRutina(id: string, onUpdate: (rutina: Rutina | null) => void): void {
    const rutinaRef = doc(this.firestore, this.COLLECTION, id);
    onSnapshot(rutinaRef, (doc: DocumentSnapshot) => {
      if (doc.exists()) {
        onUpdate(this.mapFromFirestore({ ...doc.data(), id: doc.id }));
      } else {
        onUpdate(null);
      }
    });
  }

  async save(rutina: Rutina): Promise<void> {
    const dataToSave = this.mapToFirestore(rutina);
    
    if (rutina.id) {
      const rutinaRef = doc(this.firestore, this.COLLECTION, rutina.id);
      await setDoc(rutinaRef, dataToSave, { merge: true });
    } else {
      await addDoc(collection(this.firestore, this.COLLECTION), dataToSave);
    }
  }

  async delete(id: string): Promise<void> {
    const rutinaRef = doc(this.firestore, this.COLLECTION, id);
    await deleteDoc(rutinaRef);
  }

  private mapFromFirestore(data: any): Rutina {
    return {
      id: data.id,
      nombre: data.nombre || '',
      activa: data.activa ?? true,
      descripcion: data.descripcion || '',
      ejercicios: data.ejercicios || [],
      completado: data.completado ?? false,
      fechaCreacion: data.fechaCreacion?.toDate?.() || data.fechaCreacion,
      fechaModificacion: data.fechaModificacion?.toDate?.() || data.fechaModificacion,
      DiasSemana: data.DiasSemana || [],
      duracion: data.duracion
    };
  }

  private mapToFirestore(rutina: Rutina): any {
    const data: any = {
      nombre: rutina.nombre,
      activa: rutina.activa,
      descripcion: rutina.descripcion || '',
      ejercicios: rutina.ejercicios || [],
      completado: rutina.completado,
      DiasSemana: rutina.DiasSemana || []
    };

    // Solo incluir campos opcionales si tienen valor válido
    if (rutina.duracion && rutina.duracion > 0) {
      data.duracion = rutina.duracion;
    }
    
    if (rutina.fechaCreacion) {
      data.fechaCreacion = rutina.fechaCreacion instanceof Date 
        ? Timestamp.fromDate(rutina.fechaCreacion)
        : rutina.fechaCreacion;
    }
    
    if (rutina.fechaModificacion) {
      data.fechaModificacion = rutina.fechaModificacion instanceof Date 
        ? Timestamp.fromDate(rutina.fechaModificacion)
        : rutina.fechaModificacion;
    }

    return data;
  }
}