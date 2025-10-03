import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  Firestore,
  query,
  orderBy,
  setDoc
} from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { IEntrenadorFirestoreAdapter } from 'gym-library';
import { Entrenador } from 'gym-library';

/**
 * 🏋️‍♂️ Adaptador de Firestore para Entrenadores
 * Implementa la interfaz IEntrenadorFirestoreAdapter para gym-admin
 */
@Injectable({
  providedIn: 'root'
})
export class EntrenadorFirestoreAdapter implements IEntrenadorFirestoreAdapter {
  private firestore = inject(Firestore);
  private collectionName = 'entrenadores';

  /**
   * 📥 Obtiene todos los entrenadores con listener en tiempo real
   * @param callback - Función que se ejecuta cuando los datos cambian
   * @returns Función para cancelar la suscripción
   */
  getEntrenadores(callback: (entrenadores: Entrenador[]) => void): () => void {
    const entrenadoresCollection = collection(this.firestore, this.collectionName);
    const entrenadoresQuery = query(entrenadoresCollection, orderBy('activo', 'desc'));
    
    const unsubscribe = onSnapshot(
      entrenadoresQuery,
      (snapshot) => {
        const entrenadores: Entrenador[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          entrenadores.push({
            id: doc.id,
            ...data
          } as Entrenador);
        });
        
        callback(entrenadores);
      },
      (error) => {
        console.error('❌ EntrenadorFirestoreAdapter: Error al obtener entrenadores:', error);
        callback([]);
      }
    );

    return unsubscribe;
  }

  /**
   * ➕ Crea un nuevo entrenador
   * @param entrenador - Datos del entrenador a crear
   * @returns Promise con el ID del entrenador creado
   */
  async create(entrenador: Omit<Entrenador, 'id'>): Promise<string> {
    try {
      const entrenadoresCollection = collection(this.firestore, this.collectionName);
      const docRef = await addDoc(entrenadoresCollection, {
        ...entrenador,
        clientes: entrenador.clientes || [],
        rutinas: entrenador.rutinas || []
      });
      
      return docRef.id;
    } catch (error) {
      console.error('❌ EntrenadorFirestoreAdapter: Error al crear entrenador:', error);
      throw error;
    }
  }

  /**
   * ✏️ Actualiza un entrenador existente
   * @param id - ID del entrenador
   * @param entrenador - Datos actualizados del entrenador
   */
  async update(id: string, entrenador: Partial<Entrenador>): Promise<void> {
    try {
      const entrenadorDoc = doc(this.firestore, this.collectionName, id);
      await updateDoc(entrenadorDoc, entrenador);
    } catch (error) {
      console.error('❌ EntrenadorFirestoreAdapter: Error al actualizar entrenador:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Elimina un entrenador
   * @param id - ID del entrenador a eliminar
   */
  async delete(id: string): Promise<void> {
    try {
      const entrenadorDoc = doc(this.firestore, this.collectionName, id);
      await deleteDoc(entrenadorDoc);
    } catch (error) {
      console.error('❌ EntrenadorFirestoreAdapter: Error al eliminar entrenador:', error);
      throw error;
    }
  }
}