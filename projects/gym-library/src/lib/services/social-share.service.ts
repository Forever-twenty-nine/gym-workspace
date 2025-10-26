import { Injectable, inject } from '@angular/core';
import { ProgresoService } from './progreso.service';
import { EstadisticasEntrenadoService } from './estadisticas-entrenado.service';
import { EntrenadoService } from './entrenado.service';
import { UserService } from './user.service';
import { SesionRutinaService } from './sesion-rutina.service';
import { SesionRutina } from '../models/sesion-rutina.model';

export interface ShareProgressOptions {
  includeStats?: boolean;
  includeLevel?: boolean;
  includeStreak?: boolean;
  includeLast7Days?: boolean;
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
  private readonly sesionRutinaService = inject(SesionRutinaService);

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
      includeLast7Days = true,
      backgroundColor = '#1a1a1a',
      textColor = '#ffffff',
      watermarkText = this.defaultWatermarkText,
    } = options;

    // Obtener datos del entrenado y estadísticas (con fallback completo)
    const entrenado = this.entrenadoService.getEntrenado(entrenadoId)();
    let estadisticas = this.estadisticasService.getEstadisticas(entrenadoId)();

    if (!estadisticas) {
      // Intentar inicializar listener y esperar brevemente
      try {
        this.estadisticasService.initializeListener(entrenadoId);
      } catch (err) {
        // Ignorar si el adapter no está aún disponible
      }

      // Espera corta con polling
      const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
      for (let i = 0; i < 5 && !estadisticas; i++) {
        await wait(200);
        estadisticas = this.estadisticasService.getEstadisticas(entrenadoId)();
      }
    }

    // Si aún no hay estadísticas, usar valores por defecto de manera segura
    if (!estadisticas) {
      estadisticas = {
        totalRutinasCompletadas: 0,
        rachaActual: 0,
        mejorRacha: 0,
        nivel: 1,
        experiencia: 0,
        experienciaProximoNivel: 100
      } as any;
    }

    const stats: any = estadisticas;

    // Nota: No requerimos que el entrenado esté disponible
    // El nombre del usuario se usará como fallback
  
  // Crear canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1080; // Formato Instagram
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No se pudo obtener el contexto del canvas');
    }

    // Fondo degradado moderno
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#111827'); // slate-900
    bgGrad.addColorStop(1, '#0b0f17'); // más oscuro
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Encabezado (alineado a la izquierda, más minimalista)
  const marginX = 96;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 12;
  ctx.font = 'bold 68px Arial';
  ctx.fillText('Mi Progreso', marginX, 110);
  ctx.shadowBlur = 0;

    // Nombre del usuario/entrenado (mejor fallback)
    const usuario = this.userService.user();
    // Intentar obtener el usuario asociado al entrenado (por uid === entrenadoId)
    let displayName: string | undefined = undefined;
    try {
      const list = this.userService.users(); // Signal invocada para obtener array
      const owner = list.find((u: any) => u?.uid === entrenadoId);
      displayName = owner?.nombre || owner?.email || usuario?.nombre || usuario?.email || undefined;
      if (!displayName) {
        // Polling corto por si el listener de usuarios aún no actualizó
        const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
        const byUid = this.userService.getUserByUid(entrenadoId);
        for (let i = 0; i < 5 && !displayName; i++) {
          await wait(200);
          const u = byUid();
          if (u) {
            displayName = u.nombre || u.email || undefined;
            break;
          }
        }
      }
    } catch {}
    // No mostrar ID ni texto genérico: si no hay nombre real, omitimos la línea
    if (displayName) {
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '500 40px Arial';
      ctx.fillText(displayName, marginX, 175);
    }

    // Precalcular métricas de últimos 7 días si se pidió
    let dias7: { label: string; key: string; count: number }[] | null = null;
    let total7 = 0;
    if (includeLast7Days) {
      const sesiones: SesionRutina[] = (this.sesionRutinaService.getSesionesPorEntrenado(entrenadoId)() || []) as any;
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      const dayNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
      dias7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(hoy); d.setDate(hoy.getDate() - i);
        const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
        dias7.push({ label: dayNames[d.getDay()], key, count: 0 });
      }
      const toDate = (v: any): Date | null => {
        if (!v) return null; if (v instanceof Date) return v; if (typeof v.toDate === 'function') return v.toDate();
        const d = new Date(v); return isNaN(d.getTime()) ? null : d;
      };
      const start = new Date(hoy); start.setDate(hoy.getDate() - 6); start.setHours(0,0,0,0);
      sesiones.filter(s => s && s.completada === true && s.fechaFin)
        .forEach(s => {
          const f = toDate((s as any).fechaFin); if (!f) return;
          const df = new Date(f); df.setHours(0,0,0,0);
          if (df < start || df > hoy) return;
          const key = `${df.getFullYear()}-${(df.getMonth()+1).toString().padStart(2,'0')}-${df.getDate().toString().padStart(2,'0')}`;
          const bucket = dias7!.find(d => d.key === key); if (bucket) bucket.count += 1;
        });
  total7 = dias7.reduce((acc, d) => acc + d.count, 0);
    }

  let yPosition = 240;
  const statsX = marginX;

    // Estadísticas
    if (includeStats) {
      // Subtítulo con pill
  ctx.font = 'bold 34px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText('Estadísticas', marginX, yPosition);
  yPosition += 50;

      // Tarjeta semitransparente
  const cardX = marginX, cardY = yPosition - 42, cardW = canvas.width - marginX * 2, cardH = 110;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.stroke();

      ctx.font = '30px Arial';
  ctx.textAlign = 'left';
      ctx.fillStyle = '#f3f4f6';
      const labelTotal = includeLast7Days ? `Rutinas completadas (7 días): ${total7}` : `Rutinas completadas: ${stats.totalRutinasCompletadas}`;
  ctx.fillText(labelTotal, statsX + 14, yPosition);
  yPosition += 70;
    }

    // Nivel
    if (includeLevel) {
      ctx.fillText(
        `Nivel: ${stats.nivel} (${stats.experiencia} XP)`,
        statsX,
        yPosition
      );
      yPosition += 60;
    }

    // Racha
    if (includeStreak) {
      ctx.fillText(
        `Racha actual: ${stats.rachaActual} días`,
        statsX,
        yPosition
      );
      yPosition += 60;
      ctx.fillText(
        `Mejor racha: ${stats.mejorRacha} días`,
        statsX,
        yPosition
      );
      yPosition += 80;
    }

    // Últimos 7 días: gráfico de barras y total
    if (includeLast7Days && dias7) {
      const maxCount = Math.max(1, ...dias7.map(d => d.count));

      // Título sección
    ctx.textAlign = 'left';
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Últimos 7 días', marginX, yPosition);
      yPosition += 20;
    ctx.font = 'italic 22px Arial';
    ctx.fillStyle = '#d1d5db';
    ctx.fillText(`Rutinas completadas: ${total7}`, marginX, yPosition + 40);

      // Área del gráfico
      const chartTop = yPosition + 70;
      const reservedBottom = 120 + 30; // watermark + margen/labels
      const maxChartBottom = canvas.height - reservedBottom;
      let chartHeight = 220;
      if (chartTop + chartHeight > maxChartBottom) {
        chartHeight = Math.max(100, maxChartBottom - chartTop);
      }
      const chartLeft = marginX;
      const chartRight = canvas.width - marginX;
      const chartWidth = chartRight - chartLeft;

      // Eje base + líneas de guía
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartLeft, chartTop + chartHeight);
      ctx.lineTo(chartRight, chartTop + chartHeight);
      ctx.stroke();

      // Líneas de guía horizontales (4 divisiones)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      for (let i = 1; i <= 4; i++) {
        const y = chartTop + chartHeight - (chartHeight * i) / 4;
        ctx.beginPath();
        ctx.moveTo(chartLeft, y);
        ctx.lineTo(chartRight, y);
        ctx.stroke();
      }

      // Barras
      const barSpacing = 12;
      const barWidth = (chartWidth - barSpacing * (dias7.length - 1)) / dias7.length;
      dias7.forEach((d, idx) => {
        const h = Math.round((d.count / maxCount) * chartHeight);
        const x = chartLeft + idx * (barWidth + barSpacing);
        const y = chartTop + (chartHeight - h);
        const grad = ctx.createLinearGradient(0, y, 0, y + h);
        grad.addColorStop(0, '#60a5fa'); // blue-400
        grad.addColorStop(1, '#8b5cf6'); // violet-500
        ctx.fillStyle = grad;
        // sombra sutil de la barra
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 8;
        ctx.fillRect(x, y, barWidth, h);
        ctx.shadowBlur = 0;
        // Día
        ctx.fillStyle = textColor;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, x + barWidth / 2, chartTop + chartHeight + 24);
        if (d.count > 0) {
          ctx.font = 'bold 20px Arial';
          ctx.fillText(String(d.count), x + barWidth / 2, y - 8);
        }
      });

      yPosition = chartTop + chartHeight + 60;
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
      } catch (error: any) {
        // Silenciar errores no críticos (cancelación)
        // Si el usuario cancela, el error será AbortError
        if (error.name === 'AbortError') {
          return; // No continuar con fallback si el usuario canceló
        }
        // Continuar con el método alternativo
      }
    } else {
      // Continuar con el fallback silenciosamente
    }

    // Método alternativo: descargar y abrir URLs específicas
    const url = URL.createObjectURL(blob);
    const shareUrls = this.getShareUrls(text);
    const targetUrl = shareUrls.find((u) => u.name === platform)?.url;

    if (targetUrl) {
      // Abrir en nueva ventana
      window.open(targetUrl, '_blank');
    } else {
      // Si no hay URL conocida, solo descargamos la imagen
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
    try {
      const blob = await this.generateProgressImage(entrenadoId, options);
      await this.shareToSocialMedia(blob, platform);
    } catch (error) {
      // Propagar sin loguear
      throw error;
    }
  }
}
