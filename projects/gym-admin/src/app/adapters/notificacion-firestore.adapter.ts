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
  getDocs,
  Timestamp
} from '@angular/fire/firestore';
import { Notificacion } from 'gym-library';
import { INotificacionFirestoreAdapter } from '../services/notificacion.service';
import { FirebaseAdapterBase } from '../services/firebase-adapter-base';

/**
 * 🔔 Adaptador de Firestore para Notificaciones
 * Implementa la interfaz INotificacionFirestoreAdapter para gym-admin
 */
@Injectable({ providedIn: 'root' })
export class NotificacionFirestoreAdapter extends FirebaseAdapterBase implements INotificacionFirestoreAdapter {
  private firestore = inject(Firestore);
  private readonly COLLECTION_NAME = 'notificaciones';

  /**
   * 🔄 Inicializa el listener en tiempo real
   */
  initializeListener(onUpdate: (notificaciones: Notificacion[]) => void): void {
    this.runInZone(() => {
      const notificacionesCol = collection(this.firestore, this.COLLECTION_NAME);
      const notificacionesQuery = query(notificacionesCol, orderBy('fechaCreacion', 'desc'));
      
      onSnapshot(
        notificacionesQuery,
        (snapshot) => {
          this.runInZone(() => {
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
          });
        },
        (error) => {
          this.runInZone(() => {
            console.error('❌ NotificacionFirestoreAdapter: Error en listener:', error);
            onUpdate([]);
          });
        }
      );
    });
  }

  /**
   * 📊 Suscripción a una notificación específica
   */
  subscribeToNotificacion(id: string, onUpdate: (notificacion: Notificacion | null) => void): void {
    this.runInZone(() => {
      const notificacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
      
      onSnapshot(
        notificacionDoc,
        (snapshot) => {
          this.runInZone(() => {
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
          });
        },
        (error) => {
          this.runInZone(() => {
            console.error('❌ NotificacionFirestoreAdapter: Error al suscribirse:', error);
            onUpdate(null);
          });
        }
      );
    });
  }

  /**
   * 💾 Guarda o actualiza una notificación
   */
  async save(notificacion: Notificacion): Promise<void> {
    return this.runInZone(async () => {
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
    });
  }

  /**
   * 🗑️ Elimina una notificación
   */
  async delete(id: string): Promise<void> {
    return this.runInZone(async () => {
      try {
        const notificacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
        await deleteDoc(notificacionDoc);
      } catch (error) {
        console.error('❌ NotificacionFirestoreAdapter: Error al eliminar:', error);
        throw error;
      }
    });
  }

  /**
   * ✅ Marca una notificación como leída
   */
  async marcarComoLeida(id: string): Promise<void> {
    return this.runInZone(async () => {
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
    });
  }

  /**
   * ✅ Marca todas las notificaciones como leídas para un usuario
   */
  async marcarTodasComoLeidas(usuarioId: string): Promise<void> {
    return this.runInZone(async () => {
      try {
        const notificacionesCol = collection(this.firestore, this.COLLECTION_NAME);
        const querySnapshot = await getDocs(query(notificacionesCol));
        
        const updates = querySnapshot.docs
          .filter(doc => doc.data()['usuarioId'] === usuarioId && !doc.data()['leida'])
          .map(doc => updateDoc(doc.ref, {
            leida: true,
            fechaLeida: Timestamp.now()
          }));
        
        await Promise.all(updates);
      } catch (error) {
        console.error('❌ NotificacionFirestoreAdapter: Error al marcar todas como leídas:', error);
        throw error;
      }
    });
  }
}
