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
  setDoc,
  Timestamp
} from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { IEntrenadorFirestoreAdapter } from '../services/entrenador.service';
import { Entrenador } from 'gym-library';
import { FirebaseAdapterBase } from '../services/firebase-adapter-base';

/**
 * 🏋️‍♂️ Adaptador de Firestore para Entrenadores
 * Implementa la interfaz IEntrenadorFirestoreAdapter para gym-admin
 */
@Injectable({
  providedIn: 'root'
})
export class EntrenadorFirestoreAdapter extends FirebaseAdapterBase implements IEntrenadorFirestoreAdapter {
  private firestore = inject(Firestore);
  private collectionName = 'entrenadores';

  /**
   * 📥 Obtiene todos los entrenadores con listener en tiempo real
   * @param callback - Función que se ejecuta cuando los datos cambian
   * @returns Función para cancelar la suscripción
   */
  getEntrenadores(callback: (entrenadores: Entrenador[]) => void): () => void {
    const entrenadoresCollection = collection(this.firestore, this.collectionName);
    const entrenadoresQuery = query(entrenadoresCollection, orderBy('fechaRegistro', 'desc'));
    
    const unsubscribe = onSnapshot(
      entrenadoresQuery,
      (snapshot) => {
        this.runInZone(() => {
          const entrenadores: Entrenador[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const entrenador: Entrenador = {
              id: doc.id,
              fechaRegistro: data['fechaRegistro']?.toDate?.() || data['fechaRegistro'] || new Date(),
              ejerciciosCreadasIds: data['ejerciciosCreadasIds'] || [],
              entrenadosAsignadosIds: data['entrenadosAsignadosIds'] || [],
              rutinasCreadasIds: data['rutinasCreadasIds'] || []
            };
            entrenadores.push(entrenador);
          });
          
          callback(entrenadores);
        });
      },
      (error) => {
        this.runInZone(() => {
          console.error('❌ EntrenadorFirestoreAdapter: Error al obtener entrenadores:', error);
          callback([]);
        });
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
      return await this.runInZone(async () => {
        const entrenadoresCollection = collection(this.firestore, this.collectionName);
        const docRef = await addDoc(entrenadoresCollection, {
          fechaRegistro: entrenador.fechaRegistro ? Timestamp.fromDate(entrenador.fechaRegistro) : Timestamp.now(),
          ejerciciosCreadasIds: entrenador.ejerciciosCreadasIds || [],
          entrenadosAsignadosIds: entrenador.entrenadosAsignadosIds || [],
          rutinasCreadasIds: entrenador.rutinasCreadasIds || []
        });
        
        return docRef.id;
      });
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
      return await this.runInZone(async () => {
        const entrenadorDoc = doc(this.firestore, this.collectionName, id);
        await setDoc(entrenadorDoc, {
          fechaRegistro: entrenador.fechaRegistro ? Timestamp.fromDate(entrenador.fechaRegistro) : Timestamp.now(),
          ejerciciosCreadasIds: entrenador.ejerciciosCreadasIds || [],
          entrenadosAsignadosIds: entrenador.entrenadosAsignadosIds || [],
          rutinasCreadasIds: entrenador.rutinasCreadasIds || []
        });
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
      return await this.runInZone(async () => {
        const entrenadorDoc = doc(this.firestore, this.collectionName, id);
        const data: any = { ...entrenador };
        if (entrenador.fechaRegistro) {
          data.fechaRegistro = Timestamp.fromDate(entrenador.fechaRegistro);
        }
        await updateDoc(entrenadorDoc, data);
      });
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
        this.runInZone(() => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const entrenador: Entrenador = {
              id: docSnapshot.id,
              fechaRegistro: data['fechaRegistro']?.toDate?.() || data['fechaRegistro'] || new Date(),
              ejerciciosCreadasIds: data['ejerciciosCreadasIds'] || [],
              entrenadosAsignadosIds: data['entrenadosAsignadosIds'] || [],
              rutinasCreadasIds: data['rutinasCreadasIds'] || []
            };
            callback(entrenador);
          } else {
            callback(null);
          }
        });
      },
      (error) => {
        this.runInZone(() => {
          console.error('❌ EntrenadorFirestoreAdapter: Error al suscribirse a entrenador:', error);
          callback(null);
        });
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
      return await this.runInZone(async () => {
        const entrenadorDoc = doc(this.firestore, this.collectionName, id);
        await deleteDoc(entrenadorDoc);
      });
    } catch (error) {
      console.error('❌ EntrenadorFirestoreAdapter: Error al eliminar entrenador:', error);
      throw error;
    }
  }
}