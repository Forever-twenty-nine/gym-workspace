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
  templateUrl: './toast.component.html',
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