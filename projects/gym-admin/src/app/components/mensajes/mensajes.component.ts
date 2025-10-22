import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mensajes',
  imports: [CommonModule, FormsModule],
  templateUrl: './mensajes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MensajesComponent {
  // Inputs from parent
  mensajes = input<any[]>([]);
  isOpen = input<boolean>(false);
  isCreating = input<boolean>(false);
  remitenteId = input<string>('');

  // Outputs for parent actions
  open = output<void>();
  close = output<void>();
  send = output<{ mensaje: string }>();

  mensajeTexto = '';

  onEnviar() {
    const text = this.mensajeTexto?.trim();
    if (!text) return;
    this.send.emit({ mensaje: text });
    this.mensajeTexto = '';
  }
}
