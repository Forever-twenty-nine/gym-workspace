import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  deleteDoc,
  setDoc,
  onSnapshot,
  QuerySnapshot,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { User } from 'gym-library';
import { ZoneRunnerService } from './zone-runner.service';
import { FIRESTORE } from '../firebase.tokens';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly firestore = inject(FIRESTORE);

  private readonly injector = inject(Injector);
  private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });
  private readonly COLLECTION = 'usuarios';

  // 🔄 Signals privadas
  private readonly _user = signal<User | null>(null);
  private readonly _users: WritableSignal<User[]> = signal<User[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  private isListenerInitialized = false;

  constructor() { }

  /**
   * Ejecuta el callback en el contexto correcto (zona o inyección)
   */
  private runInZone<T>(callback: () => T | Promise<T>): T | Promise<T> {
    if (this.zoneRunner) {
      return this.zoneRunner.run(callback);
    }
    return runInInjectionContext(this.injector, callback as any);
  }

  /**
   * Inicializa el listener de Firestore para usuarios
   */
  private initializeListener(): void {
    if (this.isListenerInitialized) return;

    try {
      const usersCol = collection(this.firestore, this.COLLECTION);
      onSnapshot(usersCol, (snapshot: QuerySnapshot) => {
        this.runInZone(() => {
          const usersList = snapshot.docs.map(docSnap => this.mapFromFirestore({
            ...docSnap.data(),
            uid: docSnap.id
          }));
          this._users.set(usersList);
        });
      }, (error) => {
        this.runInZone(() => {
          console.error('🔄 UserService: Error en listener:', error);
          this._error.set(error.message);
        });
      });

      this.isListenerInitialized = true;
    } catch (e) {
      console.warn('Error inicializando listener de usuarios:', e);
    }
  }

  /** Signal readonly para la lista de usuarios */
  get users(): Signal<User[]> {
    if (!this.isListenerInitialized) {
      this.initializeListener();
    }
    return this._users.asReadonly();
  }

  /** Signal readonly para el usuario actual */
  get user(): Signal<User | null> {
    return this._user.asReadonly();
  }

  /** Signal readonly para estado de carga */
  get isLoading(): Signal<boolean> {
    return this._isLoading.asReadonly();
  }

  /** Signal readonly para errores */
  get error(): Signal<string | null> {
    return this._error.asReadonly();
  }

  /** Signal computada para cantidad de usuarios */
  get userCount(): Signal<number> {
    return computed(() => this.users().length);
  }

  /**
   * Establece el usuario actual
   */
  setCurrentUser(user: User | null): void {
    this._user.set(user);
  }

  /**
   * Obtiene todos los usuarios desde Firestore
   */
  async getUsers(): Promise<User[]> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      return await this.runInZone(async () => {
        const usersCol = collection(this.firestore, this.COLLECTION);
        const snapshot = await getDocs(usersCol);
        const usersList = snapshot.docs.map(docSnap => this.mapFromFirestore({
          ...docSnap.data(),
          uid: docSnap.id
        }));
        this._users.set(usersList);
        return usersList;
      });
    } catch (error: any) {
      console.error('🔄 UserService: Error al obtener usuarios:', error);
      this._error.set(error.message);
      return [];
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Agrega un nuevo usuario
   */
  async addUser(user: Omit<User, 'uid'>): Promise<string> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      return await this.runInZone(async () => {
        const usersCol = collection(this.firestore, this.COLLECTION);
        const docRef = await addDoc(usersCol, this.mapToFirestore(user as User));
        return docRef.id;
      });
    } catch (error: any) {
      console.error('🔄 UserService: Error al agregar usuario:', error);
      this._error.set(error.message);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Actualiza un usuario existente
   */
  async updateUser(uid: string, userData: Partial<User>): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.runInZone(async () => {
        const userDoc = doc(this.firestore, this.COLLECTION, uid);
        await setDoc(userDoc, userData, { merge: true });
      });
    } catch (error: any) {
      console.error('🔄 UserService: Error al actualizar usuario:', error);
      this._error.set(error.message);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Elimina un usuario
   */
  async deleteUser(uid: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await this.runInZone(async () => {
        const userDoc = doc(this.firestore, this.COLLECTION, uid);
        await deleteDoc(userDoc);
      });
    } catch (error: any) {
      console.error('🔄 UserService: Error al eliminar usuario:', error);
      this._error.set(error.message);
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Busca un usuario por email
   */
  getUserByEmail(email: string): Signal<User | null> {
    return computed(() => {
      const allUsers = this.users();
      return allUsers.find(user => user.email?.toLowerCase() === email.toLowerCase()) || null;
    });
  }

  /**
   * Busca un usuario por email de forma asíncrona usando una consulta a Firestore
   */
  async getUserByEmailAsync(email: string): Promise<User | null> {
    try {
      return await this.runInZone(async () => {
        const usersCol = collection(this.firestore, this.COLLECTION);
        // Intentamos búsqueda exacta
        const q = query(usersCol, where('email', '==', email));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          return this.mapFromFirestore({
            ...docSnap.data(),
            uid: docSnap.id
          });
        }

        // Si no se encuentra, intentamos con minúsculas (por si acaso)
        const qLower = query(usersCol, where('email', '==', email.toLowerCase()));
        const snapshotLower = await getDocs(qLower);

        if (!snapshotLower.empty) {
          const docSnap = snapshotLower.docs[0];
          return this.mapFromFirestore({
            ...docSnap.data(),
            uid: docSnap.id
          });
        }

        return null;
      });
    } catch (error) {
      console.error('🔄 UserService: Error al buscar usuario por email:', error);
      return null;
    }
  }

  /**
   * Busca un usuario por UID
   */
  getUserByUid(uid: string): Signal<User | null> {
    return computed(() => {
      const allUsers = this.users();
      return allUsers.find(user => user.uid === uid) || null;
    });
  }

  /**
   * Filtra usuarios por rol
   */
  getUsersByRole(role: string): Signal<User[]> {
    return computed(() => {
      const allUsers = this.users();
      return allUsers.filter(user => user.role === role);
    });
  }

  /**
   * Limpia el estado de error
   */
  clearError(): void {
    this._error.set(null);
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
      nombre: user.nombre || null,
      email: user.email || null,
      emailVerified: user.emailVerified ?? false,
      role: user.role || null,
      entrenadorId: user.entrenadorId || null,
      gimnasioId: user.gimnasioId || null,
      entrenadoId: user.entrenadoId || null,
      onboarded: user.onboarded ?? false,
      plan: user.plan || null
    };
    return data;
  }
}
