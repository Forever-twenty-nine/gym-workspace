import { Injectable, inject } from '@angular/core';
import { 
  Firestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  query,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { IInvitacionFirestoreAdapter, Invitacion } from 'gym-library';

/**
 * 📨 Adaptador de Firestore para Invitaciones
 * Implementa la interfaz IInvitacionFirestoreAdapter para gym-admin
 */
@Injectable({ providedIn: 'root' })
export class InvitacionFirestoreAdapter implements IInvitacionFirestoreAdapter {
  private firestore = inject(Firestore);
  private readonly COLLECTION_NAME = 'invitaciones';

  /**
   * 🔄 Inicializa el listener en tiempo real
   */
  initializeListener(onUpdate: (invitaciones: Invitacion[]) => void): void {
    const invitacionesCol = collection(this.firestore, this.COLLECTION_NAME);
    const invitacionesQuery = query(invitacionesCol, orderBy('fechaEnvio', 'desc'));
    
    onSnapshot(
      invitacionesQuery,
      (snapshot) => {
        const invitaciones: Invitacion[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            fechaEnvio: data['fechaEnvio'] instanceof Timestamp 
              ? data['fechaEnvio'].toDate() 
              : new Date(data['fechaEnvio']),
            fechaRespuesta: data['fechaRespuesta'] instanceof Timestamp
              ? data['fechaRespuesta'].toDate()
              : data['fechaRespuesta'] ? new Date(data['fechaRespuesta']) : undefined
          } as Invitacion;
        });
        
        onUpdate(invitaciones);
      },
      (error) => {
        console.error('❌ InvitacionFirestoreAdapter: Error en listener:', error);
        onUpdate([]);
      }
    );
  }

  /**
   * 📊 Suscripción a una invitación específica
   */
  subscribeToInvitacion(id: string, onUpdate: (invitacion: Invitacion | null) => void): void {
    const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
    
    onSnapshot(
      invitacionDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const invitacion: Invitacion = {
            ...data,
            id: snapshot.id,
            fechaEnvio: data['fechaEnvio'] instanceof Timestamp 
              ? data['fechaEnvio'].toDate() 
              : new Date(data['fechaEnvio']),
            fechaRespuesta: data['fechaRespuesta'] instanceof Timestamp
              ? data['fechaRespuesta'].toDate()
              : data['fechaRespuesta'] ? new Date(data['fechaRespuesta']) : undefined
          } as Invitacion;
          
          onUpdate(invitacion);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.error('❌ InvitacionFirestoreAdapter: Error al suscribirse:', error);
        onUpdate(null);
      }
    );
  }

  /**
   * 💾 Guarda o actualiza una invitación
   */
  async save(invitacion: Invitacion): Promise<void> {
    try {
      const invitacionData = {
        ...invitacion,
        fechaEnvio: invitacion.fechaEnvio instanceof Date 
          ? Timestamp.fromDate(invitacion.fechaEnvio)
          : Timestamp.now(),
        fechaRespuesta: invitacion.fechaRespuesta instanceof Date
          ? Timestamp.fromDate(invitacion.fechaRespuesta)
          : null
      };

      if (invitacion.id) {
        const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, invitacion.id);
        await setDoc(invitacionDoc, invitacionData, { merge: true });
      } else {
        const invitacionesCol = collection(this.firestore, this.COLLECTION_NAME);
        await addDoc(invitacionesCol, invitacionData);
      }
    } catch (error) {
      console.error('❌ InvitacionFirestoreAdapter: Error al guardar:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Elimina una invitación
   */
  async delete(id: string): Promise<void> {
    try {
      const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      await deleteDoc(invitacionDoc);
    } catch (error) {
      console.error('❌ InvitacionFirestoreAdapter: Error al eliminar:', error);
      throw error;
    }
  }

  /**
   * ✅ Acepta una invitación
   */
  async aceptar(id: string): Promise<void> {
    try {
      const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      await updateDoc(invitacionDoc, {
        estado: 'aceptada',
        fechaRespuesta: Timestamp.now()
      });
    } catch (error) {
      console.error('❌ InvitacionFirestoreAdapter: Error al aceptar:', error);
      throw error;
    }
  }

  /**
   * ❌ Rechaza una invitación
   */
  async rechazar(id: string): Promise<void> {
    try {
      const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      await updateDoc(invitacionDoc, {
        estado: 'rechazada',
        fechaRespuesta: Timestamp.now()
      });
    } catch (error) {
      console.error('❌ InvitacionFirestoreAdapter: Error al rechazar:', error);
      throw error;
    }
  }
}
