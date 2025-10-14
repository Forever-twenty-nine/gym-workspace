import { Injectable, inject, Injector, effect, runInInjectionContext } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  setDoc,
  onSnapshot,
  QuerySnapshot
} from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { User } from 'gym-library';

interface IUserFirestoreAdapter {
  initializeListener(onUpdate: (users: User[]) => void, onError: (error: string) => void): void;
  getUsers(): Promise<User[]>;
  addUser(user: Omit<User, 'uid'>, password?: string): Promise<string>;
  updateUser(uid: string, userData: Partial<User>): Promise<void>;
  deleteUser(uid: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class UserFirestoreAdapter implements IUserFirestoreAdapter {
  private readonly COLLECTION = 'usuarios';
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  initializeListener(onUpdate: (users: User[]) => void, onError: (error: string) => void): void {
    runInInjectionContext(this.injector, () => {
      const usersCol = collection(this.firestore, this.COLLECTION);
      
      onSnapshot(usersCol, (snapshot: QuerySnapshot) => {
        const usersList = snapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id
        } as User));
        
        onUpdate(usersList);
      }, (error) => {
        onError(error.message);
      });
    });
  }

  async getUsers(): Promise<User[]> {
    // Implementar si es necesario
    return [];
  }

  async addUser(user: Omit<User, 'uid'>, password?: string): Promise<string> {
    // Implementar si es necesario
    return '';
  }

  async updateUser(uid: string, userData: Partial<User>): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const userDoc = doc(this.firestore, this.COLLECTION, uid);
      await setDoc(userDoc, userData, { merge: true });
    });
  }

  async deleteUser(uid: string): Promise<void> {
    // Implementar si es necesario
  }

  private mapFromFirestore(data: any): User {
    return {
      uid: data.uid,
      nombre: data.nombre || null,
      email: data.email || null,
      emailVerified: data.emailVerified ?? false,
      role: data.role || null,
      entrenadorId: data.entrenadorId || null,
      gimnasioId: data.gimnasioId || null,
      entrenadoId: data.entrenadoId || null,
      onboarded: data.onboarded ?? false,
      plan: data.plan || null
    };
  }

  private mapToFirestore(user: User): any {
    const data: any = {
      nombre: user.nombre,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      entrenadorId: user.entrenadorId,
      gimnasioId: user.gimnasioId,
      entrenadoId: user.entrenadoId,
      onboarded: user.onboarded,
      plan: user.plan
    };
    return data;
  }
}