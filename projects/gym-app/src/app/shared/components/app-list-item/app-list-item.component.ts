import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonAvatar, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline } from 'ionicons/icons';

/**
 * Item reutilizable de lista: avatar + nombre + meta + slot al final.
 *
 * Ejemplo:
 *   <app-list-item
 *     [photo]="user.photo"
 *     [photoIcon]="'person-outline'"
 *     [name]="user.nombre"
 *     [meta]="user.email">
 *     <ion-button slot="end" fill="clear" color="danger">
 *       <ion-icon name="trash-outline"></ion-icon>
 *     </ion-button>
 *   </app-list-item>
 *
 * El `photo` es opcional. Si falta, se renderiza un icono Ionic como fallback
 * (configurable vía `photoIcon`, default `person-outline`).
 */
@Component({
  selector: 'app-list-item',
  templateUrl: './app-list-item.component.html',
  standalone: true,
  imports: [CommonModule, IonItem, IonAvatar, IonLabel, IonIcon]
})
export class ListItemComponent {
  /** URL de la foto. Si no se pasa, se renderiza un icono. */
  photo = input<string | null>();

  /** Icono Ionic a usar cuando no hay foto. Default: 'person-outline'. */
  photoIcon = input<string>('person-outline');

  /** Nombre principal del item (h2). */
  name = input.required<string>();

  /** Línea secundaria bajo el nombre (p). Opcional. */
  meta = input<string>();

  /** Si true, el item es clickeable. */
  button = input<boolean>(false);

  constructor() {
    addIcons({ personOutline });
  }
}
