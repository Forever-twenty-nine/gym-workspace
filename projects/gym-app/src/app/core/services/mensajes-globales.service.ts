import { Injectable, inject, signal, Signal, WritableSignal, computed } from '@angular/core';
import { Firestore, collection, onSnapshot, query, where, orderBy, QuerySnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { MensajeGlobal } from 'gym-library';
import { FIRESTORE } from '../firebase.tokens';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MensajesGlobalesService {
  private readonly firestore = inject(FIRESTORE) as Firestore;
  private readonly authService = inject(AuthService);
  private readonly COLLECTION = 'mensajes_globales';

  private _mensajesActivos: WritableSignal<MensajeGlobal[]> = signal([]);
  private isListenerInitialized = false;

  constructor() {
    this.initListener();
  }

  get mensajesActivos(): Signal<MensajeGlobal[]> {
    return this._mensajesActivos.asReadonly();
  }

  get mensajesNoLeidos(): Signal<MensajeGlobal[]> {
    return computed(() => {
      const user = this.authService.currentUser();
      if (!user) return [];
      const leidos = user.mensajesGlobalesLeidos || [];
      return this._mensajesActivos().filter(m => !leidos.includes(m.id!));
    });
  }

  get mensajesLeidos(): Signal<MensajeGlobal[]> {
    return computed(() => {
      const user = this.authService.currentUser();
      if (!user) return [];
      const leidos = user.mensajesGlobalesLeidos || [];
      return this._mensajesActivos().filter(m => leidos.includes(m.id!));
    });
  }

  private initListener() {
    if (this.isListenerInitialized) return;
    const colRef = collection(this.firestore, this.COLLECTION);
    
    // Escucha de cambios en la colección de mensajes globales
    onSnapshot(colRef, (snapshot: QuerySnapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Manejamos el booleano que a veces puede venir como string del formulario de admin
        const isActive = data['activo'] === true || 
                        data['activo'] === undefined || 
                        data['activo'] === 'true' ||
                        data['activo'] === null;

        return {
          id: doc.id,
          titulo: data['titulo'] || 'Sin título',
          mensaje: data['mensaje'] || '',
          fechaCreacion: data['fechaCreacion']?.toDate ? data['fechaCreacion'].toDate() : new Date(),
          activo: isActive
        } as MensajeGlobal;
      });

      // Filtramos solo los que realmente son activos ordenados por fecha
      const activos = msgs
        .filter(m => m.activo)
        .sort((a,b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());
      
      this._mensajesActivos.set(activos);
    }, (error) => {
      console.error('❌ Error en el listener de Mensajes Globales:', error);
    });
    this.isListenerInitialized = true;
  }

  async marcarComoLeido(mensajeId: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user || !user.uid) return;

    // Use arrayUnion to add without duplicates
    const userRef = doc(this.firestore, 'usuarios', user.uid);
    await updateDoc(userRef, {
      mensajesGlobalesLeidos: arrayUnion(mensajeId)
    });
  }
}
