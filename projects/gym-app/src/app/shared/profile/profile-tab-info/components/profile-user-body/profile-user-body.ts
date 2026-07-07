import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  IonList, IonListHeader, IonItem, IonLabel, IonIcon,
  IonGrid, IonRow, IonCol, IonText
} from '@ionic/angular/standalone';
import { User, Entrenado, Entrenador, Gimnasio, Rol } from 'gym-library';
import { addIcons } from 'ionicons';
import {
  mailOutline, calendarOutline, trophyOutline, ribbonOutline,
  chatbubblesOutline, eyeOutline, eyeOffOutline, timeOutline,
  locationOutline, cardOutline, storefrontOutline, peopleCircleOutline,
  fitnessOutline, businessOutline, personOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-profile-user-body',
  imports: [
    CommonModule, DatePipe,
    IonList, IonListHeader, IonItem, IonLabel, IonIcon,
    IonGrid, IonRow, IonCol, IonText
  ],
  templateUrl: './profile-user-body.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileUserBodyComponent {

  user = input.required<User>();
  entrenadoData = input<Entrenado | null>(null);
  entrenadorData = input<Entrenador | null>(null);
  gimnasioData = input<Gimnasio | null>(null);

  role = computed(() => this.user().role);

  isEntrenado = computed(() => this.role() === Rol.ENTRENADO);
  isEntrenador = computed(() => this.role() === Rol.ENTRENADOR || this.role() === Rol.PERSONAL_TRAINER);
  isGimnasio = computed(() => this.role() === Rol.GIMNASIO);

  entrenadosAsignadosCount = computed(() => this.entrenadorData()?.entrenadosAsignadosIds?.length ?? 0);
  rutinasCreadasCount = computed(() => this.entrenadorData()?.rutinasCreadasIds?.length ?? 0);
  ejerciciosCount = computed(() => this.entrenadorData()?.ejerciciosCreadasIds?.length ?? 0);

  gimnasiosCountEntrenador = computed(() => this.entrenadorData()?.gimnasioId?.length ?? 0);

  entrenadoresCountGimnasio = computed(() => this.gimnasioData()?.entrenadoresIds?.length ?? 0);
  entrenadosCountGimnasio = computed(() => this.gimnasioData()?.entrenadosIds?.length ?? 0);

  /**
   * Normaliza `user.fechaCreacion` a un `Date` nativo.
   * Cubre tres casos que devuelve Firebase / los modelos:
   *  - `Date` nativo (uso normal)
   *  - `Timestamp` de Firestore (con .seconds y .nanoseconds)
   *  - ISO string (e.g. lo que llega desde un mock o un sync externo)
   */
  fechaCreacionDate = computed<Date | null>(() => {
    const raw: any = this.user()?.fechaCreacion;
    if (!raw) return null;

    if (raw instanceof Date) return raw;

    if (typeof raw === 'object' && typeof raw.seconds === 'number') {
      return new Date(raw.seconds * 1000);
    }

    if (typeof raw === 'string') {
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    }

    return null;
  });

  seguidoresCount = computed(() => this.entrenadoData()?.seguidores?.length ?? 0);
  seguidosCount = computed(() => this.entrenadoData()?.seguidos?.length ?? 0);

  constructor() {
    addIcons({ mailOutline, calendarOutline, trophyOutline, ribbonOutline, chatbubblesOutline, eyeOutline, eyeOffOutline, timeOutline, locationOutline, cardOutline, fitnessOutline, personOutline });;
  }
}
