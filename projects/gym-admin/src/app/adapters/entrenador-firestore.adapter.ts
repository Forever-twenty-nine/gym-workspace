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
        ejerciciosCreadasIds: entrenador.ejerciciosCreadasIds || [],
        entrenadosAsignadosIds: entrenador.entrenadosAsignadosIds || [],
        rutinasCreadasIds: entrenador.rutinasCreadasIds || []
      });
      
      return docRef.id;
    } catch (error) {
      console.error('❌ EntrenadorFirestoreAdapter: Error al crear entrenador:', error);
      throw error;
    }
  }

  /**
   * 📄 Crea un nuevo entrenador con ID específico (para vinculación con usuario)
   * @param id - ID específico del entrenador (igual al uid del usuario)
   * @param entrenador - Datos del entrenador a crear
   */
  async createWithId(id: string, entrenador: Omit<Entrenador, 'id'>): Promise<void> {
    try {
      const entrenadorDoc = doc(this.firestore, this.collectionName, id);
      await setDoc(entrenadorDoc, {
        ...entrenador,
        ejerciciosCreadasIds: entrenador.ejerciciosCreadasIds || [],
        entrenadosAsignadosIds: entrenador.entrenadosAsignadosIds || [],
        rutinasCreadasIds: entrenador.rutinasCreadasIds || []
      });
    } catch (error) {
      console.error('❌ EntrenadorFirestoreAdapter: Error al crear entrenador con ID:', error);
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
   * � Suscribe a cambios en un entrenador específico
   * @param id - ID del entrenador
   * @param callback - Función que se ejecuta cuando el entrenador cambia
   */
  subscribeToEntrenador(id: string, callback: (entrenador: Entrenador | null) => void): void {
    const entrenadorDoc = doc(this.firestore, this.collectionName, id);
    
    const unsubscribe = onSnapshot(
      entrenadorDoc,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const entrenador: Entrenador = {
            id: docSnapshot.id,
            ...data
          } as Entrenador;
          callback(entrenador);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('❌ EntrenadorFirestoreAdapter: Error al suscribirse a entrenador:', error);
        callback(null);
      }
    );

    // Nota: En este caso, no retornamos unsubscribe porque el método no lo requiere,
    // pero en una implementación completa, podrías almacenarlo para limpieza.
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