import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonFab, IonFabButton, IonIcon, IonPopover, IonContent, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { help } from 'ionicons/icons';

/**
 * Counter estático para autogenerar IDs únicos cuando el consumidor
 * no provee `fabId`. Evita colisiones entre múltiples instancias.
 */
let nextHelpFabId = 0;

/**
 * FAB de ayuda con popover contextual.
 *
 * Ejemplo de uso:
 *   <app-help-fab [helpText]="helpText()" />
 *   <app-help-fab [helpText]="helpText()" fabId="trainer-help-fab" />
 */
@Component({
  selector: 'app-help-fab',
  templateUrl: './help-fab.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonFab,
    IonFabButton,
    IonIcon,
    IonPopover,
    IonContent,
    IonText
  ]
})
export class HelpFabComponent {
  private autoId = `help-fab-${++nextHelpFabId}`;

  /** Texto contextual del popover. Soporta saltos de línea. */
  helpText = input.required<string>();

  /** ID único del FAB. Si se omite se autogenera automáticamente. */
  fabId = input<string>();

  resolvedFabId = computed(() => this.fabId() ?? this.autoId);

  constructor() {
    addIcons({ help });
  }
}
