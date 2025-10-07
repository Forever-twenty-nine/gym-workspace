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
import { Cliente } from 'gym-library';

interface IClienteFirestoreAdapter {
  initializeListener(onUpdate: (clientes: Cliente[]) => void): void;
  subscribeToCliente(id: string, onUpdate: (cliente: Cliente | null) => void): void;
  save(cliente: Cliente): Promise<void>;
  delete(id: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class ClienteFirestoreAdapter implements IClienteFirestoreAdapter {
  private readonly COLLECTION = 'clientes';
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  initializeListener(onUpdate: (clientes: Cliente[]) => void): void {
    // Ejecutar dentro del contexto de inyección
    runInInjectionContext(this.injector, () => {
      const clientesSignal = toSignal(
        collectionData(collection(this.firestore, this.COLLECTION), { idField: 'id' })
      );
      
      effect(() => {
        const data = clientesSignal();
        if (data) {
          const list = data.map((d: any) => this.mapFromFirestore(d));
          onUpdate(list);
        }
      });
    });
  }

  subscribeToCliente(id: string, onUpdate: (cliente: Cliente | null) => void): void {
    // Ejecutar la suscripción dentro del contexto de inyección
    runInInjectionContext(this.injector, () => {
      const clienteRef = doc(this.firestore, this.COLLECTION, id);
      
      docData(clienteRef, { idField: 'id' }).subscribe({
        next: (data) => {
          if (data) {
            onUpdate(this.mapFromFirestore(data));
          } else {
            onUpdate(null);
          }
        },
        error: (error) => {
          console.error('Error subscribing to cliente:', error);
          onUpdate(null);
        }
      });
    });
  }

  async save(cliente: Cliente): Promise<void> {
    const dataToSave = this.mapToFirestore(cliente);
    
    if (cliente.id) {
      // Actualizar cliente existente
      const clienteRef = doc(this.firestore, this.COLLECTION, cliente.id);
      await setDoc(clienteRef, dataToSave, { merge: true });
    } else {
      // Crear nuevo cliente
      await addDoc(collection(this.firestore, this.COLLECTION), dataToSave);
    }
  }

  async delete(id: string): Promise<void> {
    const clienteRef = doc(this.firestore, this.COLLECTION, id);
    await deleteDoc(clienteRef);
  }

  private mapFromFirestore(data: any): Cliente {
    return {
      id: data.id,
      gimnasioId: data.gimnasioId || '',
      activo: data.activo ?? true,
      fechaRegistro: data.fechaRegistro?.toDate?.() || data.fechaRegistro || new Date(),
      objetivo: data.objetivo || null
    };
  }

  private mapToFirestore(cliente: Cliente): any {
    const data: any = {
      gimnasioId: cliente.gimnasioId,
      activo: cliente.activo,
      objetivo: cliente.objetivo
    };

    if (cliente.fechaRegistro) {
      data.fechaRegistro = cliente.fechaRegistro instanceof Date 
        ? Timestamp.fromDate(cliente.fechaRegistro)
        : cliente.fechaRegistro;
    }

    return data;
  }
}