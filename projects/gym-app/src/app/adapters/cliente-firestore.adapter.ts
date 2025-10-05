import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  setDoc,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentSnapshot
} from '@angular/fire/firestore';
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

  initializeListener(onUpdate: (clientes: Cliente[]) => void): void {
    const clientesCol = collection(this.firestore, this.COLLECTION);
    
    onSnapshot(clientesCol, (snapshot: QuerySnapshot) => {
      const list = snapshot.docs.map((d) => this.mapFromFirestore({ ...d.data(), id: d.id }));
      onUpdate(list);
    });
  }

  subscribeToCliente(id: string, onUpdate: (cliente: Cliente | null) => void): void {
    const clienteRef = doc(this.firestore, this.COLLECTION, id);
    onSnapshot(clienteRef, (doc: DocumentSnapshot) => {
      if (doc.exists()) {
        onUpdate(this.mapFromFirestore({ ...doc.data(), id: doc.id }));
      } else {
        onUpdate(null);
      }
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