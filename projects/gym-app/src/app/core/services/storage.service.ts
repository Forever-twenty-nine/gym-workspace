import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    // Si se necesitan drivers personalizados, definirlos aquí
    // await this.storage.defineDriver(/*...*/);
    const storage = await this.storage.create();
    this._storage = storage;
  }

  // Crear y exponer métodos que los usuarios de este servicio puedan llamar
  public async set(key: string, value: any): Promise<any> {
    await this.ensureStorageReady();
    return this._storage?.set(key, value);
  }

  public async get(key: string): Promise<any> {
    await this.ensureStorageReady();
    return this._storage?.get(key);
  }

  public async remove(key: string): Promise<any> {
    await this.ensureStorageReady();
    return this._storage?.remove(key);
  }

  public async clear(): Promise<void> {
    await this.ensureStorageReady();
    return this._storage?.clear();
  }

  public async keys(): Promise<string[]> {
    await this.ensureStorageReady();
    return this._storage?.keys() || [];
  }

  public async length(): Promise<number> {
    await this.ensureStorageReady();
    return this._storage?.length() || 0;
  }

  public async forEach(iteratorCallback: (value: any, key: string, iterationNumber: Number) => any): Promise<void> {
    await this.ensureStorageReady();
    return this._storage?.forEach(iteratorCallback);
  }

  // Método privado para asegurar que el storage esté listo
  private async ensureStorageReady(): Promise<void> {
    if (!this._storage) {
      await this.init();
    }
  }
}
