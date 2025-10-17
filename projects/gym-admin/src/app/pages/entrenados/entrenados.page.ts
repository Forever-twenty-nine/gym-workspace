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
    return this.userService.users().map(user => {
      const needsReview = !user.nombre || !user.role;
      return {
        ...user,
        displayName: user.nombre || user.email || `Usuario ${user.uid}`,
        needsReview
      };
    });
  });

  readonly entrenadores = computed(() => {
    return this.entrenadorService.entrenadores().map(entrenador => {
      const usuario = this.usuarios().find(u => u.uid === entrenador.id);
      return {
        ...entrenador,
        displayName: usuario?.nombre || usuario?.email || `Entrenador ${entrenador.id}`
      };
    });
  });

  readonly gimnasios = computed(() => {
    return this.gimnasioService.gimnasios().map(gimnasio => ({
      ...gimnasio,
      displayName: gimnasio.nombre || `Gimnasio ${gimnasio.id}`
    }));
  });

  readonly entrenados = computed(() => {
    return this.entrenadoService.entrenados().map(entrenado => {
      const usuario = this.usuarios().find(u => u.uid === entrenado.id);
      const entrenadorId = entrenado.entrenadoresId?.[0]; // Tomar el primer entrenador
      const entrenador = entrenadorId ? this.entrenadores().find(e => e.id === entrenadorId) : null;
      const entrenadorName = entrenador?.displayName || (entrenadorId ? `Entrenador ${entrenadorId}` : 'Sin asignar');
      
      return {
        ...entrenado,
        displayName: usuario?.nombre || usuario?.email || `Entrenado ${entrenado.id}`,
        entrenadorName
      };
    });
  });

  // Rutinas del sistema
  readonly rutinas = computed(() => {
    return this.rutinaService.rutinas();
  });

  // Signals para el estado del componente
  readonly isLoading = signal(false);

  constructor() {
    this.pageTitleService.setTitle('Entrenados');
    
    // Inicializar el listener de entrenadores (necesario para las listas desplegables)
    this.entrenadorService.initializeListener();
  }

  viewDetails(item: any) {
    // Navegar a la página de detalle del entrenado
    this.router.navigate(['/entrenados', item.id]);
  }

  getObjetivosDisponibles() {
    return Object.values(Objetivo).map(objetivo => ({
      value: objetivo,
      label: objetivo
    }));
  }
}
