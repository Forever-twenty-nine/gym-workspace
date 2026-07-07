import { Component, Input, Output, EventEmitter, inject, OnInit, SimpleChanges, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonSegment,
  IonSegmentButton,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { ConvocatoriaService } from '../../../../core/services/convocatoria.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TipoEntrenamientoService } from '../../../../core/services/tipo-entrenamiento.service';
import { Convocatoria, Rol } from 'gym-library';
import { BackgroundComponent } from '../../../../shared/components/background/background.component';
import { EditModalComponent } from '../../../../shared/components/edit-modal/edit-modal.component';

@Component({
  selector: 'app-crear-agenda-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    EditModalComponent,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonSegment,
    IonSegmentButton,
    BackgroundComponent
  ],
  templateUrl: './crear-agenda-modal.component.html'
})
export class CrearAgendaModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private convocatoriaService = inject(ConvocatoriaService);
  private tipoEntrenamientoService = inject(TipoEntrenamientoService);
  private toastCtrl = inject(ToastController);

  readonly tiposDisponibles = computed(() => {
    const list = this.tipoEntrenamientoService.tipos();
    if (list.length > 0) {
      return list;
    }
    // Fallback con opciones predeterminadas
    const defaultNames = [
      'WOD del Día',
      'Entrenamiento Semanal',
      'Fuerza y Técnica',
      'Cardio Acondicionamiento',
      'Clase Especial'
    ];
    return defaultNames.map(name => ({ id: name, nombre: name, gimnasioId: '' }));
  });

  @Input() isOpen = false;
  @Input() convocatoria: Convocatoria | null = null;
  @Input() isCreating = true;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  form: FormGroup;
  diaSeleccionado: 'hoy' | 'manana' | 'custom' = 'hoy';
  fechaSeleccionada: Date = new Date();

  constructor() {
    ;
    
    const ahora = new Date();
    const horaInicioStr = this.padZero(ahora.getHours()) + ':' + this.padZero(ahora.getMinutes());
    
    ahora.setMinutes(ahora.getMinutes() + 90);
    const horaFinStr = this.padZero(ahora.getHours()) + ':' + this.padZero(ahora.getMinutes());

    this.form = this.fb.group({
      tipo: ['WOD del Día', [Validators.required]],
      tituloSesion: ['', [Validators.required, Validators.maxLength(50)]],
      fechaCustom: [''],
      horaInicio: [horaInicioStr, [Validators.required]],
      horaFin: [horaFinStr, [Validators.required]],
      mensaje: ['', [Validators.required, Validators.maxLength(500)]], // WOD details are required for coach
      esSemanal: [false]
    });
  }

  ngOnInit() {
    this.actualizarFechaPorDia();
    const user = this.authService.currentUser();
    if (user?.gimnasioId) {
      this.tipoEntrenamientoService.initializeListener(user.gimnasioId);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']?.currentValue) {
      if (!this.isCreating && this.convocatoria) {
        this.populateForm(this.convocatoria);
      } else {
        this.resetForm();
      }
    }
  }

  private populateForm(conv: Convocatoria) {
    let tipo = 'WOD del Día';
    let tituloSesion = conv.titulo || '';
    if (tituloSesion.includes(':')) {
      const parts = tituloSesion.split(':');
      tipo = parts[0].trim();
      tituloSesion = parts.slice(1).join(':').trim();
    }

    const fecha = new Date(conv.fechaEntrenamiento);
    const hoy = new Date();
    const manana = new Date();
    manana.setDate(hoy.getDate() + 1);

    let diaSeleccionado: 'hoy' | 'manana' | 'custom' = 'custom';
    let fechaCustom = '';

    if (fecha.toDateString() === hoy.toDateString()) {
      diaSeleccionado = 'hoy';
    } else if (fecha.toDateString() === manana.toDateString()) {
      diaSeleccionado = 'manana';
    } else {
      diaSeleccionado = 'custom';
      const y = fecha.getFullYear();
      const m = this.padZero(fecha.getMonth() + 1);
      const d = this.padZero(fecha.getDate());
      fechaCustom = `${y}-${m}-${d}`;
    }

    this.diaSeleccionado = diaSeleccionado;
    this.fechaSeleccionada = fecha;

    this.form.patchValue({
      tipo,
      tituloSesion,
      fechaCustom,
      horaInicio: conv.horaInicio,
      horaFin: conv.horaFin,
      mensaje: conv.mensaje,
      esSemanal: conv.esSemanal || false
    });
  }

  private resetForm() {
    const ahora = new Date();
    const horaInicioStr = this.padZero(ahora.getHours()) + ':' + this.padZero(ahora.getMinutes());
    
    ahora.setMinutes(ahora.getMinutes() + 90);
    const horaFinStr = this.padZero(ahora.getHours()) + ':' + this.padZero(ahora.getMinutes());

    if (this.form) {
      this.form.patchValue({
        tipo: 'WOD del Día',
        tituloSesion: '',
        fechaCustom: '',
        horaInicio: horaInicioStr,
        horaFin: horaFinStr,
        mensaje: '',
        esSemanal: false
      });
    }
    this.diaSeleccionado = 'hoy';
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

  seleccionarDiaSegmento(event: any) {
    const val = event.detail.value as 'hoy' | 'manana' | 'custom';
    if (val === 'custom') {
      this.diaSeleccionado = 'custom';
    } else {
      this.seleccionarDia(val);
    }
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
      this.showToast('No tienes un gimnasio asignado', 'danger');
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
      const finalTitle = `${formValue.tipo}: ${formValue.tituloSesion}`;

      let convocatoriaData: Convocatoria;

      if (!this.isCreating && this.convocatoria) {
        convocatoriaData = {
          ...this.convocatoria,
          fechaEntrenamiento: this.fechaSeleccionada,
          horaInicio: formValue.horaInicio,
          horaFin: formValue.horaFin,
          mensaje: formValue.mensaje || '',
          titulo: finalTitle,
          esSemanal: formValue.esSemanal || false
        };
      } else {
        convocatoriaData = {
          id: 'cv-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          creadorId: user.uid,
          creadorNombre: user.nombre || 'Entrenador',
          creadorFoto: user.photoURL || null,
          gimnasioId: gimnasioId,
          fechaCreacion: new Date(),
          fechaEntrenamiento: this.fechaSeleccionada,
          horaInicio: formValue.horaInicio,
          horaFin: formValue.horaFin,
          mensaje: formValue.mensaje || '',
          interesados: [],
          activo: true,
          creadorRol: Rol.ENTRENADOR,
          titulo: finalTitle,
          esOficial: true,
          esSemanal: formValue.esSemanal || false
        };
      }

      await this.convocatoriaService.save(convocatoriaData);
      
      this.showToast(
        this.isCreating 
          ? '¡Sesión de Agenda publicada con éxito!' 
          : '¡Sesión de Agenda actualizada con éxito!', 
        'success'
      );
      this.saved.emit();
      this.close.emit();
      this.resetForm();
    } catch (e) {
      console.error(e);
      this.showToast('Error al publicar en la agenda', 'danger');
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
