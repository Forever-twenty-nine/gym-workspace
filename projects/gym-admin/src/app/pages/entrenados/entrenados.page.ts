import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  EntrenadoService,
  UserService,
  GimnasioService,
  EntrenadorService,
  NotificacionService,
  RutinaService,
  Entrenado,
  Rol,
  Objetivo
} from 'gym-library';
import { ToastService } from '../../services/toast.service';
import { PageTitleService } from '../../services/page-title.service';
import { DisplayHelperService } from '../../services/display-helper.service';
import { EntrenadosTableComponent } from './entrenados-table/entrenados-table.component';@Component({
  selector: 'app-entrenados-page',
  imports: [
    CommonModule,
    EntrenadosTableComponent
  ],
  templateUrl: './entrenados.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntrenadosPage {
  // Servicios inyectados
  private readonly entrenadoService = inject(EntrenadoService);
  private readonly userService = inject(UserService);
  private readonly gimnasioService = inject(GimnasioService);
  private readonly entrenadorService = inject(EntrenadorService);
  private readonly notificacionService = inject(NotificacionService);
  private readonly rutinaService = inject(RutinaService);
  readonly toastService = inject(ToastService);
  private readonly displayHelper = inject(DisplayHelperService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly router = inject(Router);

  // Signals reactivas para datos
  readonly usuarios = computed(() => {
    try {
      const users = this.userService.users();
      if (!Array.isArray(users)) return [];

      return users.map(user => {
        const needsReview = !user.nombre || !user.role;
        return {
          ...user,
          displayName: user.nombre || user.email || `Usuario ${user.uid}`,
          needsReview
        };
      });
    } catch (error) {
      console.error('Error en computed usuarios:', error);
      return [];
    }
  });

  readonly entrenadores = computed(() => {
    try {
      const entrenadoresList = this.entrenadorService.entrenadores();
      const usuariosList = this.usuarios();

      if (!Array.isArray(entrenadoresList)) return [];
      if (!Array.isArray(usuariosList)) return [];

      return entrenadoresList.map(entrenador => {
        const usuario = usuariosList.find(u => u.uid === entrenador.id);
        return {
          ...entrenador,
          displayName: usuario?.nombre || usuario?.email || `Entrenador ${entrenador.id}`
        };
      });
    } catch (error) {
      console.error('Error en computed entrenadores:', error);
      return [];
    }
  });

  readonly gimnasios = computed(() => {
    try {
      const gimnasiosList = this.gimnasioService.gimnasios();
      if (!Array.isArray(gimnasiosList)) return [];

      return gimnasiosList.map(gimnasio => ({
        ...gimnasio,
        displayName: gimnasio.nombre || `Gimnasio ${gimnasio.id}`
      }));
    } catch (error) {
      console.error('Error en computed gimnasios:', error);
      return [];
    }
  });

  readonly entrenados = computed(() => {
    try {
      const entrenadosList = this.entrenadoService.entrenados();
      const usuariosList = this.usuarios();
      const entrenadoresList = this.entrenadores();
      const gimnasiosList = this.gimnasios();

      if (!Array.isArray(entrenadosList) || !Array.isArray(usuariosList) || !Array.isArray(entrenadoresList) || !Array.isArray(gimnasiosList)) {
        return [];
      }

      return entrenadosList.map(entrenado => {
        try {
          const usuario = usuariosList.find(u => u.uid === entrenado.id);
          const entrenadorId = entrenado.entrenadoresId?.[0]; // Tomar el primer entrenador
          const entrenador = entrenadoresList.find(e => e.id === entrenadorId);
          const gimnasio = gimnasiosList.find(g => g.id === usuario?.gimnasioId);

          return {
            id: entrenado.id,
            displayName: usuario?.displayName || usuario?.nombre || 'Sin nombre',
            entrenadorName: entrenador?.displayName || 'Sin entrenador',
            gimnasioName: gimnasio?.displayName || 'Sin gimnasio',
            objetivo: usuario?.role === 'entrenado' ? (usuario as any).objetivo : undefined,
            fechaRegistro: entrenado.fechaRegistro
          };
        } catch (error) {
          console.error(`Error procesando entrenado ${entrenado.id}:`, error);
          return {
            id: entrenado.id,
            displayName: 'Error',
            entrenadorName: 'Error',
            gimnasioName: 'Error'
          };
        }
      });
    } catch (error) {
      console.error('Error en computed entrenados:', error);
      return [];
    }
  });

  // Rutinas del sistema
  readonly rutinas = computed(() => {
    try {
      const rutinasList = this.rutinaService.rutinas();
      if (!Array.isArray(rutinasList)) return [];
      return rutinasList;
    } catch (error) {
      console.error('Error en computed rutinas:', error);
      return [];
    }
  });

  // Signals para el estado del componente
  readonly isLoading = signal(false);

  constructor() {
    this.pageTitleService.setTitle('Entrenados');
    
    // Inicializar los listeners para cargar datos al inicio
    this.entrenadorService.initializeListener();
    this.entrenadoService.initializeListener();
  }

  viewDetails(item: any) {
    // Navegar a la página de detalle del entrenado
    this.router.navigate(['/entrenados/detalle', item.id]);
  }

  getObjetivosDisponibles() {
    return Object.values(Objetivo).map(objetivo => ({
      value: objetivo,
      label: objetivo
    }));
  }
}
