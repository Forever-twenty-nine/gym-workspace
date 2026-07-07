import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonCardSubtitle,
    IonAvatar,
    IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { warningOutline, playOutline, checkmarkCircle } from 'ionicons/icons';

@Component({
    selector: 'app-rutina-overlay',
    standalone: true,
    imports: [
        CommonModule,
        IonButton,
        IonIcon,
        IonCard,
        IonCardHeader,
        IonCardTitle,
        IonCardContent,
        IonCardSubtitle,
        IonAvatar,
        IonToolbar
    ],
    templateUrl: './rutina-overlay.component.html',
    styles: [`
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fadeIn 0.6s ease-out forwards;
    }
  `]
})
export class RutinaOverlayComponent {
    readonly type = input.required<'start' | 'success'>();
    readonly title = input.required<string>();
    readonly subtitle = input.required<string>();
    readonly icon = input.required<string>();
    readonly buttonText = input.required<string>();
    readonly buttonColor = input<string>('primary');
    readonly buttonFill = input<'clear' | 'outline' | 'solid' | 'default'>('solid');
    readonly expand = input<'block' | 'full' | undefined>('block');
    readonly yaRealizadaHoy = input<boolean>(false);
    readonly hideButton = input<boolean>(false);

    readonly action = output<void>();

    constructor() {
        addIcons({ warningOutline, playOutline, checkmarkCircle });
    }
}