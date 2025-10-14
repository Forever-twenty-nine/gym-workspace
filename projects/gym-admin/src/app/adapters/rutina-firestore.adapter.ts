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
      entrenadoId: data.entrenadoId,
      nombre: data.nombre || '',
      fechaAsignacion: data.fechaAsignacion?.toDate?.() || data.fechaAsignacion || new Date(),
      ejercicios: data.ejercicios || [],
      activa: data.activa ?? true,
      duracion: data.duracion,
      DiasSemana: data.DiasSemana || [],
      completado: data.completado ?? false,
      notas: data.notas || '',
      // Nuevos campos
      creadorId: data.creadorId,
      creadorTipo: data.creadorTipo,
      asignadoId: data.asignadoId,
      asignadoIds: data.asignadoIds || [],
      asignadoTipo: data.asignadoTipo,
      fechaCreacion: data.fechaCreacion?.toDate?.() || data.fechaCreacion,
      fechaModificacion: data.fechaModificacion?.toDate?.() || data.fechaModificacion
    };
  }

  private mapToFirestore(rutina: Rutina): any {
    const data: any = {
      entrenadoId: rutina.entrenadoId,
      nombre: rutina.nombre,
      ejercicios: rutina.ejercicios || [],
      activa: rutina.activa,
      DiasSemana: rutina.DiasSemana || [],
      completado: rutina.completado
    };

    // Solo incluir campos opcionales si tienen valor válido
    if (rutina.duracion && rutina.duracion > 0) {
      data.duracion = rutina.duracion;
    }
    
    if (rutina.notas && rutina.notas.trim() !== '') {
      data.notas = rutina.notas;
    }

    if (rutina.fechaAsignacion) {
      data.fechaAsignacion = rutina.fechaAsignacion instanceof Date 
        ? Timestamp.fromDate(rutina.fechaAsignacion)
        : rutina.fechaAsignacion;
    }

    // Nuevos campos opcionales
    if (rutina.creadorId) {
      data.creadorId = rutina.creadorId;
    }
    
    if (rutina.creadorTipo) {
      data.creadorTipo = rutina.creadorTipo;
    }
    
    if (rutina.asignadoId) {
      data.asignadoId = rutina.asignadoId;
    }
    
    if (rutina.asignadoIds && rutina.asignadoIds.length > 0) {
      data.asignadoIds = rutina.asignadoIds;
    }
    
    if (rutina.asignadoTipo) {
      data.asignadoTipo = rutina.asignadoTipo;
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