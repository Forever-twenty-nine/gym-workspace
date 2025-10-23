import { inject } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, onSnapshot, query, where, QuerySnapshot, DocumentSnapshot } from '@angular/fire/firestore';
import { SesionRutina } from 'gym-library';
import { FirebaseAdapterBase } from 'gym-library';

export interface ISesionRutinaFirestoreAdapter {
  getSesionesPorEntrenado(entrenadoId: string, callback: (sesiones: SesionRutina[]) => void): void;
  getSesionesPorRutina(rutinaId: string, callback: (sesiones: SesionRutina[]) => void): void;
  save(sesion: SesionRutina): Promise<void>;
  update(sesion: SesionRutina): Promise<void>;
  delete(sesionId: string): Promise<void>;
}

export class SesionRutinaFirestoreAdapter extends FirebaseAdapterBase implements ISesionRutinaFirestoreAdapter {
  private readonly COLLECTION = 'sesiones-rutina';
  private firestore = inject(Firestore);

  getSesionesPorEntrenado(entrenadoId: string, callback: (sesiones: SesionRutina[]) => void): void {
    const q = query(collection(this.firestore, this.COLLECTION), where('entrenadoId', '==', entrenadoId));
    onSnapshot(q, (snapshot: QuerySnapshot) => {
      this.runInZone(() => {
        const sesiones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SesionRutina);
        callback(sesiones);
      });
    });
  }

  getSesionesPorRutina(rutinaId: string, callback: (sesiones: SesionRutina[]) => void): void {
    const q = query(collection(this.firestore, this.COLLECTION), where('rutinaId', '==', rutinaId));
    onSnapshot(q, (snapshot: QuerySnapshot) => {
      this.runInZone(() => {
        const sesiones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SesionRutina);
        callback(sesiones);
      });
    });
  }

  async save(sesion: SesionRutina): Promise<void> {
    return this.runInZone(async () => {
      const ref = doc(this.firestore, this.COLLECTION, sesion.id);
      await setDoc(ref, sesion);
    });
  }

  async update(sesion: SesionRutina): Promise<void> {
    return this.runInZone(async () => {
      const ref = doc(this.firestore, this.COLLECTION, sesion.id);
      await updateDoc(ref, { ...sesion });
    });
  }

  async delete(sesionId: string): Promise<void> {
    return this.runInZone(async () => {
      const ref = doc(this.firestore, this.COLLECTION, sesionId);
      await deleteDoc(ref);
    });
  }
}
