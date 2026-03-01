import { Injectable, signal, Signal, inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly storage = inject(Storage);
  private _storage: Storage | null = null;
  private readonly _isReady = signal<boolean>(false);

  constructor() {
    this.init();
  }

  /**
   * Signal que indica si el storage está listo
   */
  get isReady(): Signal<boolean> {
    return this._isReady.asReadonly();
  }

  /**
   * Inicializa el storage
   */
  async init(): Promise<void> {
    if (this._isReady()) return;

    try {
      const storageInstance = await this.storage.create();
      this._storage = storageInstance;
      this._isReady.set(true);
    } catch (error) {
      console.error('Error inicializando storage:', error);
      throw error;
    }
  }

  /**
   * Guarda un valor en el storage
   */
  public async set(key: string, value: any): Promise<any> {
    await this.ensureStorageReady();
    return this._storage?.set(key, value);
  }

  /**
   * Obtiene un valor del storage
   */
  public async get(key: string): Promise<any> {
    await this.ensureStorageReady();
    return this._storage?.get(key);
  }

  /**
   * Elimina un valor del storage
   */
  public async remove(key: string): Promise<any> {
    await this.ensureStorageReady();
    return this._storage?.remove(key);
  }

  /**
   * Limpia todo el storage
   */
  public async clear(): Promise<void> {
    await this.ensureStorageReady();
    return this._storage?.clear();
  }

  /**
   * Obtiene todas las claves del storage
   */
  public async keys(): Promise<string[]> {
    await this.ensureStorageReady();
    return this._storage?.keys() || [];
  }

  /**
   * Obtiene la cantidad de elementos en el storage
   */
  public async length(): Promise<number> {
    await this.ensureStorageReady();
    return this._storage?.length() || 0;
  }

  /**
   * Asegura que el storage esté listo para usar
   */
  private async ensureStorageReady(): Promise<void> {
    if (!this._isReady()) {
      await this.init();
    }
  }
}
