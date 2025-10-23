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
import { RutinaAsignada, FirebaseAdapterBase } from 'gym-library';

interface IRutinaAsignadaFirestoreAdapter {
  initializeListener(onUpdate: (rutinasAsignadas: RutinaAsignada[]) => void): void;
  subscribeToRutinaAsignada(id: string, onUpdate: (rutinaAsignada: RutinaAsignada | null) => void): void;
  save(rutinaAsignada: RutinaAsignada): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class RutinaAsignadaFirestoreAdapter extends FirebaseAdapterBase implements IRutinaAsignadaFirestoreAdapter {
  private readonly COLLECTION = 'rutinas-asignadas';
  private firestore = inject(Firestore);

  initializeListener(onUpdate: (rutinasAsignadas: RutinaAsignada[]) => void): void {
    const col = collection(this.firestore, this.COLLECTION);
    onSnapshot(col, (snap: QuerySnapshot) => {
      this.runInZone(() => {
        const list = snap.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
        onUpdate(list);
      });
    });
  }

  subscribeToRutinaAsignada(id: string, onUpdate: (rutinaAsignada: RutinaAsignada | null) => void): void {
    const rutinaAsignadaRef = doc(this.firestore, this.COLLECTION, id);
    onSnapshot(rutinaAsignadaRef, (doc: DocumentSnapshot) => {
      this.runInZone(() => {
        if (doc.exists()) {
          onUpdate(this.mapFromFirestore({ ...doc.data(), id: doc.id }));
        } else {
          onUpdate(null);
        }
      });
    });
  }

  async save(rutinaAsignada: RutinaAsignada): Promise<void> {
    const data = this.mapToFirestore(rutinaAsignada);

    if (rutinaAsignada.id) {
      // Update existing
      const rutinaAsignadaRef = doc(this.firestore, this.COLLECTION, rutinaAsignada.id);
      await setDoc(rutinaAsignadaRef, data);
    } else {
      // Create new
      const col = collection(this.firestore, this.COLLECTION);
      const docRef = await addDoc(col, data);
      rutinaAsignada.id = docRef.id;
    }
  }

  async delete(id: string): Promise<void> {
    const rutinaAsignadaRef = doc(this.firestore, this.COLLECTION, id);
    await deleteDoc(rutinaAsignadaRef);
  }

  private mapToFirestore(rutinaAsignada: RutinaAsignada): any {
    return {
      rutinaId: rutinaAsignada.rutinaId,
      entrenadoId: rutinaAsignada.entrenadoId,
      entrenadorId: rutinaAsignada.entrenadorId,
      diaSemana: rutinaAsignada.diaSemana || null,
      fechaEspecifica: rutinaAsignada.fechaEspecifica ? Timestamp.fromDate(rutinaAsignada.fechaEspecifica) : null,
      fechaAsignacion: Timestamp.fromDate(rutinaAsignada.fechaAsignacion),
      activa: rutinaAsignada.activa
    };
  }

  private mapFromFirestore(data: any): RutinaAsignada {
    return {
      id: data.id,
      rutinaId: data.rutinaId,
      entrenadoId: data.entrenadoId,
      entrenadorId: data.entrenadorId,
      diaSemana: data.diaSemana || undefined,
      fechaEspecifica: data.fechaEspecifica ? data.fechaEspecifica.toDate() : undefined,
      fechaAsignacion: data.fechaAsignacion.toDate(),
      activa: data.activa
    };
  }
}