import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
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
import { Notificacion } from 'gym-library';
import { INotificacionFirestoreAdapter } from '../../services/notificacion.service';

/**
 * 🔔 Adaptador de Firestore para Notificaciones
 * Implementa la interfaz INotificacionFirestoreAdapter para gym-app
 */
@Injectable({ providedIn: 'root' })
export class NotificacionFirestoreAdapter implements INotificacionFirestoreAdapter {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private readonly COLLECTION_NAME = 'notificaciones';

  /**
   * 🔄 Inicializa el listener en tiempo real
   */
  initializeListener(onUpdate: (notificaciones: Notificacion[]) => void): void {
    runInInjectionContext(this.injector, () => {
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
          console.error('❌ Error en listener de notificaciones:', error);
          onUpdate([]);
        }
      );
    });
  }

  /**
   * 💾 Guarda una notificación
   */
  async save(notificacion: Notificacion): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const dataToSave = this.mapToFirestore(notificacion);

        if (notificacion.id) {
          const notificacionRef = doc(this.firestore, this.COLLECTION_NAME, notificacion.id);
          await setDoc(notificacionRef, dataToSave, { merge: true });
        } else {
          await addDoc(collection(this.firestore, this.COLLECTION_NAME), dataToSave);
        }
      } catch (error) {
        console.error('❌ Error al guardar notificación:', error);
        throw error;
      }
    });
  }

  /**
   * 🗑️ Elimina una notificación
   */
  async delete(id: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const notificacionRef = doc(this.firestore, this.COLLECTION_NAME, id);
        await deleteDoc(notificacionRef);
      } catch (error) {
        console.error('❌ Error al eliminar notificación:', error);
        throw error;
      }
    });
  }

  /**
   * � Suscribe a cambios en una notificación específica
   */
  subscribeToNotificacion(id: string, onUpdate: (notificacion: Notificacion | null) => void): void {
    runInInjectionContext(this.injector, () => {
      const notificacionRef = doc(this.firestore, this.COLLECTION_NAME, id);

      onSnapshot(notificacionRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const notificacion: Notificacion = {
            ...data,
            id: doc.id,
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
      }, (error) => {
        console.error('❌ Error en suscripción a notificación:', error);
        onUpdate(null);
      });
    });
  }

  /**
   * 📝 Marca una notificación como leída
   */
  async marcarComoLeida(id: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const notificacionRef = doc(this.firestore, this.COLLECTION_NAME, id);
        await updateDoc(notificacionRef, {
          leida: true,
          fechaLeida: Timestamp.fromDate(new Date())
        });
      } catch (error) {
        console.error('❌ Error al marcar notificación como leída:', error);
        throw error;
      }
    });
  }

  /**
   * ✅ Marca todas las notificaciones de un usuario como leídas
   */
  async marcarTodasComoLeidas(usuarioId: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        // Obtener todas las notificaciones no leídas del usuario
        const notificacionesCol = collection(this.firestore, this.COLLECTION_NAME);
        const notificacionesQuery = query(
          notificacionesCol,
          orderBy('fechaCreacion', 'desc')
        );

        const snapshot = await new Promise<any>((resolve) => {
          const unsubscribe = onSnapshot(notificacionesQuery, (snapshot) => {
            unsubscribe();
            resolve(snapshot);
          });
        });

        const updates: Promise<void>[] = [];

        snapshot.docs.forEach((doc: any) => {
          const data = doc.data();
          if (data.usuarioId === usuarioId && !data.leida) {
            const notificacionRef = doc.ref;
            updates.push(
              updateDoc(notificacionRef, {
                leida: true,
                fechaLeida: Timestamp.fromDate(new Date())
              })
            );
          }
        });

        await Promise.all(updates);
      } catch (error) {
        console.error('❌ Error al marcar todas las notificaciones como leídas:', error);
        throw error;
      }
    });
  }
  private mapToFirestore(notificacion: Notificacion): any {
    const data: any = {
      usuarioId: notificacion.usuarioId,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      leida: notificacion.leida || false,
      fechaCreacion: notificacion.fechaCreacion instanceof Date
        ? Timestamp.fromDate(notificacion.fechaCreacion)
        : Timestamp.fromDate(new Date())
    };

    if (notificacion.fechaLeida) {
      data.fechaLeida = notificacion.fechaLeida instanceof Date
        ? Timestamp.fromDate(notificacion.fechaLeida)
        : notificacion.fechaLeida;
    }

    // Campos específicos por tipo
    if (notificacion.datos) {
      data.datos = notificacion.datos;
    }

    return data;
  }
}