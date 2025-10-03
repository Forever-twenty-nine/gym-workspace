import { Injectable, signal, WritableSignal, Signal, computed } from '@angular/core';
import { User } from '../models/user.model';

export interface IUserFirestoreAdapter {
  initializeListener(onUpdate: (users: User[]) => void, onError: (error: string) => void): void;
  getUsers(): Promise<User[]>;
  addUser(user: Omit<User, 'uid'>, password?: string): Promise<string>;
  updateUser(uid: string, userData: Partial<User>): Promise<void>;
  deleteUser(uid: string): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  // 🔄 Signals privadas
  private readonly _user = signal<User | null>(null);
  private readonly _users: WritableSignal<User[]> = signal<User[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  private isListenerInitialized = false;
  private firestoreAdapter?: IUserFirestoreAdapter;

  constructor() {
    // La inicialización se hará cuando se configure el adaptador
  }

  /**
   * Configura el adaptador de Firestore
   */
  setFirestoreAdapter(adapter: IUserFirestoreAdapter): void {
    this.firestoreAdapter = adapter;
    this.initializeListener();
  }

  /**
   * Inicializa el listener de Firestore para usuarios
   */
  private initializeListener(): void {
    if (this.isListenerInitialized || !this.firestoreAdapter) return;
    
    try {
      
      
      this.firestoreAdapter.initializeListener(
        (users: User[]) => {
          this._users.set(users);
        },
        (error: string) => {
          console.error('🔄 UserService: Error en listener:', error);
          this._error.set(error);
        }
      );
      
      this.isListenerInitialized = true;
    } catch (e) {
      console.warn('Error inicializando listener de usuarios:', e);
    }
  }

  /** Signal readonly para la lista de usuarios */
  get users(): Signal<User[]> {
    if (!this.isListenerInitialized && this.firestoreAdapter) {
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
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    
    this._isLoading.set(true);
    this._error.set(null);
    
    try {
      const usersList = await this.firestoreAdapter.getUsers();
      this._users.set(usersList);
      return usersList;
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
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    
    this._isLoading.set(true);
    this._error.set(null);
    
    try {
      const docId = await this.firestoreAdapter.addUser(user, password);
      console.log('🔄 UserService: Usuario agregado con ID:', docId);
      return docId;
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
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    
    this._isLoading.set(true);
    this._error.set(null);
    
    try {
      await this.firestoreAdapter.updateUser(uid, userData);
      console.log('🔄 UserService: Usuario actualizado:', uid);
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
    if (!this.firestoreAdapter) {
      throw new Error('Firestore adapter no configurado');
    }
    
    this._isLoading.set(true);
    this._error.set(null);
    
    try {
      await this.firestoreAdapter.deleteUser(uid);
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