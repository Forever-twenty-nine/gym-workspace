import { Injectable, inject } from '@angular/core';
import { ProgresoService } from './progreso.service';
import { EstadisticasEntrenadoService } from './estadisticas-entrenado.service';
import { EntrenadoService } from './entrenado.service';
import { UserService } from './user.service';

export interface ShareProgressOptions {
  includeStats?: boolean;
  includeLevel?: boolean;
  includeStreak?: boolean;
  backgroundColor?: string;
  textColor?: string;
  watermarkText?: string;
}

export interface SocialSharePlatform {
  name: 'instagram' | 'facebook' | 'twitter' | 'whatsapp';
  url: string;
}

/**
 * Servicio para compartir progreso en redes sociales
 * Genera imágenes con watermark para versión gratuita
 */
@Injectable({ providedIn: 'root' })
export class SocialShareService {
  private readonly progresoService = inject(ProgresoService);
  private readonly estadisticasService = inject(EstadisticasEntrenadoService);
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly userService = inject(UserService);

  private readonly defaultWatermarkText = 'Exportá tu progreso completo en PDF — desbloqueá con Premium';

  /**
   * Genera una imagen del progreso con watermark
   * @param entrenadoId ID del entrenado
   * @param options Opciones de personalización
   * @returns Promise con el blob de la imagen generada
   */
  async generateProgressImage(
    entrenadoId: string,
    options: ShareProgressOptions = {}
  ): Promise<Blob> {
    const {
      includeStats = true,
      includeLevel = true,
      includeStreak = true,
      backgroundColor = '#1a1a1a',
      textColor = '#ffffff',
      watermarkText = this.defaultWatermarkText,
    } = options;

    // Obtener datos del entrenado y estadísticas
    const entrenado = this.entrenadoService.getEntrenado(entrenadoId)();
    const estadisticas = this.estadisticasService.getEstadisticas(entrenadoId)();

    if (!entrenado || !estadisticas) {
      throw new Error('No se encontraron datos del entrenado');
    }

    // Crear canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1080; // Formato Instagram
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No se pudo obtener el contexto del canvas');
    }

    // Fondo
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Título
    ctx.fillStyle = textColor;
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Mi Progreso', canvas.width / 2, 100);

    // Nombre del usuario
    const usuario = this.userService.user();
    ctx.font = '40px Arial';
    ctx.fillText(usuario?.nombre || 'Usuario', canvas.width / 2, 180);

    let yPosition = 280;
    const statsX = 200;

    // Estadísticas
    if (includeStats) {
      ctx.font = 'bold 35px Arial';
      ctx.fillText('Estadísticas', canvas.width / 2, yPosition);
      yPosition += 80;

      ctx.font = '30px Arial';
      ctx.textAlign = 'left';
      
      ctx.fillText(
        `Rutinas completadas: ${estadisticas.totalRutinasCompletadas}`,
        statsX,
        yPosition
      );
      yPosition += 60;
    }

    // Nivel
    if (includeLevel) {
      ctx.fillText(
        `Nivel: ${estadisticas.nivel} (${estadisticas.experiencia} XP)`,
        statsX,
        yPosition
      );
      yPosition += 60;
    }

    // Racha
    if (includeStreak) {
      ctx.fillText(
        `Racha actual: ${estadisticas.rachaActual} días`,
        statsX,
        yPosition
      );
      yPosition += 60;
      ctx.fillText(
        `Mejor racha: ${estadisticas.mejorRacha} días`,
        statsX,
        yPosition
      );
      yPosition += 80;
    }

    // Watermark con fondo semitransparente
    ctx.textAlign = 'center';
    const watermarkHeight = 120;
    const watermarkY = canvas.height - watermarkHeight;
    
    // Fondo del watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, watermarkY, canvas.width, watermarkHeight);

    // Texto del watermark
    ctx.fillStyle = '#ffcc00'; // Color dorado para destacar
    ctx.font = 'bold 24px Arial';
    
    // Dividir el texto en dos líneas si es muy largo
    const maxWidth = canvas.width - 100;
    const words = watermarkText.split(' ');
    let line1 = '';
    let line2 = '';
    let isSecondLine = false;

    for (const word of words) {
      const testLine = (isSecondLine ? line2 : line1) + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && !isSecondLine) {
        isSecondLine = true;
        line2 = word + ' ';
      } else if (isSecondLine) {
        line2 += word + ' ';
      } else {
        line1 += word + ' ';
      }
    }

    if (line2) {
      ctx.fillText(line1.trim(), canvas.width / 2, watermarkY + 40);
      ctx.fillText(line2.trim(), canvas.width / 2, watermarkY + 75);
    } else {
      ctx.fillText(line1.trim(), canvas.width / 2, watermarkY + 60);
    }

    // Convertir canvas a blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error al generar la imagen'));
          }
        },
        'image/png',
        0.95
      );
    });
  }

  /**
   * Comparte la imagen del progreso en una red social
   * @param blob Imagen generada
   * @param platform Plataforma de red social
   * @param text Texto adicional para compartir
   */
  async shareToSocialMedia(
    blob: Blob,
    platform: 'instagram' | 'facebook' | 'twitter' | 'whatsapp',
    text: string = '¡Mira mi progreso!'
  ): Promise<void> {
    // Verificar si Web Share API está disponible
    if (navigator.share) {
      try {
        const file = new File([blob], 'mi-progreso.png', { type: 'image/png' });
        await navigator.share({
          files: [file],
          title: 'Mi Progreso',
          text: text,
        });
        return;
      } catch (error) {
        console.log('Error al compartir con Web Share API:', error);
        // Continuar con el método alternativo
      }
    }

    // Método alternativo: descargar y abrir URLs específicas
    const url = URL.createObjectURL(blob);
    const shareUrls = this.getShareUrls(text);
    const targetUrl = shareUrls.find((u) => u.name === platform)?.url;

    if (targetUrl) {
      // Abrir en nueva ventana
      window.open(targetUrl, '_blank');
    }

    // También descargar la imagen para que el usuario pueda subirla manualmente
    this.downloadImage(blob, 'mi-progreso.png');
  }

  /**
   * Descarga la imagen del progreso
   * @param blob Imagen generada
   * @param filename Nombre del archivo
   */
  downloadImage(blob: Blob, filename: string = 'mi-progreso.png'): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Obtiene las URLs para compartir en diferentes plataformas
   * @param text Texto para compartir
   * @returns Array de plataformas con sus URLs
   */
  getShareUrls(text: string = '¡Mira mi progreso!'): SocialSharePlatform[] {
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(window.location.href);

    return [
      {
        name: 'instagram',
        url: 'https://www.instagram.com/', // Instagram no tiene URL share directa
      },
      {
        name: 'facebook',
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      },
      {
        name: 'twitter',
        url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      },
      {
        name: 'whatsapp',
        url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      },
    ];
  }

  /**
   * Genera una imagen de progreso y la comparte directamente
   * @param entrenadoId ID del entrenado
   * @param platform Plataforma de red social
   * @param options Opciones de personalización
   */
  async generateAndShare(
    entrenadoId: string,
    platform: 'instagram' | 'facebook' | 'twitter' | 'whatsapp',
    options: ShareProgressOptions = {}
  ): Promise<void> {
    const blob = await this.generateProgressImage(entrenadoId, options);
    await this.shareToSocialMedia(blob, platform);
  }
}
