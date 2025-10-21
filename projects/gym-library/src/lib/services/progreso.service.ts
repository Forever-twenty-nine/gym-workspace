import { Injectable, computed, Signal, inject } from '@angular/core';
import { EntrenadoService } from './entrenado.service';
import { EstadisticasEntrenadoService } from './estadisticas-entrenado.service';
import { Entrenado } from '../models/entrenado.model';
import { SesionRutina } from '../models/sesion-rutina.model';
import { EstadisticasEntrenado } from '../models/estadisticas-entrenado.model';
import { uuidv4 } from '../utils/uuid';

@Injectable({ providedIn: 'root' })
export class ProgresoService {
    private readonly entrenadoService = inject(EntrenadoService);
    private readonly estadisticasService = inject(EstadisticasEntrenadoService);
    // private readonly progresoRutinaService = inject(ProgresoRutinaService);

    // Configuración de sistema de niveles
    private readonly XP_BASE = 100; // XP necesario para nivel 1
    private readonly XP_MULTIPLICADOR = 1.5; // Multiplicador por nivel

    // Aquí puedes agregar métodos nuevos basados solo en sesiones y estadísticas
}
