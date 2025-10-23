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
  Timestamp,
  increment
} from '@angular/fire/firestore';
import { IConversacionFirestoreAdapter, Conversacion } from 'gym-library';
import { FirebaseAdapterBase } from 'gym-library';

/**
 * Adaptador de Firestore para Conversaciones
 * Implementa la interfaz IConversacionFirestoreAdapter para gym-admin
 */
@Injectable({ providedIn: 'root' })
export class ConversacionFirestoreAdapter extends FirebaseAdapterBase implements IConversacionFirestoreAdapter {
  private firestore = inject(Firestore);
  private readonly COLLECTION_NAME = 'conversaciones';

  /**
   * Inicializa el listener en tiempo real
   */
  initializeListener(onUpdate: (conversaciones: Conversacion[]) => void): void {
    const conversacionesCol = collection(this.firestore, this.COLLECTION_NAME);
    const conversacionesQuery = query(conversacionesCol, orderBy('fechaUltimaActividad', 'desc'));
    
    onSnapshot(
      conversacionesQuery,
      (snapshot) => {
        this.runInZone(() => {
          const conversaciones: Conversacion[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              fechaCreacion: data['fechaCreacion'] instanceof Timestamp 
                ? data['fechaCreacion'].toDate() 
                : new Date(data['fechaCreacion']),
              fechaUltimaActividad: data['fechaUltimaActividad'] instanceof Timestamp
                ? data['fechaUltimaActividad'].toDate()
                : new Date(data['fechaUltimaActividad']),
              ultimoMensajeFecha: data['ultimoMensajeFecha'] instanceof Timestamp
                ? data['ultimoMensajeFecha'].toDate()
                : data['ultimoMensajeFecha'] ? new Date(data['ultimoMensajeFecha']) : undefined
            } as Conversacion;
          });
          
          onUpdate(conversaciones);
        });
      },
      (error) => {
        this.runInZone(() => {
          console.error('❌ ConversacionFirestoreAdapter: Error en listener:', error);
          onUpdate([]);
        });
      }
    );
  }

  /**
   * Suscripción a una conversación específica
   */
  subscribeToConversacion(id: string, onUpdate: (conversacion: Conversacion | null) => void): void {
    const conversacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
    
    onSnapshot(
      conversacionDoc,
      (snapshot) => {
        this.runInZone(() => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const conversacion: Conversacion = {
              ...data,
              id: snapshot.id,
              fechaCreacion: data['fechaCreacion'] instanceof Timestamp 
                ? data['fechaCreacion'].toDate() 
                : new Date(data['fechaCreacion']),
              fechaUltimaActividad: data['fechaUltimaActividad'] instanceof Timestamp
                ? data['fechaUltimaActividad'].toDate()
                : new Date(data['fechaUltimaActividad']),
              ultimoMensajeFecha: data['ultimoMensajeFecha'] instanceof Timestamp
                ? data['ultimoMensajeFecha'].toDate()
                : data['ultimoMensajeFecha'] ? new Date(data['ultimoMensajeFecha']) : undefined
            } as Conversacion;
            
            onUpdate(conversacion);
          } else {
            onUpdate(null);
          }
        });
      },
      (error) => {
        this.runInZone(() => {
          console.error('❌ ConversacionFirestoreAdapter: Error al suscribirse:', error);
          onUpdate(null);
        });
      }
    );
  }

  /**
   * Guarda o actualiza una conversación
   */
  async save(conversacion: Conversacion): Promise<void> {
    try {
      return await this.runInZone(async () => {
        const conversacionData = {
          ...conversacion,
          fechaCreacion: conversacion.fechaCreacion instanceof Date 
            ? Timestamp.fromDate(conversacion.fechaCreacion)
            : Timestamp.now(),
          fechaUltimaActividad: conversacion.fechaUltimaActividad instanceof Date
            ? Timestamp.fromDate(conversacion.fechaUltimaActividad)
            : Timestamp.now(),
          ultimoMensajeFecha: conversacion.ultimoMensajeFecha instanceof Date
            ? Timestamp.fromDate(conversacion.ultimoMensajeFecha)
            : null
        };

        if (conversacion.id) {
          const conversacionDoc = doc(this.firestore, this.COLLECTION_NAME, conversacion.id);
          await setDoc(conversacionDoc, conversacionData, { merge: true });
        } else {
          const conversacionesCol = collection(this.firestore, this.COLLECTION_NAME);
          await addDoc(conversacionesCol, conversacionData);
        }
      });
    } catch (error) {
      console.error('❌ ConversacionFirestoreAdapter: Error al guardar:', error);
      throw error;
    }
  }

  /**
   * Elimina una conversación
   */
  async delete(id: string): Promise<void> {
    try {
      return await this.runInZone(async () => {
        const conversacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
        await deleteDoc(conversacionDoc);
      });
    } catch (error) {
      console.error('❌ ConversacionFirestoreAdapter: Error al eliminar:', error);
      throw error;
    }
  }

  /**
   * Actualiza el último mensaje de la conversación
   */
  async actualizarUltimoMensaje(id: string, mensaje: string, fecha: Date): Promise<void> {
    try {
      return await this.runInZone(async () => {
        const conversacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
        await updateDoc(conversacionDoc, {
          ultimoMensaje: mensaje.substring(0, 100), // Limitar a 100 caracteres
          ultimoMensajeFecha: Timestamp.fromDate(fecha),
          fechaUltimaActividad: Timestamp.now()
        });
      });
    } catch (error) {
      console.error('ConversacionFirestoreAdapter: Error al actualizar último mensaje:', error);
      throw error;
    }
  }

  /**
   * Incrementa el contador de no leídos
   */
  async incrementarNoLeidos(id: string, tipo: 'entrenador' | 'entrenado'): Promise<void> {
    try {
      return await this.runInZone(async () => {
        const conversacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
        const campo = tipo === 'entrenador' ? 'noLeidosEntrenador' : 'noLeidosEntrenado';
        await updateDoc(conversacionDoc, {
          [campo]: increment(1),
          fechaUltimaActividad: Timestamp.now()
        });
      });
    } catch (error) {
      console.error('ConversacionFirestoreAdapter: Error al incrementar no leídos:', error);
      throw error;
    }
  }

  /**
   * Resetea el contador de no leídos
   */
  async resetearNoLeidos(id: string, tipo: 'entrenador' | 'entrenado'): Promise<void> {
    try {
      return await this.runInZone(async () => {
        const conversacionDoc = doc(this.firestore, this.COLLECTION_NAME, id);
        const campo = tipo === 'entrenador' ? 'noLeidosEntrenador' : 'noLeidosEntrenado';
        await updateDoc(conversacionDoc, {
          [campo]: 0
        });
      });
    } catch (error) {
      console.error('ConversacionFirestoreAdapter: Error al resetear no leídos:', error);
      throw error;
    }
  }
}
