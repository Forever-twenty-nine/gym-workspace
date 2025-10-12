import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Ejercicio } from 'gym-library';

export interface FormFieldConfig {
  name: string;
  label: string;
  type: string;
  icon?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: any; label: string; extra?: string }[];
  colSpan?: number;
  inputType?: string;
  min?: number;
  step?: number;
  rows?: number;
  checkboxLabel?: string;
  readonly?: boolean;
  rutinas?: any[];
  usuario?: any;
  gimnasio?: any;
  clientes?: any[];
  ejercicios?: any[];
  notificaciones?: any[];
  mensajesConversacion?: any[];  // Historial de mensajes de una conversación
  conversaciones?: any[];  // Lista de conversaciones del usuario
  invitaciones?: any[];  // Lista de invitaciones pendientes
  showClearButton?: boolean;  // Mostrar botón para limpiar/clear
}

@Component({
  selector: 'app-modal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-form.component.html'
})
export class ModalFormComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() modalType: string = '';
  @Input() isCreating: boolean = true;
  @Input() form: FormGroup | null = null;
  @Input() formFields: FormFieldConfig[] = [];
  @Input() ejercicios: Ejercicio[] = [];
  @Input() selectedEjercicios: string[] = [];
  @Input() isLoading: boolean = false;
  @Input() showCustomAction: boolean = false;
  @Input() customActionLabel: string = 'Acción';
  @Input() customActionIcon: string = '⚡';
  @Input() showCustomAction2: boolean = false;
  @Input() customAction2Label: string = 'Acción 2';
  @Input() customAction2Icon: string = '🔧';

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();
  @Output() toggleDiaSemana = new EventEmitter<{ event: Event; value: string }>();
  @Output() toggleEjercicio = new EventEmitter<string>();
  @Output() customAction = new EventEmitter<void>();
  @Output() customAction2 = new EventEmitter<void>();
  @Output() marcarNotificacionLeida = new EventEmitter<string>();
  @Output() verMensaje = new EventEmitter<string>();
  @Output() responderMensaje = new EventEmitter<any>();
  @Output() verConversacion = new EventEmitter<string>();
  @Output() marcarConversacionLeida = new EventEmitter<string>();
  @Output() responderConversacion = new EventEmitter<string>();
  @Output() aceptarInvitacion = new EventEmitter<string>();
  @Output() rechazarInvitacion = new EventEmitter<string>();
  @Output() editarRutina = new EventEmitter<string>();
  @Output() clearField = new EventEmitter<string>();

  diasSemanaOptions = [
    { value: 'L', label: 'Lunes' },
    { value: 'M', label: 'Martes' },
    { value: 'X', label: 'Miércoles' },
    { value: 'J', label: 'Jueves' },
    { value: 'V', label: 'Viernes' },
    { value: 'S', label: 'Sábado' },
    { value: 'D', label: 'Domingo' }
  ];

  ngOnInit() {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formFields'] && this.formFields) {
      // Debug: loggear notificaciones cuando cambian los formFields
      const notificacionesField = this.formFields.find(f => f.name === 'notificacionesMensajes');
    }
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  onOverlayClick() {
    this.onClose();
  }

  onClose() {
    document.body.style.overflow = 'auto';
    this.close.emit();
  }

  onSave() {
    this.save.emit();
  }

  onToggleDiaSemana(event: Event, value: string) {
    this.toggleDiaSemana.emit({ event, value });
  }

  onToggleEjercicio(ejercicioId: string) {
    this.toggleEjercicio.emit(ejercicioId);
  }

  onCustomAction() {
    this.customAction.emit();
  }

  onCustomAction2() {
    this.customAction2.emit();
  }

  isEjercicioSelected(ejercicioId: string): boolean {
    return this.selectedEjercicios.includes(ejercicioId);
  }

  getEjercicioById(id: string): Ejercicio | undefined {
    return this.ejercicios.find(e => e.id === id);
  }

  getDiasSemanaNombres(dias: number[]): string {
    if (!dias || dias.length === 0) return 'No especificado';
    
    const nombresCompletos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias.map(dia => nombresCompletos[dia] || 'N/A').join(', ');
  }

  // Métodos para manejar multiselects
  isOptionSelected(fieldName: string, optionValue: any): boolean {
    if (!this.form) return false;
    const fieldValue = this.form.get(fieldName)?.value;
    return Array.isArray(fieldValue) ? fieldValue.includes(optionValue) : false;
  }

  onToggleMultiselect(fieldName: string, optionValue: any, event: Event) {
    if (!this.form) return;
    
    const checkbox = event.target as HTMLInputElement;
    const currentValues = this.form.get(fieldName)?.value || [];
    
    let newValues: any[];
    if (checkbox.checked) {
      // Agregar valor si no está presente
      newValues = currentValues.includes(optionValue) 
        ? currentValues 
        : [...currentValues, optionValue];
    } else {
      // Remover valor si está presente
      newValues = currentValues.filter((value: any) => value !== optionValue);
    }
    
    this.form.patchValue({ [fieldName]: newValues });
  }

  getSelectedCount(fieldName: string): number {
    if (!this.form) return 0;
    const fieldValue = this.form.get(fieldName)?.value;
    return Array.isArray(fieldValue) ? fieldValue.length : 0;
  }

  onMarcarNotificacionLeida(notifId: string) {
    this.marcarNotificacionLeida.emit(notifId);
  }

  onVerMensaje(mensajeId: string) {
    this.verMensaje.emit(mensajeId);
  }

  onVerConversacion(conversacionId: string) {
    this.verConversacion.emit(conversacionId);
  }

  onMarcarConversacionLeida(conversacionId: string) {
    this.marcarConversacionLeida.emit(conversacionId);
  }

  onResponderConversacion(conversacionId: string) {
    this.responderConversacion.emit(conversacionId);
  }

  onEditarRutina(rutinaId: string) {
    this.editarRutina.emit(rutinaId);
  }

  onAceptarInvitacion(entrenadorId: string) {
    this.aceptarInvitacion.emit(entrenadorId);
  }

  onRechazarInvitacion(entrenadorId: string) {
    this.rechazarInvitacion.emit(entrenadorId);
  }

  onResponderMensaje(mensajeId?: string) {
    // Si recibimos un mensajeId, lo emitimos para que el componente padre maneje la respuesta
    if (mensajeId) {
      this.responderMensaje.emit({ mensajeId });
    } else if (this.form) {
      // Emitir datos necesarios para responder: conversacionId, remitenteId, destinatarioId
      const datos = {
        conversacionId: this.form.get('conversacionId')?.value,
        remitenteId: this.form.get('destinatarioId')?.value, // Invertir
        destinatarioId: this.form.get('remitenteId')?.value  // Invertir
      };
      this.responderMensaje.emit(datos);
    }
  }

  onClearField(fieldName: string) {
    this.clearField.emit(fieldName);
  }

  contarNoLeidas(notificaciones: any[]): number {
    return notificaciones.filter(n => !n.leida).length;
  }
}