import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { User } from '../models/user.model';
import { Rol } from '../enums/rol.enum';

export interface IUserFirestoreAdapter {
  initializeListener(onUpdate: (users: User[]) => void, onError: (error: string) => void): void;
  getUsers(): Promise<User[]>;
  addUser(user: Omit<User, 'uid'>, password?: string): Promise<string>;
  updateUser(uid: string, userData: Partial<User>): Promise<void>;
  deleteUser(uid: string): Promise<void>;
  unsubscribe?(): void; // Método opcional para desuscribir el listener
}

// Tipos de error más específicos
export type UserServiceError =
  | 'ADAPTER_NOT_CONFIGURED'
  | 'USER_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

@Injectable({ providedIn: 'root' })
export class UserService {
  // Signals privados
  private readonly _user = signal<User | null>(null);
  private readonly _users = signal<User[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<UserServiceError | null>(null);
  private readonly _isListenerInitialized = signal<boolean>(false); // ✅ Ahora es signal
  
  private isFetching = false;
  private firestoreAdapter: IUserFirestoreAdapter | null = null;
  
  // Signals computadas públicas
  readonly userCount = computed(() => this._users().length);
  readonly isUsersLoaded = computed(() => 
    this._users().length > 0 || this._isListenerInitialized()
  );
  
  // Getters readonly
  get users(): Signal<User[]> {
    return this._users.asReadonly();
  }
  
  get user(): Signal<User | null> {
    return this._user.asReadonly();
  }
  
  get isLoading(): Signal<boolean> {
    return this._isLoading.asReadonly();
  }
  
  get error(): Signal<UserServiceError | null> {
    return this._error.asReadonly();
  }
  
  get isAdapterConfigured(): boolean {
    return !!this.firestoreAdapter;
  }
  
  // Validaciones
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  private validateRole(role: string): boolean {
    return Object.values(Rol).includes(role as Rol);
  }
  
  private validateUserData(userData: Partial<User>): { 
    error: UserServiceError | null; 
    message?: string 
  } {
    if (userData.email && !this.validateEmail(userData.email)) {
      return { error: 'VALIDATION_ERROR', message: 'Email inválido' };
    }
    if (userData.role && !this.validateRole(userData.role)) {
      return { error: 'VALIDATION_ERROR', message: 'Rol inválido' };
    }
    if (userData.nombre !== undefined && (!userData.nombre || userData.nombre.trim() === '')) {
      return { error: 'VALIDATION_ERROR', message: 'El nombre es requerido' };
    }
    return { error: null };
  }
  
  setFirestoreAdapter(adapter: IUserFirestoreAdapter): void {
    if (this.firestoreAdapter && this._isListenerInitialized()) {
      this.firestoreAdapter.unsubscribe?.();
      this._isListenerInitialized.set(false);
    }
    this.firestoreAdapter = adapter;
    // No inicializar automáticamente, usar initializeUsersListener() explícitamente
  }
  
  private initializeListener(): void {
    if (this._isListenerInitialized() || !this.firestoreAdapter) return;
    
    try {
      this.firestoreAdapter.initializeListener(
        (users: User[]) => {
          if (!this.isFetching) {
            this._users.set(users); // ✅ Sin ZoneRunner si usas signals
          }
        },
        (error: string) => {
          console.error('Error en listener:', error);
          this._error.set('NETWORK_ERROR');
        }
      );
      this._isListenerInitialized.set(true);
    } catch (e) {
      console.warn('Error inicializando listener:', e);
    }
  }
  
  initializeUsersListener(): void {
    if (!this._isListenerInitialized() && this.firestoreAdapter) {
      this.initializeListener();
    }
  }
  
  setCurrentUser(user: User | null): void {
    this._user.set(user);
  }
  
  async getUsers(): Promise<User[]> {
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    
    this._isLoading.set(true);
    this._error.set(null);
    this.isFetching = true;
    
    try {
      const usersList = await this.firestoreAdapter.getUsers();
      this._users.set(usersList);
      return usersList;
    } catch (error: any) {
      console.error('Error al obtener usuarios:', error);
      this._error.set('NETWORK_ERROR');
      return [];
    } finally {
      this.isFetching = false;
      this._isLoading.set(false);
    }
  }
  
  async addUser(user: Omit<User, 'uid'>, password?: string): Promise<string> {
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    
    const validation = this.validateUserData(user);
    if (validation.error) {
      throw new Error(validation.message || 'Error de validación');
    }
    
    this._isLoading.set(true);
    this._error.set(null);
    
    try {
      const docId = await this.firestoreAdapter.addUser(user, password);
      // ✅ Confiar en el listener - él actualizará _users
      return docId;
    } catch (error: any) {
      console.error('Error al agregar usuario:', error);
      this._error.set('NETWORK_ERROR');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  async updateUser(uid: string, userData: Partial<User>): Promise<void> {
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    
    const validation = this.validateUserData(userData);
    if (validation.error) {
      throw new Error(validation.message || 'Error de validación');
    }
    
    this._isLoading.set(true);
    this._error.set(null);
    
    const currentUsers = this._users();
    const userIndex = currentUsers.findIndex(u => u.uid === uid);
    
    if (userIndex === -1) {
      this._error.set('USER_NOT_FOUND');
      throw new Error('Usuario no encontrado');
    }
    
    const originalUser = currentUsers[userIndex];
    const updatedUser = { ...originalUser, ...userData };
    
    // Actualización optimista
    this._users.update(users => users.map(u => u.uid === uid ? updatedUser : u));
    
    try {
      await this.firestoreAdapter.updateUser(uid, userData);
    } catch (error: any) {
      // Rollback
      this._users.update(users => users.map(u => u.uid === uid ? originalUser : u));
      console.error('Error al actualizar usuario:', error);
      this._error.set('NETWORK_ERROR');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  async deleteUser(uid: string): Promise<void> {
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    
    this._isLoading.set(true);
    this._error.set(null);
    
    const currentUsers = this._users();
    const userToDelete = currentUsers.find(u => u.uid === uid);
    
    if (!userToDelete) {
      this._error.set('USER_NOT_FOUND');
      throw new Error('Usuario no encontrado');
    }
    
    // Eliminación optimista
    this._users.update(users => users.filter(u => u.uid !== uid));
    
    try {
      await this.firestoreAdapter.deleteUser(uid);
    } catch (error: any) {
      // Rollback
      this._users.update(users => [...users, userToDelete]);
      console.error('Error al eliminar usuario:', error);
      this._error.set('NETWORK_ERROR');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }
  
  getUserByEmail(email: string): User | null {
    return this._users().find(user => user.email === email) || null;
  }
  
  getUserByUid(uid: string): User | null {
    return this._users().find(user => user.uid === uid) || null;
  }
  
  getUsersByRole(role: string): User[] {
    return this._users().filter(user => user.role === role);
  }
  
  clearError(): void {
    this._error.set(null);
  }
  
  destroy(): void {
    if (this.firestoreAdapter && this._isListenerInitialized()) {
      this.firestoreAdapter.unsubscribe?.();
    }
    this._isListenerInitialized.set(false);
    this.isFetching = false;
    this._users.set([]);
    this._user.set(null);
    this._isLoading.set(false);
    this._error.set(null);
  }
}