import { Component, Input, Output, EventEmitter, inject, OnInit, signal } from '@angular/core';
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
  IonModal,
  IonButtons,
  IonInput,
  IonTextarea,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, sparkles, paperPlaneOutline, helpCircleOutline, chevronDownOutline, chevronUpOutline } from 'ionicons/icons';
import { ConvocatoriaService } from '../../../../../../core/services/convocatoria.service';
import { AuthService } from '../../../../../../core/services/auth.service';
import { Convocatoria } from 'gym-library';

@Component({
  selector: 'app-crear-convocatoria-modal',
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
    IonTextarea
  ],
  templateUrl: './crear-convocatoria-modal.component.html'
})
export class CrearConvocatoriaModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private convocatoriaService = inject(ConvocatoriaService);
  private toastCtrl = inject(ToastController);

  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  diaSeleccionado: 'hoy' | 'manana' | 'custom' = 'hoy';
  fechaSeleccionada: Date = new Date();
  mostrarAyuda = signal(false);

  constructor() {
    addIcons({ close, sparkles, paperPlaneOutline, helpCircleOutline, chevronDownOutline, chevronUpOutline });
    
    const ahora = new Date();
    const horaInicioStr = this.padZero(ahora.getHours()) + ':' + this.padZero(ahora.getMinutes());
    
    ahora.setMinutes(ahora.getMinutes() + 90);
    const horaFinStr = this.padZero(ahora.getHours()) + ':' + this.padZero(ahora.getMinutes());

    this.form = this.fb.group({
      fechaCustom: [''],
      horaInicio: [horaInicioStr, [Validators.required]],
      horaFin: [horaFinStr, [Validators.required]],
      mensaje: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit() {
    this.actualizarFechaPorDia();
  }

  private padZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  seleccionarDia(dia: 'hoy' | 'manana') {
    this.diaSeleccionado = dia;
    this.form.get('fechaCustom')?.setValue('');
    this.actualizarFechaPorDia();
  }

  onFechaCustomChange() {
    const val = this.form.get('fechaCustom')?.value;
    if (val) {
      this.diaSeleccionado = 'custom';
      const [year, month, day] = val.split('-').map(Number);
      this.fechaSeleccionada = new Date(year, month - 1, day);
    } else {
      this.seleccionarDia('hoy');
    }
  }

  toggleAyuda() {
    this.mostrarAyuda.update(v => !v);
  }

  private actualizarFechaPorDia() {
    const d = new Date();
    if (this.diaSeleccionado === 'manana') {
      d.setDate(d.getDate() + 1);
    }
    this.fechaSeleccionada = d;
  }

  closeModal() {
    this.close.emit();
  }

  async guardar() {
    if (this.form.invalid) return;

    const user = this.authService.currentUser();
    if (!user) {
      this.showToast('Debes iniciar sesión para publicar', 'danger');
      return;
    }

    const gimnasioId = user.gimnasioId;
    if (!gimnasioId) {
      this.showToast('Debes tener un gimnasio asignado para publicar', 'danger');
      return;
    }

    const formValue = this.form.value;
    
    const [hStart, mStart] = formValue.horaInicio.split(':').map(Number);
    const [hEnd, mEnd] = formValue.horaFin.split(':').map(Number);
    const startMins = hStart * 60 + mStart;
    const endMins = hEnd * 60 + mEnd;

    if (startMins >= endMins) {
      this.showToast('La hora de inicio debe ser anterior a la hora de fin', 'warning');
      return;
    }

    try {
      const nuevaConvocatoria: Convocatoria = {
        id: 'cv-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        creadorId: user.uid,
        creadorNombre: user.nombre || 'Atleta',
        creadorFoto: user.photoURL || null,
        gimnasioId: gimnasioId,
        fechaCreacion: new Date(),
        fechaEntrenamiento: this.fechaSeleccionada,
        horaInicio: formValue.horaInicio,
        horaFin: formValue.horaFin,
        mensaje: formValue.mensaje || '',
        interesados: [],
        activo: true
      };

      await this.convocatoriaService.save(nuevaConvocatoria);
      
      this.showToast('¡Convocatoria publicada con éxito!', 'success');
      this.saved.emit();
      this.close.emit();
      this.form.patchValue({ mensaje: '' });
    } catch (e) {
      console.error(e);
      this.showToast('Error al publicar convocatoria', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      color,
      position: 'top'
    });
    await toast.present();
  }
}
