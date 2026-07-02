import { Component, inject, computed, signal, OnInit, OnDestroy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonIcon,
  IonItem,
  IonLabel,
  IonButtons,
  IonButton,
  IonAvatar,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonInput,
  IonFooter,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline, returnDownForwardOutline, heart, heartOutline, trashOutline, createOutline, checkmarkOutline } from 'ionicons/icons';

import { AuthService } from '../../../../../../../core/services/auth.service';
import { UserService } from '../../../../../../../core/services/user.service';
import { ComentarioSocialService } from '../../../../../../../core/services/comentario-social.service';
import { FormatFechaPipe } from '../../../../../../../shared/pipes/format-fecha.pipe';
import { BackgroundComponent } from '../../../../../../../shared/components/background/background.component';
import { SesionRutina, Comentario } from 'gym-library';

@Component({
  selector: 'app-social-comments-modal',
  standalone: true,
  imports: [
    IonAvatar,
    CommonModule,
    FormsModule,
    IonIcon,
    FormatFechaPipe,
    IonItem,
    IonLabel,
    IonButtons,
    IonButton,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonInput,
    IonFooter,
    BackgroundComponent
  ],
  templateUrl: './social-comments-modal.component.html'
})
export class SocialCommentsModalComponent implements OnInit, OnDestroy {
  readonly sesion = input.required<SesionRutina>();
  readonly triggerId = input.required<string>();

  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly comentarioSocialService = inject(ComentarioSocialService);
  private readonly alertCtrl = inject(AlertController);

  currentUser = this.authService.currentUser;
  
  isOwnPost = computed(() => {
    const user = this.currentUser();
    const s = this.sesion();
    return user && s ? user.uid === s.entrenadoId : false;
  });

  comentarios = signal<Comentario[]>([]);
  nuevoComentarioTexto = '';
  comentarioAResponder = signal<Comentario | null>(null);
  comentarioEnEdicion = signal<Comentario | null>(null);
  respuestaEnEdicion = signal<Comentario | null>(null);
  private unsubscribeComentarios?: () => void;

  nombreUsuarioActual = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Usuario';
    const u = this.userService.getUserByUid(user.uid)();
    return u?.nombre || u?.email || 'Usuario';
  });

  fotoUsuarioActual = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    const u = this.userService.getUserByUid(user.uid)();
    return u?.photoURL || null;
  });

  constructor() {
    addIcons({ sendOutline, returnDownForwardOutline, heart, heartOutline, trashOutline, createOutline, checkmarkOutline });
  }

  ngOnInit() {}

  // Inicia la suscripción a Firestore en tiempo real
  iniciarSuscripcionComentarios() {
    const s = this.sesion();
    if (s?.id && !this.unsubscribeComentarios) {
      this.unsubscribeComentarios = this.comentarioSocialService.getComentarios(s.id, (list) => {
        this.comentarios.set(list);
      });
    }
  }

  ngOnDestroy() {
    this.cerrarSuscripcionComentarios();
  }

  cerrarSuscripcionComentarios() {
    if (this.unsubscribeComentarios) {
      this.unsubscribeComentarios();
      this.unsubscribeComentarios = undefined;
    }
    this.cancelarEdicion();
  }

  seleccionarParaResponder(comentario: Comentario) {
    if (this.isOwnPost()) {
      this.cancelarEdicion();
      this.comentarioAResponder.set(comentario);
    }
  }

  cancelarRespuesta() {
    this.comentarioAResponder.set(null);
  }

  async enviarComentario() {
    const texto = this.nuevoComentarioTexto.trim();
    if (!texto || texto.length > 250) return;

    const user = this.currentUser();
    const s = this.sesion();
    if (!user || !s?.id) return;

    try {
      const comentarioEdit = this.comentarioEnEdicion();
      const respuestaEdit = this.respuestaEnEdicion();
      const responderA = this.comentarioAResponder();

      if (comentarioEdit) {
        await this.comentarioSocialService.editarComentario(comentarioEdit.id, texto);
        this.cancelarEdicion();
      } else if (respuestaEdit) {
        await this.comentarioSocialService.editarRespuesta(respuestaEdit.id, texto);
        this.cancelarEdicion();
      } else if (responderA) {
        await this.comentarioSocialService.responderComentario(
          responderA.id,
          user.uid,
          this.nombreUsuarioActual(),
          this.fotoUsuarioActual(),
          texto,
          responderA.entrenadoId
        );
        this.comentarioAResponder.set(null);
        this.nuevoComentarioTexto = '';
      } else {
        await this.comentarioSocialService.agregarComentario(
          s.id,
          user.uid,
          this.nombreUsuarioActual(),
          this.fotoUsuarioActual(),
          texto,
          s.entrenadoId
        );
        this.nuevoComentarioTexto = '';
      }
    } catch (e) {
      console.error('Error al guardar comentario:', e);
    }
  }

  async toggleLikeComentario(comentario: Comentario) {
    const user = this.currentUser();
    if (!user || !comentario.id) return;

    const likes = comentario.likes || [];
    const hasLiked = likes.includes(user.uid);

    try {
      if (hasLiked) {
        await this.comentarioSocialService.removeLike(comentario.id, user.uid);
      } else {
        await this.comentarioSocialService.addLike(comentario.id, user.uid, this.nombreUsuarioActual(), comentario.entrenadoId);
      }
    } catch (e) {
      console.error('Error al alternar like en comentario:', e);
    }
  }

  hasLikedComentario(comentario: Comentario): boolean {
    const user = this.currentUser();
    return user ? (comentario.likes || []).includes(user.uid) : false;
  }

  async toggleLikeRespuesta(comentario: Comentario) {
    const user = this.currentUser();
    if (!user || !comentario.id || !comentario.respuesta) return;

    const likes = comentario.respuesta.likes || [];
    const hasLiked = likes.includes(user.uid);

    try {
      if (hasLiked) {
        await this.comentarioSocialService.removeLikeRespuesta(comentario.id, user.uid);
      } else {
        await this.comentarioSocialService.addLikeRespuesta(comentario.id, user.uid, this.nombreUsuarioActual(), comentario.respuesta.entrenadoId);
      }
    } catch (e) {
      console.error('Error al alternar like en respuesta:', e);
    }
  }

  hasLikedRespuesta(comentario: Comentario): boolean {
    const user = this.currentUser();
    return user && comentario.respuesta ? (comentario.respuesta.likes || []).includes(user.uid) : false;
  }

  getReplyLikesCount(comentario: Comentario): number {
    return (comentario.respuesta?.likes || []).length;
  }

  async eliminarComentario(comentarioId: string) {
    const alert = await this.alertCtrl.create({
      message: '¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.comentarioSocialService.eliminarComentario(comentarioId);
            } catch (e) {
              console.error('Error al eliminar comentario:', e);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarRespuesta(comentarioId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta respuesta? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.comentarioSocialService.eliminarRespuesta(comentarioId);
            } catch (e) {
              console.error('Error al eliminar respuesta:', e);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  iniciarEdicionComentario(comentario: Comentario) {
    this.cancelarRespuesta();
    this.comentarioEnEdicion.set(comentario);
    this.nuevoComentarioTexto = comentario.contenido;
  }

  iniciarEdicionRespuesta(comentario: Comentario) {
    this.cancelarRespuesta();
    this.respuestaEnEdicion.set(comentario);
    this.nuevoComentarioTexto = comentario.respuesta?.contenido || '';
  }

  cancelarEdicion() {
    this.comentarioEnEdicion.set(null);
    this.respuestaEnEdicion.set(null);
    this.nuevoComentarioTexto = '';
  }
}
