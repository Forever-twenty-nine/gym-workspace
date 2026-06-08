import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonBadge,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    calendarOutline,
    timeOutline,
    checkmarkCircleOutline,
    closeOutline,
    shareSocialOutline,
    barbellOutline,
    cameraOutline
} from 'ionicons/icons';
import { inject, signal, computed } from '@angular/core';
import { SesionRutinaService } from '../../../../core/services/sesion-rutina.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { FirebaseStorageService } from '../../../../core/services/firebase-storage.service';
import { Plan, SesionRutina } from 'gym-library';
import { compressImage } from '../../../../core/utils/image-compression';
import { IonSpinner, ToastController } from '@ionic/angular/standalone';
import { SocialShareService } from '../../../../core/services/social-share.service';

@Component({
    selector: 'app-progreso-historial-detalle',
    standalone: true,
    imports: [
        CommonModule,
        IonModal,
        IonHeader,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonIcon,
        IonContent,
        IonBadge,
        IonList,
        IonItem,
        IonLabel,
        IonToggle,
        IonFooter,
        IonSpinner
    ],
    templateUrl: './progreso-historial-detalle.component.html',
    
})
export class ProgresoHistorialDetalleComponent {
    
    private sesionRutinaService = inject(SesionRutinaService);
    private authService = inject(AuthService);
    private userService = inject(UserService);
    private storageService = inject(FirebaseStorageService);
    private toastCtrl = inject(ToastController);
    private socialShareService = inject(SocialShareService);

    @Input() isOpen = false;
    @Input() sesionSeleccionada: SesionRutina | null = null;
    @Output() didDismiss = new EventEmitter<void>();

    isPremium = computed(() => this.authService.currentUser()?.plan === Plan.PREMIUM);
    isUploading = signal(false);
    isSharing = signal(false);
    fotoProgresoUrl = signal<string | null>(null);

    constructor() {
        addIcons({
            calendarOutline,
            timeOutline,
            checkmarkCircleOutline,
            closeOutline,
            shareSocialOutline,
            barbellOutline,
            cameraOutline
        });
    }

    ngOnChanges() {
        if (this.sesionSeleccionada) {
            this.fotoProgresoUrl.set(this.sesionSeleccionada.fotoProgreso || null);
        }
    }

    cerrarDetalle() {
        this.didDismiss.emit();
    }

    async toggleCompartir(event: { detail?: { checked?: boolean } }) {
        if (!this.sesionSeleccionada) return;
        const compartida = !!event?.detail?.checked;
        const user = this.authService.currentUser();

        if (user) {
            // Optimistic update
            this.sesionSeleccionada.compartida = compartida;
            this.sesionSeleccionada.nombreUsuario = user.nombre || user.email || 'Usuario';
            this.sesionSeleccionada.fotoUsuario = user.photoURL || undefined;

            await this.sesionRutinaService.setCompartida(
                this.sesionSeleccionada.id,
                compartida,
                this.sesionSeleccionada.nombreUsuario,
                this.sesionSeleccionada.fotoUsuario,
                this.fotoProgresoUrl() || undefined,
                user.gimnasioId
            );
        }
    }

    triggerPhotoInput() {
        // Consider moving to a directive or <input #photoInput hidden (change)="..."> + ViewChild for better practice
        const input = document.getElementById('foto-progreso-input') as HTMLInputElement | null;
        input?.click();
    }

    async onPhotoSelected(event: Event) {
        const input = event.target as HTMLInputElement | null;
        const file = input?.files?.[0];
        if (!file || !this.sesionSeleccionada) return;

        if (!file.type.startsWith('image/')) {
            this.showToast('Por favor selecciona una imagen válida', 'warning');
            return;
        }

        const user = this.authService.currentUser();
        if (!user) return;

        this.isUploading.set(true);
        try {
            // 1. Comprimir imagen
            const compressedBlob = await compressImage(file, 1080, 1080, 0.7, true);

            // 2. Subir a Firebase Storage
            const extension = file.name.split('.').pop() || 'jpg';
            const path = this.storageService.getProgressPhotoPath(user.uid, this.sesionSeleccionada.id, extension);
            const downloadUrl = await this.storageService.uploadFile(path, compressedBlob);

            // 3. Actualizar localmente y en Firestore
            this.fotoProgresoUrl.set(downloadUrl);
            this.sesionSeleccionada.fotoProgreso = downloadUrl;

            if (this.sesionSeleccionada.compartida) {
                await this.sesionRutinaService.setCompartida(
                    this.sesionSeleccionada.id,
                    true,
                    this.sesionSeleccionada.nombreUsuario,
                    this.sesionSeleccionada.fotoUsuario,
                    downloadUrl,
                    user.gimnasioId
                );
            }

            this.showToast('Foto de progreso cargada correctamente', 'success');
        } catch (error) {
            console.error('Error al subir foto de progreso:', error);
            this.showToast('Error al subir la foto', 'danger');
        } finally {
            this.isUploading.set(false);
        }
    }

    private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
        const toast = await this.toastCtrl.create({
            message,
            duration: 2000,
            color,
            position: 'bottom'
        });
        toast.present();
    }

    formatearFecha(fecha?: Date | string): string {
        if (!fecha) return 'Sin fecha';
        const date = fecha instanceof Date ? fecha : new Date(fecha);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getEstadoSesion(sesion: SesionRutina): string {
        if (sesion.completada) return 'Completada';
        if (sesion.fechaInicio) return 'En progreso';
        return 'Pendiente';
    }

    getColorEstado(sesion: SesionRutina): string {
        if (sesion.completada) return 'success';
        if (sesion.fechaInicio) return 'primary';
        return 'medium';
    }

    redondearMinutos(segundos: number): number {
        return Math.round((segundos || 0) / 60);
    }

    async compartirWhatsApp() {
        if (!this.sesionSeleccionada) return;

        const textoCompartir = this.generarTextoCompartir();
        this.isSharing.set(true);

        try {
            await this.socialShareService.compartirSesionRutina(
                this.sesionSeleccionada,
                textoCompartir,
                () => this.isSharing.set(false)
            );
        } catch (error) {
            console.error('Error al compartir:', error);
            this.isSharing.set(false);
        }
    }

    private generarTextoCompartir(): string {
        const sesion = this.sesionSeleccionada!;
        const nombre = sesion.rutinaResumen?.nombre || 'Mi Rutina';
        const tiempo = this.redondearMinutos(sesion.duracion || 0);

        let ejerciciosStr = '';
        if (sesion.rutinaResumen?.ejercicios?.length) {
            ejerciciosStr = '\n\nEjercicios realizados:\n';
            sesion.rutinaResumen.ejercicios.forEach((ej, i: number) => {
                ejerciciosStr += `${i + 1}. ${ej.nombre || 'Ejercicio'}\n`;
            });
        }
        return `¡Terminé mi entrenamiento de "${nombre}" en ${tiempo} minutos! 💪 Entrenamiento completado con Gym App.${ejerciciosStr}`;
    }

    eliminarSesion(arg0: SesionRutina, $event: PointerEvent) {
        throw new Error('Method not implemented.');
    }
}
