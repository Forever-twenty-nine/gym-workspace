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
      clienteId: data.clienteId,
      nombre: data.nombre || '',
      fechaAsignacion: data.fechaAsignacion?.toDate?.() || data.fechaAsignacion || new Date(),
      ejercicios: data.ejercicios || [],
      activa: data.activa ?? true,
      entrenadorId: data.entrenadorId,
      gimnasioId: data.gimnasioId,
      duracion: data.duracion,
      DiasSemana: data.DiasSemana || [],
      completado: data.completado ?? false,
      notas: data.notas || ''
    };
  }

  private mapToFirestore(rutina: Rutina): any {
    const data: any = {
      clienteId: rutina.clienteId,
      nombre: rutina.nombre,
      ejercicios: rutina.ejercicios || [],
      activa: rutina.activa,
      entrenadorId: rutina.entrenadorId,
      gimnasioId: rutina.gimnasioId,
      duracion: rutina.duracion,
      DiasSemana: rutina.DiasSemana || [],
      completado: rutina.completado,
      notas: rutina.notas
    };

    if (rutina.fechaAsignacion) {
      data.fechaAsignacion = rutina.fechaAsignacion instanceof Date 
        ? Timestamp.fromDate(rutina.fechaAsignacion)
        : rutina.fechaAsignacion;
    }

    return data;
  }
}