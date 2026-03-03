import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';

@Component({
    selector: 'app-rutina-overlay',
    standalone: true,
    imports: [CommonModule, IonButton, IonIcon],
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

    readonly action = output<void>();
}
