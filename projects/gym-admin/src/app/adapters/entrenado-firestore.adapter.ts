import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentSnapshot,
  deleteField
} from '@angular/fire/firestore';
import { Entrenado, FirebaseAdapterBase } from 'gym-library';

interface IEntrenadoFirestoreAdapter {
  initializeListener(onUpdate: (entrenados: Entrenado[]) => void): void;
  subscribeToEntrenado(id: string, onUpdate: (entrenado: Entrenado | null) => void): void;
  save(entrenado: Entrenado): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class EntrenadoFirestoreAdapter extends FirebaseAdapterBase implements IEntrenadoFirestoreAdapter {
  private readonly COLLECTION = 'entrenados';
  private firestore = inject(Firestore);

  initializeListener(onUpdate: (entrenados: Entrenado[]) => void): void {
    this.runInZone(() => {
      const entrenadosCol = collection(this.firestore, this.COLLECTION);
      
      onSnapshot(entrenadosCol, (snapshot: QuerySnapshot) => {
        this.runInZone(() => {
          const list = snapshot.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
          onUpdate(list);
        });
      });
    });
  }

  subscribeToEntrenado(id: string, onUpdate: (entrenado: Entrenado | null) => void): void {
    this.runInZone(() => {
      const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
      onSnapshot(entrenadoRef, (doc: DocumentSnapshot) => {
        this.runInZone(() => {
          if (doc.exists()) {
            onUpdate(this.mapFromFirestore({ ...doc.data(), id: doc.id }));
          } else {
            onUpdate(null);
          }
        });
      });
    });
  }

  async save(entrenado: Entrenado): Promise<void> {
    return this.runInZone(async () => {
      const dataToSave = this.mapToFirestore(entrenado);
      
      if (entrenado.id) {
        // Usar setDoc con merge para upsert (crear si no existe, actualizar si existe)
        const entrenadoRef = doc(this.firestore, this.COLLECTION, entrenado.id);
        await setDoc(entrenadoRef, dataToSave, { merge: true });
      } else {
        // Crear nuevo entrenado
        await addDoc(collection(this.firestore, this.COLLECTION), dataToSave);
      }
    });
  }

  async delete(id: string): Promise<void> {
    return this.runInZone(async () => {
      const entrenadoRef = doc(this.firestore, this.COLLECTION, id);
      await deleteDoc(entrenadoRef);
    });
  }

  /**
   * 🔄 Mapea datos de Firestore a modelo Entrenado
   */
  private mapFromFirestore(data: any): Entrenado {
    return {
      id: data.id,
      entrenadoresId: data.entrenadoresId || [],
      rutinasAsignadas: data.rutinasAsignadas || [],
      rutinasCreadas: data.rutinasCreadas || [],
      fechaRegistro: data.fechaRegistro?.toDate?.() || data.fechaRegistro || new Date(),
      objetivo: data.objetivo || undefined // Usar undefined en lugar de null para consistencia
    };
  }

  /**
   * 🔄 Convierte un objeto ProgresoRutina desde Firestore
   */
  private convertirProgresoFromFirestore(progreso: any): any {
    const convertido = { ...progreso };

    // Convertir Timestamps a fechas
    if (convertido.fechaInicio?.toDate) {
      convertido.fechaInicio = convertido.fechaInicio.toDate();
    }
    if (convertido.fechaUltimaCompletada?.toDate) {
      convertido.fechaUltimaCompletada = convertido.fechaUltimaCompletada.toDate();
    }

    // Convertir fechas en sesiones
    if (convertido.sesiones) {
      convertido.sesiones = convertido.sesiones.map((sesion: any) => ({
        ...sesion,
        fecha: sesion.fecha?.toDate ? sesion.fecha.toDate() : sesion.fecha
      }));
    }

    return convertido;
  }

  /**
   * 🔄 Mapea modelo Entrenado a datos de Firestore
   */
  private mapToFirestore(entrenado: Entrenado): any {
    const data: any = {
    };

    // Incluir campos, usando delete si son null
    if (entrenado.entrenadoresId !== undefined) {
      data.entrenadoresId = entrenado.entrenadoresId !== null ? entrenado.entrenadoresId : deleteField();
    }

    if (entrenado.rutinasAsignadas !== undefined) {
      data.rutinasAsignadas = entrenado.rutinasAsignadas !== null ? entrenado.rutinasAsignadas : deleteField();
    }

    if (entrenado.rutinasCreadas !== undefined) {
      data.rutinasCreadas = entrenado.rutinasCreadas !== null ? entrenado.rutinasCreadas : deleteField();
    }

    // Solo incluir objetivo si no es undefined
    if (entrenado.objetivo !== undefined) {
      data.objetivo = entrenado.objetivo !== null ? entrenado.objetivo : deleteField();
    }

    if (entrenado.fechaRegistro) {
      data.fechaRegistro = entrenado.fechaRegistro instanceof Date 
        ? Timestamp.fromDate(entrenado.fechaRegistro)
        : entrenado.fechaRegistro;
    }

    return data;
  }

  /**
   * 🔄 Convierte un objeto ProgresoRutina para guardar en Firestore
   */
  private convertirProgresoToFirestore(progreso: any): any {
    const convertido = { ...progreso };

    // Convertir fechas a Timestamps
    if (convertido.fechaInicio instanceof Date) {
      convertido.fechaInicio = Timestamp.fromDate(convertido.fechaInicio);
    }
    if (convertido.fechaUltimaCompletada instanceof Date) {
      convertido.fechaUltimaCompletada = Timestamp.fromDate(convertido.fechaUltimaCompletada);
    }

    // Convertir fechas en sesiones
    if (convertido.sesiones) {
      convertido.sesiones = convertido.sesiones.map((sesion: any) => ({
        ...sesion,
        fecha: sesion.fecha instanceof Date ? Timestamp.fromDate(sesion.fecha) : sesion.fecha
      }));
    }

    return convertido;
  }
}
