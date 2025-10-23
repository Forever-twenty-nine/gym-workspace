import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  Timestamp,
  DocumentSnapshot
} from '@angular/fire/firestore';
import { EstadisticasEntrenado, IEstadisticasEntrenadoFirestoreAdapter, FirebaseAdapterBase } from 'gym-library';

@Injectable({ providedIn: 'root' })
export class EstadisticasEntrenadoFirestoreAdapter extends FirebaseAdapterBase implements IEstadisticasEntrenadoFirestoreAdapter {
  private readonly COLLECTION = 'estadisticas-entrenado';
  private firestore = inject(Firestore);

  getEstadisticas(entrenadoId: string, callback: (estadisticas: EstadisticasEntrenado | null) => void): () => void {
    return this.runInZone(() => {
      const estadisticasRef = doc(this.firestore, this.COLLECTION, entrenadoId);

      return onSnapshot(estadisticasRef, (doc: DocumentSnapshot) => {
        this.runInZone(() => {
          if (doc.exists()) {
            callback(this.mapFromFirestore({ ...doc.data(), id: doc.id }));
          } else {
            callback(null);
          }
        });
      });
    });
  }

  async create(entrenadoId: string, estadisticas: EstadisticasEntrenado): Promise<void> {
    return this.runInZone(async () => {
      const dataToSave = this.mapToFirestore(estadisticas);
      const estadisticasRef = doc(this.firestore, this.COLLECTION, entrenadoId);
      await setDoc(estadisticasRef, dataToSave);
    });
  }

  async update(entrenadoId: string, estadisticas: Partial<EstadisticasEntrenado>): Promise<void> {
    return this.runInZone(async () => {
      const dataToSave = this.mapToFirestore(estadisticas);
      const estadisticasRef = doc(this.firestore, this.COLLECTION, entrenadoId);
      await updateDoc(estadisticasRef, dataToSave);
    });
  }

  async delete(entrenadoId: string): Promise<void> {
    return this.runInZone(async () => {
      const estadisticasRef = doc(this.firestore, this.COLLECTION, entrenadoId);
      await deleteDoc(estadisticasRef);
    });
  }

  /**
   * 🔄 Mapea datos de Firestore a modelo EstadisticasEntrenado
   */
  private mapFromFirestore(data: any): EstadisticasEntrenado {
    return {
      totalRutinasCompletadas: data.totalRutinasCompletadas || 0,
      rachaActual: data.rachaActual || 0,
      mejorRacha: data.mejorRacha || 0,
      ultimaFechaEntrenamiento: data.ultimaFechaEntrenamiento?.toDate?.() || data.ultimaFechaEntrenamiento,
      nivel: data.nivel || 1,
      experiencia: data.experiencia || 0,
      experienciaProximoNivel: data.experienciaProximoNivel || 100
    };
  }

  /**
   * 🔄 Mapea modelo EstadisticasEntrenado a datos de Firestore
   */
  private mapToFirestore(estadisticas: Partial<EstadisticasEntrenado>): any {
    const data: any = {};

    if (estadisticas.totalRutinasCompletadas !== undefined) {
      data.totalRutinasCompletadas = estadisticas.totalRutinasCompletadas;
    }

    if (estadisticas.rachaActual !== undefined) {
      data.rachaActual = estadisticas.rachaActual;
    }

    if (estadisticas.mejorRacha !== undefined) {
      data.mejorRacha = estadisticas.mejorRacha;
    }

    if (estadisticas.ultimaFechaEntrenamiento !== undefined) {
      data.ultimaFechaEntrenamiento = estadisticas.ultimaFechaEntrenamiento instanceof Date
        ? Timestamp.fromDate(estadisticas.ultimaFechaEntrenamiento)
        : estadisticas.ultimaFechaEntrenamiento;
    }

    if (estadisticas.nivel !== undefined) {
      data.nivel = estadisticas.nivel;
    }

    if (estadisticas.experiencia !== undefined) {
      data.experiencia = estadisticas.experiencia;
    }

    if (estadisticas.experienciaProximoNivel !== undefined) {
      data.experienciaProximoNivel = estadisticas.experienciaProximoNivel;
    }

    return data;
  }
}