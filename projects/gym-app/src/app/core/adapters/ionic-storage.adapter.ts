import { IStorageAdapter } from '../../services/storage.service';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';



@Injectable({
  providedIn: 'root'
})
export class IonicStorageAdapter implements IStorageAdapter {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {}

  async init(): Promise<void> {
    // Si se necesitan drivers personalizados, definirlos aquí
    // await this.storage.defineDriver(/*...*/);
    const storage = await this.storage.create();
    this._storage = storage;
  }

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

  private async ensureStorageReady(): Promise<void> {
    if (!this._storage) {
      await this.init();
    }
  }
}