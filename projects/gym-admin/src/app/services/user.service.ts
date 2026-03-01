import { Injectable, signal, WritableSignal, Signal, computed, inject, Injector, runInInjectionContext } from '@angular/core';
import { User } from 'gym-library';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  onSnapshot,
  setDoc,
  QuerySnapshot
} from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { ZoneRunnerService } from './zone-runner.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(Auth);
  private readonly injector = inject(Injector);
  private readonly zoneRunner = inject(ZoneRunnerService, { optional: true });

  private readonly COLLECTION_NAME = 'usuarios';

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
      const usersCol = collection(this.firestore, this.COLLECTION_NAME);

      onSnapshot(usersCol, (snapshot: QuerySnapshot) => {
        this.runInZone(() => {
          const usersList = snapshot.docs.map(doc => ({
            ...doc.data(),
            uid: doc.id
          } as User));
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
        const usersCol = collection(this.firestore, this.COLLECTION_NAME);
        const snapshot = await getDocs(usersCol);

        const usersList = snapshot.docs.map(doc => ({
          ...doc.data(),
          uid: doc.id
        } as User));

        this._users.set(usersList);
        return usersList;
      }) as User[];
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
   * @param user - Datos del usuario
   * @param password - Contraseña opcional para crear cuenta de Firebase Auth
   */
  async addUser(user: Omit<User, 'uid'>, password?: string): Promise<string> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      return await this.runInZone(async () => {
        if (user.email && password) {
          // Crear usuario con Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(
            this.auth,
            user.email,
            password
          );

          const firebaseUser = userCredential.user;
          if (firebaseUser) {
            if (user.nombre) {
              await updateProfile(firebaseUser, { displayName: user.nombre });
            }

            const newUser: User = {
              ...user,
              uid: firebaseUser.uid,
              email: firebaseUser.email || user.email,
              emailVerified: firebaseUser.emailVerified
            };

            const userDocRef = doc(this.firestore, this.COLLECTION_NAME, firebaseUser.uid);
            await setDoc(userDocRef, newUser);
            return firebaseUser.uid;
          } else {
            throw new Error('No se pudo obtener información del usuario creado');
          }
        } else {
          // Crear usuario solo en Firestore
          const usersCol = collection(this.firestore, this.COLLECTION_NAME);
          const docRef = await addDoc(usersCol, user);
          return docRef.id;
        }
      }) as string;
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
        const userDoc = doc(this.firestore, this.COLLECTION_NAME, uid);
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
        const userDoc = doc(this.firestore, this.COLLECTION_NAME, uid);
        await deleteDoc(userDoc);
      });
      console.log('🔄 UserService: Usuario eliminado:', uid);
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
      return allUsers.find(user => user.email === email) || null;
    });
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
}
