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
  IonModal,
  IonButtons,
  IonInput,
  IonTextarea,
  ToastController,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, close, saveOutline, trashOutline, pencilOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { EjercicioService } from '../../core/services/ejercicio.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { HeaderTabsComponent } from '../../shared/components/header-tabs/header-tabs.component';
import { Ejercicio } from 'gym-library';

@Component({
  selector: 'app-ejercicios-premium',
  templateUrl: './ejercicios-premium.page.html',
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
    IonModal,
    IonButtons,
    IonInput,
    IonTextarea,
    IonFab,
    IonFabButton,
    HeaderTabsComponent
  ]
})
export class EjerciciosPremiumPage implements OnInit {
  private authService = inject(AuthService);
  private ejercicioService = inject(EjercicioService);
  private entrenadoService = inject(EntrenadoService);
  private fb = inject(FormBuilder);
  private toastController = inject(ToastController);

  readonly userId = computed(() => this.authService.currentUser()?.uid);
  
  ejerciciosCreados = computed(() => {
    const uid = this.userId();
    if (!uid) return [];
    const entrenado = this.entrenadoService.getEntrenado(uid)();
    const ids = entrenado?.ejerciciosCreadosIds || [];
    return this.ejercicioService.ejercicios().filter(e => ids.includes(e.id));
  });

  isModalOpen = signal(false);
  isCreating = signal(false);
  selectedEjercicio = signal<Ejercicio | null>(null);
  form: FormGroup;

  constructor() {
    addIcons({ add, close, saveOutline, trashOutline, pencilOutline });
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      descripcion: [''],
      series: [3, [Validators.required, Validators.min(1)]],
      repeticiones: [12, [Validators.required, Validators.min(1)]],
      peso: [0],
      descansoSegundos: [60],
      serieSegundos: [0]
    });
  }

  ngOnInit() {}

  nuevoEjercicio() {
    this.isCreating.set(true);
    this.selectedEjercicio.set(null);
    this.form.reset({
      series: 3,
      repeticiones: 12,
      peso: 0,
      descansoSegundos: 60,
      serieSegundos: 0
    });
    this.isModalOpen.set(true);
  }

  editarEjercicio(ejercicio: Ejercicio) {
    this.isCreating.set(false);
    this.selectedEjercicio.set(ejercicio);
    this.form.patchValue(ejercicio);
    this.isModalOpen.set(true);
  }

  async eliminarEjercicio(id: string) {
    try {
      await this.ejercicioService.delete(id);
      const uid = this.userId();
      if (uid) {
        await this.entrenadoService.removeEjercicioCreado(uid, id);
      }
      const toast = await this.toastController.create({
        message: 'Ejercicio eliminado',
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
      
      const ejercicioData: Ejercicio = {
        ...this.selectedEjercicio(),
        ...formValue,
        creadorId: uid,
      };
      
      const isNew = !ejercicioData.id;
      
      if (isNew) {
        ejercicioData.id = 'ej-' + Date.now();
      }

      await this.ejercicioService.save(ejercicioData);

      if (isNew && uid) {
        await this.entrenadoService.addEjercicioCreado(uid, ejercicioData.id);
      }

      this.isModalOpen.set(false);
      const toast = await this.toastController.create({
        message: `Ejercicio ${isNew ? 'creado' : 'actualizado'} con éxito`,
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
}
