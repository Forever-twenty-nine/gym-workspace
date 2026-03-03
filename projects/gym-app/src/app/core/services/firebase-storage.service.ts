import { Injectable, inject } from '@angular/core';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    FirebaseStorage
} from 'firebase/storage';
import { STORAGE } from '../firebase.tokens';

@Injectable({
    providedIn: 'root'
})
export class FirebaseStorageService {
    private readonly storage = inject(STORAGE);

    /**
     * Sube un archivo a Firebase Storage
     * @param path Ruta donde se guardará el archivo (ej: 'profiles/uid/avatar.jpg')
     * @param file El archivo a subir
     * @returns La URL de descarga del archivo
     */
    async uploadFile(path: string, file: File | Blob): Promise<string> {
        const storageRef = ref(this.storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    }

    /**
     * Elimina un archivo de Firebase Storage
     * @param path Ruta del archivo a eliminar
     */
    async deleteFile(path: string): Promise<void> {
        const storageRef = ref(this.storage, path);
        await deleteObject(storageRef);
    }

    /**
     * Genera una ruta para la foto de perfil de un usuario
     * @param uid UID del usuario
     * @param extension Extensión del archivo
     */
    getProfilePath(uid: string, extension: string = 'jpg'): string {
        return `profiles/${uid}/profile_${Date.now()}.${extension}`;
    }
}
