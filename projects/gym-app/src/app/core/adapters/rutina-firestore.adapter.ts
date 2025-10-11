import { Injectable, inject, Injector, effect, runInInjectionContext } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  setDoc,
  Timestamp,
  collectionData,
  docData
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
    const dataToSave = this.mapToFirestore(rutina);
    
    if (rutina.id) {
      const rutinaRef = doc(this.firestore, this.COLLECTION, rutina.id);
      await setDoc(rutinaRef, dataToSave, { merge: true });
    } else {
      await addDoc(collection(this.firestore, this.COLLECTION), dataToSave);
    }
  }

  async delete(id: string): Promise<void> {
    const rutinaRef = doc(this.firestore, this.COLLECTION, id);
    await deleteDoc(rutinaRef);
  }

  private mapFromFirestore(data: any): Rutina {
    return {
      id: data.id,
      entrenadoId: data.entrenadoId,
      nombre: data.nombre || '',
      fechaAsignacion: data.fechaAsignacion?.toDate?.() || data.fechaAsignacion || new Date(),
      ejercicios: data.ejercicios || [],
      activa: data.activa ?? true,
      duracion: data.duracion,
      DiasSemana: data.DiasSemana || [],
      completado: data.completado ?? false,
      notas: data.notas || '',
      // Nuevos campos
      creadorId: data.creadorId,
      creadorTipo: data.creadorTipo,
      asignadoId: data.asignadoId,
      asignadoTipo: data.asignadoTipo,
      fechaCreacion: data.fechaCreacion?.toDate?.() || data.fechaCreacion,
      fechaModificacion: data.fechaModificacion?.toDate?.() || data.fechaModificacion
    };
  }

  private mapToFirestore(rutina: Rutina): any {
    const data: any = {
      nombre: rutina.nombre,
      ejercicios: rutina.ejercicios || [],
      activa: rutina.activa ?? true,
      DiasSemana: rutina.DiasSemana || [],
      completado: rutina.completado ?? false
    };

    // Solo incluir campos opcionales si tienen valor válido
    if (rutina.entrenadoId) {
      data.entrenadoId = rutina.entrenadoId;
    }
    
    if (rutina.duracion && rutina.duracion > 0) {
      data.duracion = rutina.duracion;
    }
    
    if (rutina.notas && rutina.notas.trim() !== '') {
      data.notas = rutina.notas;
    }

    if (rutina.fechaAsignacion) {
      data.fechaAsignacion = rutina.fechaAsignacion instanceof Date 
        ? Timestamp.fromDate(rutina.fechaAsignacion)
        : rutina.fechaAsignacion;
    }

    // Nuevos campos opcionales
    if (rutina.creadorId) {
      data.creadorId = rutina.creadorId;
    }
    
    if (rutina.creadorTipo) {
      data.creadorTipo = rutina.creadorTipo;
    }
    
    if (rutina.asignadoId) {
      data.asignadoId = rutina.asignadoId;
    }
    
    if (rutina.asignadoTipo) {
      data.asignadoTipo = rutina.asignadoTipo;
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

    return data;
  }
}