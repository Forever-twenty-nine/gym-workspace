import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  isVisible?: boolean;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 space-y-3 w-full max-w-md">
      @for (toast of toasts(); track toast.id) {
        <div 
          [class]="getToastClasses(toast)"
          [class.opacity-0]="!toast.isVisible"
          [class.-translate-y-full]="!toast.isVisible"
          class="transform transition-all duration-300 ease-in-out w-full">
          
          <div class="flex items-start">
            <!-- Icono -->
            <div class="flex-shrink-0">
              <svg [class]="getIconClasses(toast.type)" fill="currentColor" viewBox="0 0 20 20">
                @switch (toast.type) {
                  @case ('success') {
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.53 10.4a.75.75 0 00-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"></path>
                  }
                  @case ('error') {
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"></path>
                  }
                  @case ('warning') {
                    <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
                  }
                  @case ('info') {
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"></path>
                  }
                }
              </svg>
            </div>
            
            <!-- Mensaje -->
            <div class="ml-3 flex-1 pt-0.5">
              <p [class]="getTextClasses(toast.type)">{{ toast.message }}</p>
            </div>
            
            <!-- Botón cerrar -->
            <div class="ml-4 flex-shrink-0 flex">
              <button 
                [class]="getCloseButtonClasses(toast.type)"
                (click)="closeToast.emit(toast.id)">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  toasts = input<Toast[]>([]);
  closeToast = output<string>();

  getToastClasses(toast: Toast): string {
    const baseClasses = 'rounded-xl shadow-lg p-4 border backdrop-blur-sm';
    
    switch (toast.type) {
      case 'success':
        return `${baseClasses} bg-green-50/95 border-green-200`;
      case 'error':
        return `${baseClasses} bg-red-50/95 border-red-200`;
      case 'warning':
        return `${baseClasses} bg-yellow-50/95 border-yellow-200`;
      case 'info':
        return `${baseClasses} bg-blue-50/95 border-blue-200`;
      default:
        return `${baseClasses} bg-gray-50/95 border-gray-200`;
    }
  }

  getIconClasses(type: string): string {
    const baseClasses = 'w-5 h-5';
    
    switch (type) {
      case 'success':
        return `${baseClasses} text-green-600`;
      case 'error':
        return `${baseClasses} text-red-600`;
      case 'warning':
        return `${baseClasses} text-yellow-600`;
      case 'info':
        return `${baseClasses} text-blue-600`;
      default:
        return `${baseClasses} text-gray-600`;
    }
  }

  getTextClasses(type: string): string {
    const baseClasses = 'text-sm font-medium leading-relaxed';
    
    switch (type) {
      case 'success':
        return `${baseClasses} text-green-800`;
      case 'error':
        return `${baseClasses} text-red-800`;
      case 'warning':
        return `${baseClasses} text-yellow-800`;
      case 'info':
        return `${baseClasses} text-blue-800`;
      default:
        return `${baseClasses} text-gray-800`;
    }
  }

  getCloseButtonClasses(type: string): string {
    const baseClasses = 'rounded-md p-1.5 inline-flex hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
    
    switch (type) {
      case 'success':
        return `${baseClasses} text-green-500 hover:bg-green-600 focus:ring-green-600`;
      case 'error':
        return `${baseClasses} text-red-500 hover:bg-red-600 focus:ring-red-600`;
      case 'warning':
        return `${baseClasses} text-yellow-500 hover:bg-yellow-600 focus:ring-yellow-600`;
      case 'info':
        return `${baseClasses} text-blue-500 hover:bg-blue-600 focus:ring-blue-600`;
      default:
        return `${baseClasses} text-gray-500 hover:bg-gray-600 focus:ring-gray-600`;
    }
  }
}