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
    IonText,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonFooter,
    IonToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    calendarOutline,
    timeOutline,
    checkmarkCircleOutline,
    closeOutline,
    shareSocialOutline,
    barbellOutline,
    logoWhatsapp
} from 'ionicons/icons';
import { inject } from '@angular/core';
import { SesionRutinaService } from '../../../../core/services/sesion-rutina.service';
import { AuthService } from '../../../../core/services/auth.service';

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
        IonText,
        IonList,
        IonItem,
        IonLabel,
        IonToggle
    ],
    templateUrl: './progreso-historial-detalle.component.html'
})
export class ProgresoHistorialDetalleComponent {
    private sesionRutinaService = inject(SesionRutinaService);
    private authService = inject(AuthService);

    @Input() isOpen = false;
    @Input() sesionSeleccionada: any = null;
    @Output() didDismiss = new EventEmitter<void>();

    constructor() {
        addIcons({
            calendarOutline,
            timeOutline,
            checkmarkCircleOutline,
            closeOutline,
            shareSocialOutline,
            barbellOutline,
            logoWhatsapp
        });
    }

    cerrarDetalle() {
        this.didDismiss.emit();
    }

    async toggleCompartir(event: any) {
        if (!this.sesionSeleccionada) return;
        const compartida = event.detail.checked;
        const user = this.authService.currentUser();
        if (user) {
            await this.sesionRutinaService.setCompartida(this.sesionSeleccionada.id, compartida, user.nombre || 'Usuario');
        }
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

    getEstadoSesion(sesion: any): string {
        if (sesion.completada) return 'Completada';
        if (sesion.fechaInicio) return 'En progreso';
        return 'Pendiente';
    }

    getColorEstado(sesion: any): string {
        if (sesion.completada) return 'success';
        if (sesion.fechaInicio) return 'primary';
        return 'medium';
    }

    redondearMinutos(segundos: number): number {
        return Math.round((segundos || 0) / 60);
    }

    async compartirSesion() {
        if (!this.sesionSeleccionada) return;
        const textoCompartir = this.generarTextoCompartir();

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Entrenamiento Completado',
                    text: textoCompartir,
                });
            } catch (error) {
                console.log('Error compartiendo:', error);
            }
        } else {
            // Fallback si no está soportado (Copia al portapapeles)
            navigator.clipboard.writeText(textoCompartir).then(() => {
                alert('¡Texto de tu entrenamiento copiado al portapapeles para compartir!');
            });
        }
    }

    compartirWhatsApp() {
        if (!this.sesionSeleccionada) return;
        const textoCompartir = this.generarTextoCompartir();
        const url = `https://wa.me/?text=${encodeURIComponent(textoCompartir)}`;
        window.open(url, '_blank');
    }

    private generarTextoCompartir(): string {
        const sesion = this.sesionSeleccionada;
        const nombre = sesion.rutinaResumen?.nombre || 'Mi Rutina';
        const tiempo = this.redondearMinutos(sesion.duracion || 0);

        let ejerciciosStr = '';
        if (sesion.rutinaResumen?.ejercicios?.length) {
            ejerciciosStr = '\n\nEjercicios realizados:\n';
            sesion.rutinaResumen.ejercicios.forEach((ej: any, i: number) => {
                ejerciciosStr += `${i + 1}. ${ej.nombre || 'Ejercicio'}\n`;
            });
        }
        return `¡Terminé mi entrenamiento de "${nombre}" en ${tiempo} minutos! 💪 Entrenamiento completado con la App Gym.${ejerciciosStr}`;
    }
}
