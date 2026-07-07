import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

/**
 * Modal wrapper reutilizable para crear/editar entidades.
 *
 * Estructura fija:
 *  - Toolbar con botón "close" (izquierda), título (centro), botón "save" (derecha).
 *  - Contenido proyectado en <ng-content> (form fields del consumer).
 *
 * Variantes admitidas vía inputs:
 *  - breakpoints / initialBreakpoint: opt-in para modales tipo bottom-sheet.
 *  - backdropDismiss: configurable (default true).
 *
 * Ejemplo:
 *   <app-edit-modal
 *     [isOpen]="isOpen()"
 *     title="Nueva Rutina"
 *     [disabled]="form.invalid"
 *     (close)="close()"
 *     (save)="save()">
 *     <form>...</form>
 *   </app-edit-modal>
 */
@Component({
  selector: 'app-edit-modal',
  templateUrl: './edit-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon
  ]
})
export class EditModalComponent {
  /** Estado de apertura del modal. */
  isOpen = input.required<boolean>();

  /** Título centrado en la toolbar. */
  title = input.required<string>();

  /** Si true, deshabilita el botón "save". */
  disabled = input<boolean>(false);

  /** Breakpoints para modal tipo bottom-sheet. Si se omite, modal full-screen. */
  breakpoints = input<number[] | null>(null);

  /** Breakpoint inicial. Si se omite, modal full-screen. */
  initialBreakpoint = input<number | null>(null);

  /** Si true, tap fuera del modal lo cierra. */
  backdropDismiss = input<boolean>(true);

  close = output<void>();
  save = output<void>();
}
