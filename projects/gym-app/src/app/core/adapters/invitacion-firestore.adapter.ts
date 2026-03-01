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
import { Invitacion } from 'gym-library';
import { IInvitacionFirestoreAdapter } from '../../services/invitacion.service';

/**
 * 📨 Adaptador de Firestore para Invitaciones
 * Implementa la interfaz IInvitacionFirestoreAdapter para gym-app
 */
@Injectable({ providedIn: 'root' })
export class InvitacionFirestoreAdapter implements IInvitacionFirestoreAdapter {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private readonly COLLECTION_NAME = 'invitaciones';

  /**
   * 🔄 Inicializa el listener en tiempo real
   */
  initializeListener(onUpdate: (invitaciones: Invitacion[]) => void): void {
    runInInjectionContext(this.injector, () => {
      const invitacionesCol = collection(this.firestore, this.COLLECTION_NAME);
      const invitacionesQuery = query(invitacionesCol, orderBy('fechaCreacion', 'desc'));

      onSnapshot(
        invitacionesQuery,
        (snapshot) => {
          const invitaciones: Invitacion[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              fechaCreacion: data['fechaCreacion'] instanceof Timestamp
                ? data['fechaCreacion'].toDate()
                : new Date(data['fechaCreacion']),
              fechaRespuesta: data['fechaRespuesta'] instanceof Timestamp
                ? data['fechaRespuesta'].toDate()
                : data['fechaRespuesta'] ? new Date(data['fechaRespuesta']) : undefined
            } as Invitacion;
          });
          onUpdate(invitaciones);
        },
        (error) => {
          console.error('❌ InvitacionFirestoreAdapter: Error en listener:', error);
        }
      );
    });
  }

  /**
   * 📨 Suscribe a cambios en una invitación específica
   */
  subscribeToInvitacion(id: string, onUpdate: (invitacion: Invitacion | null) => void): void {
    runInInjectionContext(this.injector, () => {
      const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);

      onSnapshot(
        invitacionDoc,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const invitacion: Invitacion = {
              ...data,
              id: snapshot.id,
              fechaCreacion: data['fechaCreacion'] instanceof Timestamp
                ? data['fechaCreacion'].toDate()
                : new Date(data['fechaCreacion']),
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
          console.error('❌ InvitacionFirestoreAdapter: Error en suscripción:', error);
        }
      );
    });
  }

  /**
   * 💾 Guarda una invitación (crea o actualiza)
   */
  async save(invitacion: Invitacion): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const invitacionData = {
          ...invitacion,
          fechaCreacion: invitacion.fechaCreacion instanceof Date
            ? Timestamp.fromDate(invitacion.fechaCreacion)
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
    });
  }

  /**
   * 🗑️ Elimina una invitación
   */
  async delete(id: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
        await deleteDoc(invitacionDoc);
      } catch (error) {
        console.error('❌ InvitacionFirestoreAdapter: Error al eliminar:', error);
        throw error;
      }
    });
  }

  /**
   * 🔄 Actualiza el estado de una invitación
   */
  async updateEstado(id: string, estado: 'pendiente' | 'aceptada' | 'rechazada'): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        const invitacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
        await updateDoc(invitacionDoc, {
          estado,
          fechaRespuesta: estado !== 'pendiente' ? Timestamp.now() : null
        });
      } catch (error) {
        console.error('❌ InvitacionFirestoreAdapter: Error al actualizar estado:', error);
        throw error;
      }
    });
  }
}