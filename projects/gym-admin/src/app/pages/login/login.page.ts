import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div class="max-w-md w-full bg-slate-800 rounded-2xl shadow-xl overflow-hidden p-8 border border-slate-700/50 relative">
        <!-- Glow effect -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none"></div>
        
        <div class="relative">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-white mb-2">Gym Admin</h2>
            <p class="text-slate-400">Panel de control exclusivo</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="space-y-6">
            @if (errorMsg()) {
              <div class="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-6">
                <p class="text-red-400 text-sm text-center">{{ errorMsg() }}</p>
              </div>
            }

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Correo Electrónico</label>
              <input 
                type="email" 
                name="email"
                [(ngModel)]="email"
                required
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white outline-none"
                placeholder="admin@gym.com">
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
              <input 
                type="password" 
                name="password"
                [(ngModel)]="password"
                required
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-white outline-none"
                placeholder="••••••••">
            </div>

            <button 
              type="submit" 
              [disabled]="loading()"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (loading()) {
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Iniciando...</span>
              } @else {
                <span>Ingresar</span>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginPage {
  private authService = inject(AdminAuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  errorMsg = signal('');

  async onSubmit() {
    if (!this.email || !this.password) {
      this.errorMsg.set('Por favor completa todos los campos.');
      return;
    }

    try {
      this.loading.set(true);
      this.errorMsg.set('');
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/usuarios']);
    } catch (e: any) {
      this.errorMsg.set(e.message || 'Credenciales inválidas o sin permisos.');
    } finally {
      this.loading.set(false);
    }
  }
}
