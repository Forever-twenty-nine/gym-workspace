import { Component, OnInit, inject, computed, Signal, signal } from '@angular/core';
import { IonContent, IonButton, IonIcon, AlertController, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { RutinaService } from '../../core/services/rutina.service';
import { UserService } from '../../core/services/user.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { Entrenado, TipoEntrenamiento } from 'gym-library';

import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';
import { ProximosEntrenadosComponent } from './components/proximos-entrenados/proximos-entrenados.component';
import { BackgroundComponent } from '../../shared/components/background/background.component';
import { TiposEntrenamientoListComponent } from '../../shared/components/tipos-entrenamiento-list/tipos-entrenamiento-list.component';
import { TipoEntrenamientoModalComponent } from '../../shared/components/tipo-entrenamiento-modal/tipo-entrenamiento-modal.component';
import { TipoEntrenamientoService } from '../../core/services/tipo-entrenamiento.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    ProximosEntrenadosComponent,
    BackgroundComponent,
    TiposEntrenamientoListComponent,
    TipoEntrenamientoModalComponent
  ],
})
export class DashboardPage implements OnInit {
  private authService = inject(AuthService);
  private entrenadoService = inject(EntrenadoService);
  private rutinaService = inject(RutinaService);
  private userService = inject(UserService);
  private entrenadorService = inject(EntrenadorService);
  private rutinaAsignadaService = inject(RutinaAsignadaService);
  private tipoEntrenamientoService = inject(TipoEntrenamientoService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  readonly tipos = this.tipoEntrenamientoService.tipos;

  isModalOpen = signal(false);
  modalData = signal<TipoEntrenamiento | null>(null);
  isCreating = signal(false);


  entrenador = computed(() => {
    const user = this.authService.currentUser();
    return user ? { nombre: user.nombre || 'Entrenador', plan: user.plan ? `Plan ${user.plan}` : 'Plan Básico' } : { nombre: 'Entrenador', plan: 'Plan Básico' };
  });

  entrenadosAsociados: Signal<Entrenado[]> = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    return entrenadorId ? this.entrenadoService.entrenados().filter(e => e.entrenadoresId?.includes(entrenadorId)) : [];
  });

  entrenadosConRutinasProximas = computed(() => {
    const entrenadorId = this.authService.currentUser()?.uid;
    if (!entrenadorId) return [];

    const entrenados = this.entrenadosAsociados();
    const asignaciones = this.rutinaAsignadaService.getRutinasAsignadasByEntrenador(entrenadorId)();

    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + 3);
    limite.setHours(23, 59, 59, 999);

    const proximoMapa = new Map<string, any>();

    for (const entrenado of entrenados) {
      const asignacionesEntrenado = asignaciones.filter(a => a.entrenadoId === entrenado.id && a.activa);

      for (const asig of asignacionesEntrenado) {
        const fechaObj = this.calcularFecha(asig, hoy);
        if (fechaObj && fechaObj >= hoy && fechaObj <= limite) {
          const existing = proximoMapa.get(entrenado.id!);
          if (!existing || fechaObj < existing.proximaFecha) {
            const rutina = this.rutinaService.rutinas().find(r => r.id === asig.rutinaId);
            proximoMapa.set(entrenado.id!, {
              ...entrenado,
              proximaFecha: fechaObj,
              nombreRutina: rutina?.nombre || 'Rutina',
              diaTexto: this.getDiaTexto(fechaObj, hoy)
            });
          }
        }
      }
    }

    return Array.from(proximoMapa.values()).sort((a, b) => a.proximaFecha.getTime() - b.proximaFecha.getTime());
  });

  constructor() {
    addIcons({ add });
    this.entrenadorService.initializeListener();
    this.entrenadoService.initializeListener();
    this.rutinaService.rutinas;
    this.rutinaAsignadaService.getRutinasAsignadas();
  }

  private calcularFecha(asig: any, hoy: Date): Date | null {
    if (asig.fechaEspecifica) return new Date(asig.fechaEspecifica);
    if (asig.diaSemana) {
      const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
      const targetDow = dias.indexOf(asig.diaSemana.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
      if (targetDow === -1) return null;
      const ref = new Date(hoy);
      const diff = (targetDow - ref.getDay() + 7) % 7;
      const proxima = new Date(ref);
      proxima.setDate(ref.getDate() + diff);
      proxima.setHours(0, 0, 0, 0);
      return proxima;
    }
    return null;
  }

  private getDiaTexto(fecha: Date, hoy: Date): string {
    const diff = Math.floor((fecha.getTime() - new Date(hoy).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    if (diff === 2) return 'Pasado mañana';
    return fecha.toLocaleDateString('es-ES', { weekday: 'long' });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user?.gimnasioId) {
      this.tipoEntrenamientoService.initializeListener(user.gimnasioId);
    }
  }

  crearTipo() {
    this.isCreating.set(true);
    this.modalData.set(null);
    this.isModalOpen.set(true);
  }

  editarTipo(tipo: TipoEntrenamiento) {
    this.isCreating.set(false);
    this.modalData.set(tipo);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.modalData.set(null);
  }

  async saveChanges(nombre: string) {
    const user = this.authService.currentUser();
    if (!user || !user.gimnasioId) return;

    try {
      const data = this.modalData();
      const duplicate = this.tipos().some(t => t.nombre.toLowerCase() === nombre.toLowerCase() && (!data || t.id !== data.id));
      if (duplicate) {
        this.showToast('Este tipo de entrenamiento ya existe', 'warning');
        return;
      }

      if (this.isCreating()) {
        const nuevoTipo: TipoEntrenamiento = {
          id: '',
          nombre,
          gimnasioId: user.gimnasioId,
          fechaCreacion: new Date()
        };
        await this.tipoEntrenamientoService.save(nuevoTipo);
        this.showToast('¡Tipo de entrenamiento creado!', 'success');
      } else if (data) {
        const tipoActualizado: TipoEntrenamiento = {
          ...data,
          nombre
        };
        await this.tipoEntrenamientoService.save(tipoActualizado);
        this.showToast('¡Tipo de entrenamiento actualizado!', 'success');
      }
      this.closeModal();
    } catch (e) {
      console.error(e);
      this.showToast('Error al guardar cambios', 'danger');
    }
  }

  async eliminarTipo(tipo: TipoEntrenamiento) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar Tipo',
      message: `¿Estás seguro de que deseas eliminar "${tipo.nombre}"? Esto no afectará a los encuentros ya programados.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.tipoEntrenamientoService.delete(tipo.id);
              this.showToast('Tipo de entrenamiento eliminado', 'success');
            } catch (e) {
              console.error(e);
              this.showToast('Error al eliminar', 'danger');
            }
          }
        }
      ],
      cssClass: 'premium-alert'
    });
    await alert.present();
  }

  async cargarPredeterminados() {
    const user = this.authService.currentUser();
    if (!user || !user.gimnasioId) return;

    try {
      await this.tipoEntrenamientoService.loadDefaultTypes(user.gimnasioId);
      this.showToast('Tipos predeterminados cargados correctamente', 'success');
    } catch (e) {
      console.error(e);
      this.showToast('Error al cargar tipos predeterminados', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top',
      cssClass: 'premium-toast'
    });
    await toast.present();
  }

  getUserName(userId: string): string {
    const users = this.userService.users();
    const user = users.find(u => u.uid === userId);
    return user ? user.nombre || 'Sin nombre' : 'Usuario no encontrado';
  }
}