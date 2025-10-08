import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-chip-icon',
  standalone: true,
  template: `
    <svg [class]="'w-3 h-3 ' + colorClass()" fill="currentColor" viewBox="0 0 20 20">
      @switch (icon()) {
        @case ('building') {
          <path fill-rule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5H3.75a.75.75 0 010-1.5H4zM5.5 4v1a.5.5 0 001 0V4a.5.5 0 00-1 0zm3 0v1a.5.5 0 001 0V4a.5.5 0 00-1 0zm3.5.5V4a.5.5 0 00-1 0v1a.5.5 0 001 0zM5.5 7v1a.5.5 0 001 0V7a.5.5 0 00-1 0zm3 0v1a.5.5 0 001 0V7a.5.5 0 00-1 0zm3.5.5V7a.5.5 0 00-1 0v1a.5.5 0 001 0zM5.5 10v1a.5.5 0 001 0v-1a.5.5 0 00-1 0zm3 0v1a.5.5 0 001 0v-1a.5.5 0 00-1 0zm3.5.5v-1a.5.5 0 00-1 0v1a.5.5 0 001 0z" clip-rule="evenodd"/>
        }
        @case ('person') {
          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
        }
        @case ('user') {
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clip-rule="evenodd"/>
        }
        @case ('target') {
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832L14 10.202a1 1 0 000-1.732l-4.445-2.634z" clip-rule="evenodd"/>
        }
        @case ('dumbbell') {
          <path fill-rule="evenodd" d="M7.22 3.22a.75.75 0 011.06 0L10 4.94l1.72-1.72a.75.75 0 111.06 1.06L11.06 6l1.72 1.72a.75.75 0 01-1.06 1.06L10 7.06 8.28 8.78a.75.75 0 01-1.06-1.06L8.94 6 7.22 4.28a.75.75 0 010-1.06zM3 10a7 7 0 1114 0 7 7 0 01-14 0zm7-5a5 5 0 100 10 5 5 0 000-10z" clip-rule="evenodd"/>
        }
        @case ('users') {
          <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01.569-1.175 6.002 6.002 0 0111.632 0c.232.348.315.826.569 1.175C14.671 15.128 10 14 7 14c-3 0-7.671 1.128-5.385 2.428zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-4.084 4.5 4.5 0 012.092 3.84c.374.654.233 1.177-.446 1.177z"/>
        }
        @case ('list') {
          <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
        }
        @default {
          <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
        }
      }
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipIconComponent {
  icon = input.required<string>();
  colorClass = input<string>('text-gray-600');
}
