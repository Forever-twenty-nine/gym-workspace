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
import { INotificacionFirestoreAdapter, Notificacion } from 'gym-library';

/**
 * 🔔 Adaptador de Firestore para Notificaciones
 * Implementa la interfaz INotificacionFirestoreAdapter para gym-admin
 */
@Injectable({ providedIn: 'root' })
export class NotificacionFirestoreAdapter implements INotificacionFirestoreAdapter {
  private firestore = inject(Firestore);
  private readonly COLLECTION_NAME = 'notificaciones';

  /**
   * 🔄 Inicializa el listener en tiempo real
   */
  initializeListener(onUpdate: (notificaciones: Notificacion[]) => void): void {
    const notificacionesCol = collection(this.firestore, this.COLLECTION_NAME);
    const notificacionesQuery = query(notificacionesCol, orderBy('fechaCreacion', 'desc'));
    
    onSnapshot(
      notificacionesQuery,
      (snapshot) => {
        const notificaciones: Notificacion[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            fechaCreacion: data['fechaCreacion'] instanceof Timestamp 
              ? data['fechaCreacion'].toDate() 
              : new Date(data['fechaCreacion']),
            fechaLeida: data['fechaLeida'] instanceof Timestamp
              ? data['fechaLeida'].toDate()
              : data['fechaLeida'] ? new Date(data['fechaLeida']) : undefined
          } as Notificacion;
        });
        
        onUpdate(notificaciones);
      },
      (error) => {
        console.error('❌ NotificacionFirestoreAdapter: Error en listener:', error);
        onUpdate([]);
      }
    );
  }

  /**
   * 📊 Suscripción a una notificación específica
   */
  subscribeToNotificacion(id: string, onUpdate: (notificacion: Notificacion | null) => void): void {
    const notificacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
    
    onSnapshot(
      notificacionDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const notificacion: Notificacion = {
            ...data,
            id: snapshot.id,
            fechaCreacion: data['fechaCreacion'] instanceof Timestamp 
              ? data['fechaCreacion'].toDate() 
              : new Date(data['fechaCreacion']),
            fechaLeida: data['fechaLeida'] instanceof Timestamp
              ? data['fechaLeida'].toDate()
              : data['fechaLeida'] ? new Date(data['fechaLeida']) : undefined
          } as Notificacion;
          
          onUpdate(notificacion);
        } else {
          onUpdate(null);
        }
      },
      (error) => {
        console.error('❌ NotificacionFirestoreAdapter: Error al suscribirse:', error);
        onUpdate(null);
      }
    );
  }

  /**
   * 💾 Guarda o actualiza una notificación
   */
  async save(notificacion: Notificacion): Promise<void> {
    try {
      const notificacionData = {
        ...notificacion,
        fechaCreacion: notificacion.fechaCreacion instanceof Date 
          ? Timestamp.fromDate(notificacion.fechaCreacion)
          : Timestamp.now(),
        fechaLeida: notificacion.fechaLeida instanceof Date
          ? Timestamp.fromDate(notificacion.fechaLeida)
          : null
      };

      if (notificacion.id) {
        const notificacionDoc = doc(this.firestore, this.COLLECTION_NAME, notificacion.id);
        await setDoc(notificacionDoc, notificacionData, { merge: true });
      } else {
        const notificacionesCol = collection(this.firestore, this.COLLECTION_NAME);
        await addDoc(notificacionesCol, notificacionData);
      }
    } catch (error) {
      console.error('❌ NotificacionFirestoreAdapter: Error al guardar:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Elimina una notificación
   */
  async delete(id: string): Promise<void> {
    try {
      const notificacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      await deleteDoc(notificacionDoc);
    } catch (error) {
      console.error('❌ NotificacionFirestoreAdapter: Error al eliminar:', error);
      throw error;
    }
  }

  /**
   * ✅ Marca una notificación como leída
   */
  async marcarComoLeida(id: string): Promise<void> {
    try {
      const notificacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      await updateDoc(notificacionDoc, {
        leida: true,
        fechaLeida: Timestamp.now()
      });
    } catch (error) {
      console.error('❌ NotificacionFirestoreAdapter: Error al marcar como leída:', error);
      throw error;
    }
  }

  /**
   * ✅ Marca todas las notificaciones de un usuario como leídas
   */
  async marcarTodasComoLeidas(usuarioId: string): Promise<void> {
    try {
      const notificacionesCol = collection(this.firestore, this.COLLECTION_NAME);
      const snapshot = await onSnapshot(
        query(notificacionesCol),
        async (querySnapshot) => {
          const updates = querySnapshot.docs
            .filter(doc => doc.data()['usuarioId'] === usuarioId && !doc.data()['leida'])
            .map(doc => updateDoc(doc.ref, {
              leida: true,
              fechaLeida: Timestamp.now()
            }));
          
          await Promise.all(updates);
        }
      );
    } catch (error) {
      console.error('❌ NotificacionFirestoreAdapter: Error al marcar todas como leídas:', error);
      throw error;
    }
  }
}
