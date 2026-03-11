import { Injectable, inject, signal, Signal, WritableSignal, computed } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, Timestamp, QuerySnapshot, DocumentSnapshot, getDoc } from 'firebase/firestore';
import { MensajeGlobal } from 'gym-library';
import { FIRESTORE } from '../../services/firebase.tokens';

@Injectable({
  providedIn: 'root'
})
export class MensajesGlobalesService {
  private readonly firestore = inject(FIRESTORE) as Firestore;
  private readonly COLLECTION = 'mensajes_globales';

  private _mensajes: WritableSignal<MensajeGlobal[]> = signal([]);
  private isListenerInitialized = false;

  get mensajes(): Signal<MensajeGlobal[]> {
    if (!this.isListenerInitialized) {
      this.initListener();
    }
    return this._mensajes.asReadonly();
  }

  private initListener() {
    if (this.isListenerInitialized) return;
    const colRef = collection(this.firestore, this.COLLECTION);
    const q = query(colRef, orderBy('fechaCreacion', 'desc'));

    onSnapshot(q, (snapshot: QuerySnapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data['titulo'],
          mensaje: data['mensaje'],
          fechaCreacion: data['fechaCreacion']?.toDate() || new Date(),
          activo: data['activo']
        } as MensajeGlobal;
      });
      this._mensajes.set(msgs);
    });
    this.isListenerInitialized = true;
  }

  async create(mensaje: Partial<MensajeGlobal>): Promise<void> {
    const colRef = collection(this.firestore, this.COLLECTION);
    const dataToSave = {
      titulo: mensaje.titulo,
      mensaje: mensaje.mensaje,
      fechaCreacion: Timestamp.now(),
      activo: mensaje.activo ?? true
    };
    await addDoc(colRef, dataToSave);
  }

  async update(id: string, data: Partial<MensajeGlobal>): Promise<void> {
    const docRef = doc(this.firestore, this.COLLECTION, id);
    const dataToUpdate: any = { ...data };
    
    // We don't update ID or creation date normally
    delete dataToUpdate.id;
    delete dataToUpdate.fechaCreacion;

    await updateDoc(docRef, dataToUpdate);
  }

  async toggleActivo(id: string, currentStatus: boolean): Promise<void> {
    const docRef = doc(this.firestore, this.COLLECTION, id);
    await updateDoc(docRef, { activo: !currentStatus });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(this.firestore, this.COLLECTION, id);
    await deleteDoc(docRef);
  }
}
