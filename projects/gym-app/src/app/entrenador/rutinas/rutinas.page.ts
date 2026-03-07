import { Component, OnInit, inject, computed, Signal, signal } from '@angular/core';
import {
  IonContent,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fitnessOutline, close, add, pencil, trash, barbell, informationCircleOutline, lockClosed } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { RutinaService } from '../../core/services/rutina.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';
import { ListaRutinasComponent } from './components/lista-rutinas/lista-rutinas.component';
import { AccionesRutinaComponent } from './components/acciones-rutina/acciones-rutina.component';
import { RutinaModalComponent } from './components/rutina-modal/rutina-modal.component';

@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.page.html',
  standalone: true,
  imports: [
    IonContent,
    HeaderTabsComponent,
    ListaRutinasComponent,
    AccionesRutinaComponent,
    RutinaModalComponent
  ],
  styles: []
})
export class RutinasPage implements OnInit {
  private authService = inject(AuthService);
  private rutinaService = inject(RutinaService);
  private entrenadorService = inject(EntrenadorService);
  private toastController = inject(ToastController);

  // --- Señales Datos ---
  rutinasCreadas: Signal<any[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadorService.getRutinasByEntrenador(entrenadorId)() : [];
  });

  ejerciciosCreados: Signal<any[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadorService.getEjerciciosByEntrenador(entrenadorId)() : [];
  });

  // --- Señales Límites de Plan ---
  hasReachedRutinaLimit = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return false;
    const limits = this.entrenadorService.getLimits(entrenadorId);
    return this.rutinasCreadas().length >= limits.maxRoutines;
  });

  rutinaLimitMessage = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return '';
    const limits = this.entrenadorService.getLimits(entrenadorId);
    return `Rutinas creadas: ${this.rutinasCreadas().length}/${limits.maxRoutines}`;
  });

  // --- Señales UI ---
  isRutinaModalOpen = signal(false);
  rutinaSeleccionada = signal<any | null>(null);
  isRutinaCreating = signal(false);

  constructor() {
    addIcons({ fitnessOutline, close, add, pencil, trash, barbell, informationCircleOutline, lockClosed });
  }

  ngOnInit() { }

  verRutina(rutina: any) {
    this.rutinaSeleccionada.set(rutina);
    this.isRutinaCreating.set(false);
    this.isRutinaModalOpen.set(true);
  }

  crearRutina() {
    this.rutinaSeleccionada.set(null);
    this.isRutinaCreating.set(true);
    this.isRutinaModalOpen.set(true);
  }

  closeRutinaModal() {
    this.isRutinaModalOpen.set(false);
  }

  async saveRutinaChanges(formValue: any) {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return;

    // Validación de límite solo si es nueva
    if (this.isRutinaCreating() && this.hasReachedRutinaLimit()) {
      this.mostrarToast('Límite de rutinas alcanzado para tu plan.', 'warning');
      return;
    }

    try {
      const dataToSave = {
        ...(this.rutinaSeleccionada() || this.createInitialRutinaData(entrenadorId)),
        ...formValue,
        fechaModificacion: new Date()
      };

      await this.rutinaService.save(dataToSave);

      if (this.isRutinaCreating()) {
        await this.entrenadorService.addRutinaCreada(entrenadorId, dataToSave.id);
      }

      this.closeRutinaModal();
      this.mostrarToast(this.isRutinaCreating() ? 'Rutina creada' : 'Cambios guardados', 'success');
    } catch (error) {
      console.error('Error guardando rutina:', error);
      this.mostrarToast('Error al guardar la rutina', 'danger');
    }
  }

  async deleteRutina(id: string) {
    try {
      await this.rutinaService.delete(id);
      this.mostrarToast('Rutina eliminada', 'success');
    } catch (error) {
      console.error('Error eliminando rutina:', error);
      this.mostrarToast('Error al eliminar la rutina', 'danger');
    }
  }

  private createInitialRutinaData(entrenadorId: string) {
    return {
      id: 'r' + Date.now(),
      creadorId: entrenadorId,
      asignadoIds: [],
      activa: true,
      completado: false,
      fechaCreacion: new Date()
    };
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
