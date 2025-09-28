import { Injectable, signal, WritableSignal, Signal, inject, computed } from '@angular/core';
import { User } from '../models/user.model';
import { StorageService } from './storage.service';
import { Firestore } from '@angular/fire/firestore';
import { collection, getDocs, addDoc, doc, deleteDoc, DocumentData } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class UserService {
  // 🏗️ Angular 20: usar inject() function en lugar de constructor injection
  private readonly storageService = inject(StorageService);
  private readonly firestore = inject(Firestore);
  
  // 🔄 Signals privadas
  private readonly _user = signal<User | null>(null);
  private readonly _users: WritableSignal<User[]> = signal<User[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  // 📋 Constantes
  private readonly USER_KEY = 'current_user';
  private readonly USERS_KEY = 'users';
  private readonly COLLECTION_NAME = 'usuarios';

  constructor() {
    // 🚀 Inicialización no-bloqueante
    this.restoreUser();
    this.getUsers().catch(err => 
      console.warn('🔄 UserService: Error inicial al cargar usuarios:', err)
    );
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
    if (user) {
      await this.storageService.set(this.USER_KEY, user);
    } else {
      await this.storageService.remove(this.USER_KEY);
    }
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
    await this.storageService.remove(this.USER_KEY);
  }

  async restoreUser(): Promise<void> {
    const user = await this.storageService.get(this.USER_KEY);
    if (user) {
      this._user.set(user);
    }
  }

  // ==============================================================================================
  // Administracion de usuarios de firebase
  // ==============================================================================================

  /** 
   * Obtiene la lista de usuarios con cache inteligente
   * - Si ya hay datos en la signal, los devuelve inmediatamente
   * - Si no hay datos o se fuerza recarga, consulta Firestore con fallback a storage
   * @param forceReload Fuerza recarga desde Firestore ignorando cache
   * @returns Promise<User[]> lista de usuarios
   */
  async getUsers(forceReload = false): Promise<User[]> {
    const current = this._users();
    if (current.length > 0 && !forceReload) {
      return current;
    }
    this._isLoading.set(true);
    this._error.set(null);
    
    try {
      const colRef = collection(this.firestore, this.COLLECTION_NAME);
      const snapshot = await getDocs(colRef);
      
      const users: User[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data() as DocumentData;
        return this.mapFirestoreToUser(data, docSnap.id);
      });
      
      this._users.set(users);
      await this.storageService.set(this.USERS_KEY, users);
      return users;
    } catch (error) {
      console.warn('🔄 Firestore fallback to local storage:', error);
      const localUsers = await this.storageService.get(this.USERS_KEY) || [];
      this._users.set(localUsers);
      this._error.set('Modo offline: datos desde cache local');
      return localUsers;
    } finally {
      this._isLoading.set(false);
    }
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
   * Agrega un nuevo usuario con optimistic update
   * @param user El usuario a agregar
   */
  async addUser(user: User): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    const optimisticUser = { ...user, uid: user.uid || `temp_${Date.now()}` };
    const updated = [...this._users(), optimisticUser];
    this._users.set(updated);
    await this.storageService.set(this.USERS_KEY, updated);

    try {
      const { uid: _tempId, ...userDataWithoutId } = optimisticUser;
      const docRef = await addDoc(collection(this.firestore, this.COLLECTION_NAME), userDataWithoutId);
      const userWithRealId: User = { ...userDataWithoutId, uid: docRef.id };
      const finalList = updated.map(u => u.uid === optimisticUser.uid ? userWithRealId : u)
      this._users.set(finalList);
      await this.storageService.set(this.USERS_KEY, finalList);
    } catch (error) {
      console.warn('🔄 Error al guardar en Firestore, manteniendo copia local:', error);
      this._error.set('Usuario guardado localmente. Se sincronizará cuando haya conexión.');
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * ➖ Elimina un usuario con optimistic update
   * @param uid El ID del usuario a eliminar
   */
  async removeUser(uid: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);
    const updated = this._users().filter(u => u.uid !== uid);
    this._users.set(updated);
    await this.storageService.set(this.USERS_KEY, updated);
    try {
      const docRef = doc(this.firestore, this.COLLECTION_NAME, uid);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('🔄 Error al eliminar de Firestore, manteniendo eliminación local:', error);
      this._error.set('Usuario eliminado localmente. Se sincronizará cuando haya conexión.');
    } finally {
      this._isLoading.set(false);
    }
  }

}
