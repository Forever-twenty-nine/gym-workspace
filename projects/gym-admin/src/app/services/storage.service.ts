import { Injectable, signal, WritableSignal, Signal } from '@angular/core';

export interface IStorageAdapter {
  init(): Promise<void>;
  set(key: string, value: any): Promise<any>;
  get(key: string): Promise<any>;
  remove(key: string): Promise<any>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  length(): Promise<number>;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storageAdapter?: IStorageAdapter;
  private readonly _isReady = signal<boolean>(false);

  constructor() {
    // La inicialización se hará cuando se configure el adaptador
  }

  /**
   * Configura el adaptador de Storage
   */
  setStorageAdapter(adapter: IStorageAdapter): void {
    this.storageAdapter = adapter;
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
    if (!this.storageAdapter) {
      throw new Error('Storage adapter no configurado');
    }

    try {
      await this.storageAdapter.init();
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
    return this.storageAdapter!.set(key, value);
  }

  /**
   * Obtiene un valor del storage
   */
  public async get(key: string): Promise<any> {
    await this.ensureStorageReady();
    return this.storageAdapter!.get(key);
  }

  /**
   * Elimina un valor del storage
   */
  public async remove(key: string): Promise<any> {
    await this.ensureStorageReady();
    return this.storageAdapter!.remove(key);
  }

  /**
   * Limpia todo el storage
   */
  public async clear(): Promise<void> {
    await this.ensureStorageReady();
    return this.storageAdapter!.clear();
  }

  /**
   * Obtiene todas las claves del storage
   */
  public async keys(): Promise<string[]> {
    await this.ensureStorageReady();
    return this.storageAdapter!.keys();
  }

  /**
   * Obtiene la cantidad de elementos en el storage
   */
  public async length(): Promise<number> {
    await this.ensureStorageReady();
    return this.storageAdapter!.length();
  }

  /**
   * Asegura que el storage esté listo para usar
   */
  private async ensureStorageReady(): Promise<void> {
    if (!this.storageAdapter) {
      throw new Error('Storage adapter no configurado');
    }

    if (!this._isReady()) {
      await this.init();
    }
  }
}