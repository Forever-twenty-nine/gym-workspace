import { Component, OnInit, inject, computed, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonItemGroup,
  IonBadge,
  IonModal,
  IonButtons,
  IonInput,
  IonTextarea,
  ToastController,
  IonFab,
  IonFabButton,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, close, saveOutline, trashOutline, pencilOutline, calendarOutline, closeCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { RutinaService } from '../../core/services/rutina.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { RutinaAsignadaService } from '../../core/services/rutina-asignada.service';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';
import { Rutina, Ejercicio, RutinaAsignada } from 'gym-library';

@Component({
  selector: 'app-rutinas-premium',
  templateUrl: './rutinas-premium.page.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonItemGroup,
    IonBadge,
    IonModal,
    IonButtons,
    IonInput,
    IonTextarea,
    IonFab,
    IonFabButton,
    IonSelect,
    IonSelectOption,
    HeaderTabsComponent
  ]
})
export class RutinasPremiumPage implements OnInit {
  private authService = inject(AuthService);
  private rutinaService = inject(RutinaService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private fb = inject(FormBuilder);
  private toastController = inject(ToastController);
  private rutinaAsignadaService = inject(RutinaAsignadaService);

  readonly diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  readonly userId = computed(() => this.authService.currentUser()?.uid);
  
  rutinasPropias = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    // Las rutinas creadas están en entrenado.rutinasCreadas
    const entrenado = this.entrenadoService.getEntrenado(uid)();
    const ids = entrenado?.rutinasCreadas || [];
    return this.rutinaService.rutinas().filter(r => ids.includes(r.id));
  });

  todosLosEjercicios = computed(() => this.ejercicioService.ejercicios());

  asignaciones = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    return this.rutinaAsignadaService.getRutinasAsignadasByEntrenado(uid)();
  });

  isModalOpen = signal(false);
  isCreating = signal(false);
  selectedRutina = signal<Rutina | null>(null);
  form: FormGroup;

  constructor() {
    addIcons({ add, close, saveOutline, trashOutline, pencilOutline, calendarOutline, closeCircleOutline });
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: [''],
      ejerciciosIds: [[]]
    });
  }

  ngOnInit() {}

  nuevaRutina() {
    this.isCreating.set(true);
    this.selectedRutina.set(null);
    this.form.reset({
      ejerciciosIds: []
    });
    this.isModalOpen.set(true);
  }

  editarRutina(rutina: Rutina) {
    this.isCreating.set(false);
    this.selectedRutina.set(rutina);
    this.form.patchValue(rutina);
    this.isModalOpen.set(true);
  }

  async eliminarRutina(id: string) {
    try {
      await this.rutinaService.delete(id);
      const uid = this.userId();
      if (uid) {
        await this.entrenadoService.removeRutinaCreada(uid, id);
      }
      const toast = await this.toastController.create({
        message: 'Rutina eliminada',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (e) {
      console.error(e);
    }
  }

  async guardar() {
    if (this.form.invalid) return;

    try {
      const formValue = this.form.value;
      const uid = this.userId();
      
      const rutinaData: any = {
        ...this.selectedRutina(),
        ...formValue,
        creadorId: uid,
        asignadoIds: []
      };

      const isNew = !rutinaData.id;
      
      if (isNew) {
        rutinaData.id = 'rut-' + Date.now();
      }

      await this.rutinaService.save(rutinaData);

      if (isNew && uid) {
        await this.entrenadoService.addRutinaCreada(uid, rutinaData.id);
      }

      this.isModalOpen.set(false);
      const toast = await this.toastController.create({
        message: `Rutina ${isNew ? 'creada' : 'actualizada'} con éxito`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (e) {
      console.error(e);
    }
  }

  cerrarModal() {
    this.isModalOpen.set(false);
  }

  getDiasAsignados(rutinaId: string): string[] {
    return this.asignaciones()
      .filter(a => a.rutinaId === rutinaId && a.diaSemana)
      .map(a => a.diaSemana!);
  }

  async asignarDia(rutina: Rutina, event: any) {
    const dia = event.detail.value;
    if (!dia) return;

    const uid = this.userId();
    if (!uid) return;

    // Verificar si ya está asignada ese día
    const existe = this.asignaciones().find(a => a.rutinaId === rutina.id && a.diaSemana === dia);
    if (existe) return;

    try {
      const nuevaAsignacion: RutinaAsignada = {
        id: 'asig-' + Date.now(),
        rutinaId: rutina.id,
        entrenadoId: uid,
        entrenadorId: uid, // Se asigna a sí mismo
        diaSemana: dia,
        fechaAsignacion: new Date(),
        activa: true
      };

      await this.rutinaAsignadaService.save(nuevaAsignacion);
      
      const toast = await this.toastController.create({
        message: `Rutina asignada al ${dia}`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (e) {
      console.error(e);
    }
  }

  async quitarDia(rutinaId: string, dia: string) {
    const asig = this.asignaciones().find(a => a.rutinaId === rutinaId && a.diaSemana === dia);
    if (!asig) return;

    try {
      await this.rutinaAsignadaService.delete(asig.id);
      const toast = await this.toastController.create({
        message: `Asignación de ${dia} eliminada`,
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
    } catch (e) {
      console.error(e);
    }
  }

  getNombreEjercicio(id: string): string {
    const ej = this.todosLosEjercicios().find(e => e.id === id);
    return ej ? ej.nombre : 'Ejercicio no encontrado';
  }
}
