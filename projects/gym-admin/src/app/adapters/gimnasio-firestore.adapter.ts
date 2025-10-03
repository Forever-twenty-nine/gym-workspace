import { Injectable } from '@angular/core';
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    setDoc,
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
            const gimnasioData: any = {
                activo: gimnasio.activo
            };
            
            // Solo agregar campos si no son undefined
            if (gimnasio.nombre !== undefined && gimnasio.nombre !== null) {
                gimnasioData.nombre = gimnasio.nombre;
            }
            
            if (gimnasio.direccion !== undefined && gimnasio.direccion !== null) {
                gimnasioData.direccion = gimnasio.direccion;
            }

            if (gimnasio.id) {
                // Crear o actualizar gimnasio con ID específico usando setDoc
                const gimnasioRef = doc(this.firestore, this.collectionName, gimnasio.id);
                await setDoc(gimnasioRef, gimnasioData);
            } else {
                // Crear nuevo gimnasio con ID automático
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