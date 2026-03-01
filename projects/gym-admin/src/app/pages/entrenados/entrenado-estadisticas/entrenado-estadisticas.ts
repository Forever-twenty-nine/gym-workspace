import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Rutina, SesionRutina } from 'gym-library';
import { SesionRutinaService } from '../../../services/sesion-rutina.service';
import { RutinaService } from '../../../services/rutina.service';
import { SocialShareService } from '../../../services/social-share.service';

@Component({
  selector: 'app-entrenado-estadisticas',
  imports: [DatePipe, RouterModule],
  templateUrl: './entrenado-estadisticas.html',
  host: {
    '(document:click)': 'onDocumentClick()',
    '(keydown.escape)': 'cerrarMenuCompartir()'
  }
})
export class EntrenadoEstadisticas {
  private readonly route = inject(ActivatedRoute);
  private readonly sesionRutinaService = inject(SesionRutinaService);
  private readonly rutinaService = inject(RutinaService);
  private readonly socialShareService = inject(SocialShareService);

  readonly entrenadoId = computed(() => this.route.snapshot.paramMap.get('id') ?? '');
  readonly compartiendoEstadisticas = signal(false);
  readonly mostrarMenuCompartir = signal(false);

  // Estadísticas calculadas desde las sesiones de rutinas
  readonly estadisticas = computed(() => {
    const id = this.entrenadoId();
    const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(id)();

    // Calcular estadísticas desde las sesiones
    const sesionesCompletadas = sesiones.filter(s => s.completada);
    const totalRutinasCompletadas = sesionesCompletadas.length;

    // Calcular racha actual (días consecutivos con al menos una sesión completada)
    const rachaActual = this.calcularRachaActual(sesionesCompletadas);

    // Calcular experiencia total (cada sesión completada da XP)
    const experiencia = sesionesCompletadas.length * 10; // 10 XP por rutina completada

    // Calcular nivel basado en XP
    const nivel = Math.floor(experiencia / 100) + 1; // Nivel cada 100 XP

    return {
      totalRutinasCompletadas,
      rachaActual,
      experiencia,
      nivel
    };
  });

  readonly rutinasCompletadasConNombre = computed(() => {
    const id = this.entrenadoId();
    // Buscar todas las sesiones completadas de este entrenado
    const sesiones = this.sesionRutinaService.getSesionesPorEntrenado(id)().filter(s => s.completada);
    return sesiones.map((sesion: SesionRutina) => {
      const rutina = this.rutinaService.getRutina(sesion.rutinaResumen.id)();
      return {
        ...sesion,
        nombre: sesion.rutinaResumen.nombre,
        descripcion: rutina?.descripcion || '',
        fechaFin: sesion.fechaFin ? (sesion.fechaFin as any).toDate() : new Date(),
      };
    });
  });

  private calcularRachaActual(sesionesCompletadas: SesionRutina[]): number {
    if (sesionesCompletadas.length === 0) return 0;

    // Ordenar sesiones por fecha de finalización descendente
    const sesionesOrdenadas = sesionesCompletadas
      .filter(s => s.fechaFin)
      .sort((a, b) => new Date(b.fechaFin!).getTime() - new Date(a.fechaFin!).getTime());

    if (sesionesOrdenadas.length === 0) return 0;

    let racha = 1;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Verificar si hay sesión completada hoy
    const ultimaSesion = sesionesOrdenadas[0];
    const fechaUltima = new Date(ultimaSesion.fechaFin!);
    fechaUltima.setHours(0, 0, 0, 0);

    if (fechaUltima.getTime() !== hoy.getTime()) {
      // No hay sesión completada hoy, verificar si fue ayer
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);

      if (fechaUltima.getTime() !== ayer.getTime()) {
        return 0; // Racha rota
      }
    }

    // Contar días consecutivos
    for (let i = 1; i < sesionesOrdenadas.length; i++) {
      const fechaActual = new Date(sesionesOrdenadas[i].fechaFin!);
      fechaActual.setHours(0, 0, 0, 0);

      const fechaAnterior = new Date(sesionesOrdenadas[i - 1].fechaFin!);
      fechaAnterior.setHours(0, 0, 0, 0);

      const diferenciaDias = Math.floor((fechaAnterior.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24));

      if (diferenciaDias === 1) {
        racha++;
      } else {
        break; // Racha rota
      }
    }

    return racha;
  }

  async compartirEstadisticas(platform: 'instagram' | 'facebook' | 'twitter' | 'whatsapp') {
    if (this.compartiendoEstadisticas()) return;

    const id = this.entrenadoId();
    if (!id) {
      console.error('❌ No hay entrenadoId disponible');
      alert('No se puede compartir: falta el ID del entrenado');
      return;
    }

    console.log('🚀 Iniciando compartir estadísticas para entrenadoId:', id, 'en', platform);

    // Ocultar menú al iniciar
    this.mostrarMenuCompartir.set(false);
    this.compartiendoEstadisticas.set(true);

    try {
      console.log('📊 Llamando a socialShareService.generateAndShare...');
      await this.socialShareService.generateAndShare(
        id,
        platform,
        {
          includeStats: true,
          includeLevel: false,
          includeStreak: false,
          includeLast7Days: true
        }
      );
      console.log('✅ Estadísticas compartidas exitosamente en', platform);
      alert('¡Imagen generada y compartida/descargada!');
    } catch (error) {
      console.error('❌ Error al compartir estadísticas:', error);
      alert(`Error al compartir: ${error}`);
    } finally {
      this.compartiendoEstadisticas.set(false);
    }
  }  // Control del menú de compartir
  toggleMenuCompartir(event?: Event) {
    if (event) event.stopPropagation();
    if (this.compartiendoEstadisticas()) return;
    this.mostrarMenuCompartir.update(v => !v);
  }

  cerrarMenuCompartir() {
    this.mostrarMenuCompartir.set(false);
  }

  onDocumentClick() {
    this.cerrarMenuCompartir();
  }
}
