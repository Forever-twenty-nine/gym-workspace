import { Injectable, signal, WritableSignal, Signal, inject, computed } from '@angular/core';
import { User } from '../models/user.model';
import { Firestore } from '@angular/fire/firestore';
import { collection, getDocs, addDoc, doc, deleteDoc, DocumentData, onSnapshot } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class UserService {
  // 🏗️ Angular 20: usar inject() function en lugar de constructor injection
  private readonly firestore = inject(Firestore);
  
  // 🔄 Signals privadas
  private readonly _user = signal<User | null>(null);
  private readonly _users: WritableSignal<User[]> = signal<User[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  // 📋 Constantes
  private readonly COLLECTION_NAME = 'usuarios';
  private isListenerInitialized = false;

  constructor() {
    // 🚀 Inicialización no-bloqueante
    this.initializeListener();
  }

  /**
   * Inicializa el listener de Firestore para usuarios
   */
  private initializeListener(): void {
    if (this.isListenerInitialized) return;
    
    try {
      const usersCol = collection(this.firestore, this.COLLECTION_NAME);
      
      onSnapshot(usersCol, (snapshot) => {
        const users = snapshot.docs.map(docSnap => {
          const data = docSnap.data() as DocumentData;
          return this.mapFirestoreToUser(data, docSnap.id);
        });
        this._users.set(users);
      });
      
      this.isListenerInitialized = true;
    } catch (error) {
      console.error('🔄 UserService: Error inicializando listener:', error);
    }
  }

  /** Signal readonly para la lista de usuarios
   * @param {Signal<User[]>}
   */
  get users(): Signal<User[]> {
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

  /** 🔢 Computed signal: cantidad de usuarios */
  readonly usersCount = computed(() => this._users().length);

  /** 🔢 Computed signal: usuarios activos (que tienen roles asignados) */
  readonly activeUsers = computed(() => 
    this._users().filter(u => u.role && u.role.length > 0)
  );

  // 🔧 Métodos principales
  async setUser(user: User | null): Promise<void> {
    this._user.set(user);
  }

  getMainRole(user?: User | null): string | null {
    const u = user ?? this.getCurrentUser();
    return u?.role ?? null;
  }

  getCurrentUser(): User | null {
    return this._user();
  }

  getUserRole(): string | null {
    return this._user()?.role ?? null;
  }

  getUserEmail(): string | null {
    return this._user()?.email ?? null;
  }

  getUserId(): string | null {
    return this._user()?.uid ?? null;
  }

  async clearUser(): Promise<void> {
    this._user.set(null);
  }



  // ==============================================================================================
  // Administracion de usuarios de firebase
  // ==============================================================================================

  /** 
   * Obtiene la lista de usuarios desde la señal (ya se actualiza en tiempo real)
   * @param forceReload Parámetro mantenido por compatibilidad (ignorado)
   * @returns Promise<User[]> lista de usuarios
   */
  async getUsers(forceReload = false): Promise<User[]> {
    return this._users();
  }

  /** 
   * Recarga forzada de usuarios desde Firestore
   * @returns Promise<User[]> lista actualizada de usuarios
   */
  async refreshUsers(): Promise<User[]> {
    return this.getUsers(true);
  }

  /** 
   * Mapea documento de Firestore a User
   * @param data Los datos del documento de Firestore
   * @param id El ID del usuario
   * @returns El usuario mapeado
   */
  private mapFirestoreToUser(data: DocumentData, id: string): User {
    return {
      uid: id,
      nombre: data['nombre'] || '',
      email: data['email'] || '',
      emailVerified: data['emailVerified'] ?? false,
      role: data['role'] || '',
      roles: data['roles'] || [],
      entrenadorId: data['entrenadorId'],
      gimnasioId: data['gimnasioId'],
      onboarded: data['onboarded'] ?? false,
    } as User;
  }

  /**
   * Agrega un nuevo usuario
   * @param user El usuario a agregar
   */
  async addUser(user: User): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const { uid: _tempId, ...userDataWithoutId } = user;
      await addDoc(collection(this.firestore, this.COLLECTION_NAME), userDataWithoutId);
      // El listener onSnapshot se encargará de actualizar la señal automáticamente
    } catch (error) {
      console.error('🔄 Error al guardar usuario en Firestore:', error);
      this._error.set('Error al guardar el usuario en Firebase');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * ➖ Elimina un usuario
   * @param uid El ID del usuario a eliminar
   */
  async removeUser(uid: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    
    try {
      const docRef = doc(this.firestore, this.COLLECTION_NAME, uid);
      await deleteDoc(docRef);
      // El listener onSnapshot se encargará de actualizar la señal automáticamente
    } catch (error) {
      console.error('🔄 Error al eliminar usuario de Firestore:', error);
      this._error.set('Error al eliminar el usuario de Firebase');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

}
