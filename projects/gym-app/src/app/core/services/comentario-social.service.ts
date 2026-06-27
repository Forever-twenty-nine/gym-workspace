import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { Comentario, TipoNotificacion, Notificacion } from 'gym-library';
import { FIRESTORE } from '../firebase.tokens';
import { NotificacionService } from './notificacion.service';

@Injectable({ providedIn: 'root' })
export class ComentarioSocialService {
  private readonly firestore = inject(FIRESTORE);
  private readonly notificacionService = inject(NotificacionService);
  private readonly COLLECTION = 'comentarios-social';

  constructor() {}

  /**
   * Se suscribe a los comentarios de una publicación en tiempo real.
   * Retorna la función para desuscribirse.
   */
  getComentarios(sesionId: string, callback: (comentarios: Comentario[]) => void): () => void {
    const q = query(
      collection(this.firestore, this.COLLECTION),
      where('sesionId', '==', sesionId)
    );

    return onSnapshot(q, (snapshot) => {
      const comentarios = snapshot.docs.map(d => this.mapFromFirestore({ ...d.data(), id: d.id }));
      // Ordenar por fecha ascendente para el flujo de conversación
      comentarios.sort((a, b) => {
        const tA = a.fecha instanceof Date ? a.fecha.getTime() : 0;
        const tB = b.fecha instanceof Date ? b.fecha.getTime() : 0;
        return tA - tB;
      });
      callback(comentarios);
    });
  }

  async agregarComentario(
    sesionId: string,
    entrenadoId: string,
    nombreUsuario: string,
    fotoUsuario: string | null,
    contenido: string,
    ownerId?: string
  ): Promise<void> {
    const id = crypto.randomUUID();
    const ref = doc(this.firestore, this.COLLECTION, id);
    const comentario: any = {
      id,
      sesionId,
      entrenadoId,
      nombreUsuario,
      fotoUsuario: fotoUsuario || null,
      contenido,
      fecha: Timestamp.now(),
      likes: []
    };
    await setDoc(ref, comentario);

    // Enviar notificación si el autor del comentario no es el dueño del post
    if (ownerId && entrenadoId !== ownerId) {
      const notificacion: Notificacion = {
        id: crypto.randomUUID(),
        usuarioId: ownerId,
        tipo: TipoNotificacion.NUEVO_COMENTARIO,
        titulo: 'Nuevo Comentario',
        mensaje: `${nombreUsuario} comentó tu publicación`,
        leida: false,
        fechaCreacion: new Date(),
        datos: {
          sesionId,
          comentarioId: id,
          autorId: entrenadoId,
          autorNombre: nombreUsuario
        }
      };
      await this.notificacionService.save(notificacion);
    }
  }

  async responderComentario(
    comentarioId: string,
    entrenadoId: string,
    nombreUsuario: string,
    fotoUsuario: string | null,
    contenido: string,
    ownerId?: string
  ): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, comentarioId);
    const respuesta = {
      id: crypto.randomUUID(),
      entrenadoId,
      nombreUsuario,
      fotoUsuario: fotoUsuario || null,
      contenido,
      fecha: Timestamp.now(),
      likes: []
    };
    await updateDoc(ref, { respuesta });

    // Enviar notificación si el creador que responde no es el autor del comentario original
    if (ownerId && entrenadoId !== ownerId) {
      const notificacion: Notificacion = {
        id: crypto.randomUUID(),
        usuarioId: ownerId,
        tipo: TipoNotificacion.NUEVA_RESPUESTA,
        titulo: 'Nueva Respuesta',
        mensaje: `${nombreUsuario} respondió a tu comentario`,
        leida: false,
        fechaCreacion: new Date(),
        datos: {
          comentarioId,
          autorId: entrenadoId,
          autorNombre: nombreUsuario
        }
      };
      await this.notificacionService.save(notificacion);
    }
  }

  async addLike(comentarioId: string, userId: string, likerNombre?: string, ownerId?: string): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, comentarioId);
    await updateDoc(ref, {
      likes: arrayUnion(userId)
    });

    // Enviar notificación si el usuario que da like no es el dueño del comentario
    if (ownerId && userId !== ownerId) {
      const notificacion: Notificacion = {
        id: crypto.randomUUID(),
        usuarioId: ownerId,
        tipo: TipoNotificacion.LIKE_COMENTARIO,
        titulo: 'Nuevo Me Gusta',
        mensaje: `${likerNombre || 'Alguien'} le dio me gusta a tu comentario`,
        leida: false,
        fechaCreacion: new Date(),
        datos: {
          comentarioId,
          likerId: userId,
          likerNombre: likerNombre || ''
        }
      };
      await this.notificacionService.save(notificacion);
    }
  }

  async removeLike(comentarioId: string, userId: string): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, comentarioId);
    await updateDoc(ref, {
      likes: arrayRemove(userId)
    });
  }

  async addLikeRespuesta(comentarioId: string, userId: string, likerNombre?: string, ownerId?: string): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, comentarioId);
    await updateDoc(ref, {
      'respuesta.likes': arrayUnion(userId)
    });

    // Enviar notificación si el usuario que da like no es el dueño de la respuesta
    if (ownerId && userId !== ownerId) {
      const notificacion: Notificacion = {
        id: crypto.randomUUID(),
        usuarioId: ownerId,
        tipo: TipoNotificacion.LIKE_COMENTARIO,
        titulo: 'Nuevo Me Gusta',
        mensaje: `${likerNombre || 'Alguien'} le dio me gusta a tu respuesta`,
        leida: false,
        fechaCreacion: new Date(),
        datos: {
          comentarioId,
          likerId: userId,
          likerNombre: likerNombre || ''
        }
      };
      await this.notificacionService.save(notificacion);
    }
  }

  async removeLikeRespuesta(comentarioId: string, userId: string): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, comentarioId);
    await updateDoc(ref, {
      'respuesta.likes': arrayRemove(userId)
    });
  }

  async eliminarComentario(id: string): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, id);
    await deleteDoc(ref);
  }

  async eliminarRespuesta(comentarioId: string): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, comentarioId);
    await updateDoc(ref, {
      respuesta: null
    });
  }

  async editarComentario(comentarioId: string, nuevoContenido: string): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, comentarioId);
    await updateDoc(ref, {
      contenido: nuevoContenido
    });
  }

  async editarRespuesta(comentarioId: string, nuevoContenido: string): Promise<void> {
    const ref = doc(this.firestore, this.COLLECTION, comentarioId);
    await updateDoc(ref, {
      'respuesta.contenido': nuevoContenido
    });
  }

  private mapFromFirestore(data: any): Comentario {
    const comentario = {
      ...data,
      fecha: data.fecha instanceof Timestamp ? data.fecha.toDate() : (data.fecha ? new Date(data.fecha) : new Date()),
      likes: data.likes || []
    } as Comentario;
    if (comentario.respuesta) {
      comentario.respuesta = {
        ...comentario.respuesta,
        fecha: comentario.respuesta.fecha instanceof Timestamp 
          ? comentario.respuesta.fecha.toDate() 
          : (comentario.respuesta.fecha ? new Date(comentario.respuesta.fecha) : new Date()),
        likes: comentario.respuesta.likes || []
      };
    }
    return comentario;
  }
}
