import { Injectable, signal } from '@angular/core';
import { Toast } from '../components/shared/toast/toast.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 4000) {
    const id = Date.now().toString();
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      isVisible: false
    };

    this.toasts.update(toasts => [...toasts, toast]);

    // Trigger animation
    setTimeout(() => {
      this.toasts.update(toasts => 
        toasts.map(t => t.id === id ? { ...t, isVisible: true } : t)
      );
    }, 10);

    // Auto-remove
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }

  remove(id: string) {
    this.toasts.update(toasts => 
      toasts.map(t => t.id === id ? { ...t, isVisible: false } : t)
    );

    setTimeout(() => {
      this.toasts.update(toasts => toasts.filter(t => t.id !== id));
    }, 300);
  }

  /**
   * Método utilitario para logs que automáticamente detecta el tipo de mensaje
   */
  log(message: string) {
    const cleanMsg = message.replace(/✅|❌|⚠️/g, '').trim();
    
    if (message.includes('Error') || message.includes('ERROR') || message.includes('❌')) {
      this.error(cleanMsg);
    } else if (message.includes('⚠️') || message.includes('Warning')) {
      this.warning(cleanMsg);
    } else if (message.includes('✅') || message.includes('creado') || message.includes('actualizado') || message.includes('eliminado')) {
      this.success(cleanMsg);
    } else {
      this.info(cleanMsg);
    }
  }

  clear() {
    this.toasts.set([]);
  }
}
