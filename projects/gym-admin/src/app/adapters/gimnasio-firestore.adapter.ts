import { Injectable } from '@angular/core';
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    orderBy,
    Firestore
} from '@angular/fire/firestore';
import { inject } from '@angular/core';
import { Gimnasio, IGimnasioFirestoreAdapter } from 'gym-library';

@Injectable({
    providedIn: 'root'
})
export class GimnasioFirestoreAdapter implements IGimnasioFirestoreAdapter {
    private firestore = inject(Firestore);
    private readonly collectionName = 'gimnasios';

    /**
     * 📡 Suscribe a cambios en todos los gimnasios
     */
    subscribeToGimnasios(callback: (gimnasios: Gimnasio[]) => void): void {
        const gimnasiosCollection = collection(this.firestore, this.collectionName);
        const gimnasiosQuery = query(gimnasiosCollection, orderBy('nombre', 'asc'));
        
        onSnapshot(gimnasiosQuery, (snapshot) => {
            const gimnasios: Gimnasio[] = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data) {
                    gimnasios.push({
                        id: doc.id,
                        nombre: data['nombre'] || '',
                        direccion: data['direccion'] || '',
                        activo: data['activo'] || false
                    });
                }
            });
            
            callback(gimnasios);
        });
    }

    /**
     * 📡 Suscribe a cambios en un gimnasio específico
     */
    subscribeToGimnasio(id: string, callback: (gimnasio: Gimnasio | null) => void): void {
        const gimnasioRef = doc(this.firestore, this.collectionName, id);
        
        onSnapshot(gimnasioRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                callback({
                    id: doc.id,
                    nombre: data['nombre'] || '',
                    direccion: data['direccion'] || '',
                    activo: data['activo'] || false
                });
            } else {
                callback(null);
            }
        });
    }

    /**
     * 💾 Guarda o actualiza un gimnasio
     */
    async save(gimnasio: Gimnasio): Promise<void> {
        try {
            const gimnasioData = {
                nombre: gimnasio.nombre,
                direccion: gimnasio.direccion,
                activo: gimnasio.activo
            };

            if (gimnasio.id) {
                // Actualizar gimnasio existente
                const gimnasioRef = doc(this.firestore, this.collectionName, gimnasio.id);
                await updateDoc(gimnasioRef, gimnasioData);
            } else {
                // Crear nuevo gimnasio
                const gimnasiosCollection = collection(this.firestore, this.collectionName);
                await addDoc(gimnasiosCollection, gimnasioData);
            }
        } catch (error) {
            console.error('Error al guardar gimnasio:', error);
            throw error;
        }
    }

    /**
     * 🗑️ Elimina un gimnasio
     */
    async delete(id: string): Promise<void> {
        try {
            const gimnasioRef = doc(this.firestore, this.collectionName, id);
            await deleteDoc(gimnasioRef);
        } catch (error) {
            console.error('Error al eliminar gimnasio:', error);
            throw error;
        }
    }
}