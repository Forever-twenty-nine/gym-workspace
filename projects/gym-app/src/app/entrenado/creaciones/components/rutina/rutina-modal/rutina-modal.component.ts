import { Component, Input, Output, EventEmitter, inject, signal, computed, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonItem, IonLabel, IonModal, IonButtons, IonInput, IonTextarea, IonCheckbox, IonList, IonSelect, IonSelectOption, ToastController, IonPopover } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, saveOutline, barbellOutline, add, helpCircleOutline } from 'ionicons/icons';
import { RutinaService } from '../../../../../core/services/rutina.service';
import { EntrenadoService } from '../../../../../core/services/entrenado.service';
import { EjercicioService } from '../../../../../core/services/ejercicio.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { RutinaAsignadaService } from '../../../../../core/services/rutina-asignada.service';

@Component({
  selector: 'app-rutina-modal',
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
    IonModal,
    IonButtons,
    IonInput,
    IonTextarea,
    IonCheckbox,
    IonList,
    IonPopover,
    IonSelect,
    IonSelectOption
],
  templateUrl: './rutina-modal.component.html'
})
export class RutinaModalComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private rutinaService = inject(RutinaService);
  private entrenadoService = inject(EntrenadoService);
  private ejercicioService = inject(EjercicioService);
  private rutinaAsignadaService = inject(RutinaAsignadaService);
  private toastCtrl = inject(ToastController);

  @Input() isOpen = false;
  @Input() item: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  saving = signal(false);
  selectedIds = signal<string[]>([]);
  isEditing = false;

  form: FormGroup;

  ejercicios = computed(() => {
    const user = this.authService.currentUser();
    const uid = user?.uid;
    if (!uid) return [];

    const entrenado = this.entrenadoService.getEntrenado(uid)();
    const ownIds = new Set<string>(entrenado?.ejerciciosCreadosIds || []);

    this.ejercicioService.ejercicios().forEach(e => {
      if (e.creadorId === uid) ownIds.add(e.id);
    });

    return this.ejercicioService.ejercicios().filter(e => ownIds.has(e.id));
  });

  // Semana comienza en Lunes (estándar en la mayoría de países de habla hispana)
  // Usado para ordenar los días al cargar/guardar
  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  constructor() {
    addIcons({ close, saveOutline, barbellOutline, add, helpCircleOutline });

    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.maxLength(300)]],
      diasSemana: [[]]
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['item'] && this.item) {
      this.loadItemForEdit();
    }
    // When opening for creation (isOpen true, no item), ensure clean state
    if (changes['isOpen'] && this.isOpen && !this.item) {
      this.isEditing = false;
      this.selectedIds.set([]);
      this.form.reset({ diasSemana: [] });
    }
  }

  private loadItemForEdit() {
    if (!this.item) return;
    this.isEditing = true;

    const order = this.diasSemana;
    const dias = (this.item.diasSemana || []).slice();
    dias.sort((a: string, b: string) => order.indexOf(a) - order.indexOf(b));

    this.form.patchValue({
      nombre: this.item.nombre || '',
      descripcion: this.item.descripcion || '',
      diasSemana: dias
    });

    if (this.item.ejerciciosIds) {
      this.selectedIds.set(this.item.ejerciciosIds);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggleEjercicio(id: string) {
    const current = this.selectedIds();
    if (current.includes(id)) {
      this.selectedIds.set(current.filter(x => x !== id));
    } else {
      this.selectedIds.set([...current, id]);
    }
  }

  onDiasChange(event: any) {
    const value: string[] = event?.detail?.value ?? [];
    this.form.get('diasSemana')?.setValue(value);
  }

  closeModal() {
    this.close.emit();
    this.isEditing = false;
    this.form.reset({ diasSemana: [] });
    this.selectedIds.set([]);
  }

  async guardar() {
    if (this.form.invalid || this.saving()) return;

    const user = this.authService.currentUser();
    if (!user) {
      this.showToast('Debes iniciar sesión', 'danger');
      return;
    }

    const uid = user.uid;

    this.saving.set(true);
    try {
      const formValue = this.form.value;

      const order = this.diasSemana;
      const dias = (formValue.diasSemana || []).slice();
      dias.sort((a: string, b: string) => order.indexOf(a) - order.indexOf(b));

      let rutinaData: any;

      if (this.isEditing && this.item) {
        rutinaData = {
          ...this.item,
          nombre: (formValue.nombre || '').trim(),
          descripcion: (formValue.descripcion || '').trim(),
          ejerciciosIds: this.selectedIds(),
          diasSemana: dias,
        };
      } else {
        rutinaData = {
          id: 'rut-' + Date.now(),
          nombre: (formValue.nombre || '').trim(),
          descripcion: (formValue.descripcion || '').trim(),
          ejerciciosIds: this.selectedIds(),
          diasSemana: dias,
          creadorId: uid,
          asignadoIds: []
        };
      }

      await this.rutinaService.save(rutinaData);

      if (!this.isEditing) {
        await this.entrenadoService.addRutinaCreada(uid, rutinaData.id);

        // Crear asignaciones explícitas para que aparezcan en la vista semanal
        // y sean consistentes con el sistema de RutinaAsignada (notificaciones, etc.)
        for (const dia of dias) {
          try {
            await this.rutinaAsignadaService.save({
              id: `asig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              rutinaId: rutinaData.id,
              entrenadoId: uid,
              entrenadorId: uid, // auto-asignada por el propio usuario
              diaSemana: dia,
              fechaAsignacion: new Date(),
              activa: true
            });
          } catch (e) {
            console.warn('No se pudo crear asignación para día', dia, e);
          }
        }
      }

      this.showToast(this.isEditing ? 'Rutina actualizada' : 'Rutina creada con éxito', 'success');
      this.saved.emit();
      this.closeModal();
    } catch (e) {
      console.error(e);
      this.showToast(this.isEditing ? 'Error al actualizar la rutina' : 'Error al crear la rutina', 'danger');
    } finally {
      this.saving.set(false);
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
