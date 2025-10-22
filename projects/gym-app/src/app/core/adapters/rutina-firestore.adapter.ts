import { Injectable, inject, Injector, effect, runInInjectionContext } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  setDoc,
  updateDoc,
  Timestamp,
  collectionData,
  docData,
  deleteField
} from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Rutina, IRutinaFirestoreAdapter } from 'gym-library';

@Injectable({ providedIn: 'root' })
export class RutinaFirestoreAdapter implements IRutinaFirestoreAdapter {
  private readonly COLLECTION = 'rutinas';
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  initializeListener(onUpdate: (rutinas: Rutina[]) => void): void {
    // Ejecutar dentro del contexto de inyección
    runInInjectionContext(this.injector, () => {
      const rutinasSignal = toSignal(
        collectionData(collection(this.firestore, this.COLLECTION), { idField: 'id' })
      );
      
      effect(() => {
        const data = rutinasSignal();
        if (data) {
          const list = data.map((d: any) => this.mapFromFirestore(d));
          onUpdate(list);
        }
      });
    });
  }

  subscribeToRutina(id: string, onUpdate: (rutina: Rutina | null) => void): void {
    // Ejecutar la suscripción dentro del contexto de inyección
    runInInjectionContext(this.injector, () => {
      const rutinaRef = doc(this.firestore, this.COLLECTION, id);
      
      docData(rutinaRef, { idField: 'id' }).subscribe({
        next: (data) => {
          if (data) {
            onUpdate(this.mapFromFirestore(data));
          } else {
            onUpdate(null);
          }
        },
        error: (error) => {
          console.error('Error subscribing to rutina:', error);
          onUpdate(null);
        }
      });
    });
  }

  async save(rutina: Rutina): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const dataToSave = this.mapToFirestore(rutina);
      
      if (rutina.id) {
        const rutinaRef = doc(this.firestore, this.COLLECTION, rutina.id);
        await setDoc(rutinaRef, dataToSave, { merge: true });
      } else {
        const rutinaRef = doc(collection(this.firestore, this.COLLECTION));
        await setDoc(rutinaRef, dataToSave);
      }
    });
  }

  async delete(id: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const rutinaRef = doc(this.firestore, this.COLLECTION, id);
      await deleteDoc(rutinaRef);
    });
  }

  private mapFromFirestore(data: any): Rutina {
    return {
      id: data.id,
      nombre: data.nombre || '',
      activa: data.activa ?? true,
      descripcion: data.descripcion,
      ejerciciosIds: data.ejerciciosIds || data.ejercicios || [], // Compatibilidad
      fechaCreacion: data.fechaCreacion?.toDate?.() || data.fechaCreacion,
      fechaModificacion: data.fechaModificacion?.toDate?.() || data.fechaModificacion,
      DiasSemana: data.DiasSemana || [],
      duracion: data.duracion
    };
  }

  private mapToFirestore(rutina: Rutina): any {
    const data: any = {
      nombre: rutina.nombre,
      activa: rutina.activa ?? true,
      DiasSemana: rutina.DiasSemana || []
    };

    // Solo incluir campos opcionales si tienen valor válido
    if (rutina.descripcion) {
      data.descripcion = rutina.descripcion;
    }
    
    if (rutina.ejerciciosIds && rutina.ejerciciosIds.length > 0) {
      data.ejerciciosIds = rutina.ejerciciosIds; // Cambiado a ejerciciosIds
    }
    
    if (rutina.fechaCreacion) {
      data.fechaCreacion = rutina.fechaCreacion instanceof Date 
        ? Timestamp.fromDate(rutina.fechaCreacion)
        : rutina.fechaCreacion;
    }
    
    if (rutina.fechaModificacion) {
      data.fechaModificacion = rutina.fechaModificacion instanceof Date 
        ? Timestamp.fromDate(rutina.fechaModificacion)
        : rutina.fechaModificacion;
    }
    
    if (rutina.duracion && rutina.duracion > 0) {
      data.duracion = rutina.duracion;
    }

    return data;
  }
}