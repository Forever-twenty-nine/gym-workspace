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
import { Mensaje } from 'gym-library';
import { IMensajeFirestoreAdapter } from '../services/mensaje.service';
import { FirebaseAdapterBase } from '../services/firebase-adapter-base';

/**
 * 💬 Adaptador de Firestore para Mensajes
 * Implementa la interfaz IMensajeFirestoreAdapter para gym-admin
 */
@Injectable({ providedIn: 'root' })
export class MensajeFirestoreAdapter extends FirebaseAdapterBase implements IMensajeFirestoreAdapter {
  private readonly COLLECTION = 'mensajes';
  private firestore = inject(Firestore);

  /**
   * 🔄 Inicializa el listener en tiempo real
   */
  initializeListener(onUpdate: (mensajes: Mensaje[]) => void): void {
    const mensajesCol = collection(this.firestore, this.COLLECTION);
    const mensajesQuery = query(mensajesCol, orderBy('fechaEnvio', 'desc'));
    
    onSnapshot(
      mensajesQuery,
      (snapshot) => {
        this.runInZone(() => {
          const mensajes: Mensaje[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              fechaEnvio: data['fechaEnvio'] instanceof Timestamp 
                ? data['fechaEnvio'].toDate() 
                : new Date(data['fechaEnvio']),
              fechaLeido: data['fechaLeido'] instanceof Timestamp
                ? data['fechaLeido'].toDate()
                : data['fechaLeido'] ? new Date(data['fechaLeido']) : undefined,
              fechaEditado: data['fechaEditado'] instanceof Timestamp
                ? data['fechaEditado'].toDate()
                : data['fechaEditado'] ? new Date(data['fechaEditado']) : undefined
            } as Mensaje;
          });
          
          onUpdate(mensajes);
        });
      },
      (error) => {
        this.runInZone(() => {
          console.error('❌ MensajeFirestoreAdapter: Error en listener:', error);
          onUpdate([]);
        });
      }
    );
  }

  /**
   * 📊 Suscripción a un mensaje específico
   */
  subscribeToMensaje(id: string, onUpdate: (mensaje: Mensaje | null) => void): void {
    const mensajeDoc = doc(this.firestore, this.COLLECTION, id);
    
    onSnapshot(
      mensajeDoc,
      (snapshot) => {
        this.runInZone(() => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const mensaje: Mensaje = {
              ...data,
              id: snapshot.id,
              fechaEnvio: data['fechaEnvio'] instanceof Timestamp 
                ? data['fechaEnvio'].toDate() 
                : new Date(data['fechaEnvio']),
              fechaLeido: data['fechaLeido'] instanceof Timestamp
                ? data['fechaLeido'].toDate()
                : data['fechaLeido'] ? new Date(data['fechaLeido']) : undefined,
              fechaEditado: data['fechaEditado'] instanceof Timestamp
                ? data['fechaEditado'].toDate()
                : data['fechaEditado'] ? new Date(data['fechaEditado']) : undefined
            } as Mensaje;
            
            onUpdate(mensaje);
          } else {
            onUpdate(null);
          }
        });
      },
      (error) => {
        this.runInZone(() => {
          console.error('❌ MensajeFirestoreAdapter: Error al suscribirse:', error);
          onUpdate(null);
        });
      }
    );
  }

  /**
   * 💾 Guarda o actualiza un mensaje
   */
  async save(mensaje: Mensaje): Promise<void> {
    return this.runInZone(async () => {
      try {
        const mensajeData = {
          ...mensaje,
          fechaEnvio: mensaje.fechaEnvio instanceof Date 
            ? Timestamp.fromDate(mensaje.fechaEnvio)
            : Timestamp.now(),
          fechaLeido: mensaje.fechaLeido instanceof Date
            ? Timestamp.fromDate(mensaje.fechaLeido)
            : null,
          fechaEditado: mensaje.fechaEditado instanceof Date
            ? Timestamp.fromDate(mensaje.fechaEditado)
            : null
        };

        if (mensaje.id) {
          const mensajeDoc = doc(this.firestore, this.COLLECTION, mensaje.id);
          await setDoc(mensajeDoc, mensajeData, { merge: true });
        } else {
          const mensajesCol = collection(this.firestore, this.COLLECTION);
          await addDoc(mensajesCol, mensajeData);
        }
      } catch (error) {
        console.error('❌ MensajeFirestoreAdapter: Error al guardar:', error);
        throw error;
      }
    });
  }

  /**
   * 🗑️ Elimina un mensaje
   */
  async delete(id: string): Promise<void> {
    return this.runInZone(async () => {
      try {
        const mensajeDoc = doc(this.firestore, this.COLLECTION, id);
        await deleteDoc(mensajeDoc);
      } catch (error) {
        console.error('❌ MensajeFirestoreAdapter: Error al eliminar:', error);
        throw error;
      }
    });
  }

  /**
   * ✅ Marca un mensaje como leído
   */
  async marcarComoLeido(id: string): Promise<void> {
    return this.runInZone(async () => {
      try {
        const mensajeDoc = doc(this.firestore, this.COLLECTION, id);
        await updateDoc(mensajeDoc, {
          leido: true,
          fechaLeido: Timestamp.now()
        });
      } catch (error) {
        console.error('❌ MensajeFirestoreAdapter: Error al marcar como leído:', error);
        throw error;
      }
    });
  }

  /**
   * 📩 Marca un mensaje como entregado
   */
  async marcarComoEntregado(id: string): Promise<void> {
    return this.runInZone(async () => {
      try {
        const mensajeDoc = doc(this.firestore, this.COLLECTION, id);
        await updateDoc(mensajeDoc, {
          entregado: true
        });
      } catch (error) {
        console.error('❌ MensajeFirestoreAdapter: Error al marcar como entregado:', error);
        throw error;
      }
    });
  }
}
