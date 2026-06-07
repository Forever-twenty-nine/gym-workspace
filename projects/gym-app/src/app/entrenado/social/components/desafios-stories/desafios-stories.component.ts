import { Component, inject, signal, computed, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline } from 'ionicons/icons';
import { AuthService } from '../../../../core/services/auth.service';
import { DesafioService } from '../../../../core/services/desafio.service';
import { UserService } from '../../../../core/services/user.service';
import { DesafioModalComponent } from '../desafio-modal/desafio-modal.component';
import { Desafio } from 'gym-library';
import { closeModalWithAnimation } from '../../../../core/utils/modal.utils';

@Component({
  selector: 'app-desafios-stories',
  standalone: true,
  imports: [CommonModule, IonIcon, DesafioModalComponent],
  templateUrl: './desafios-stories.component.html'
})
export class DesafiosStoriesComponent {
  private authService = inject(AuthService);
  private desafioService = inject(DesafioService);
  private userService = inject(UserService);

  @Input() showHeader = true;
  @Input() renderCircles = true;

  @HostBinding('class.contents') 
  get isNaked() { return !this.showHeader; }

  // Local dismisses (so user can "pasar" without accepting, keeps feed clean)
  private ocultados = signal<string[]>([]);

  selectedDesafio = signal<Desafio | null>(null);
  isModalOpen = signal(false);

  currentUser = this.authService.currentUser;

  desafiosActivos = computed(() => {
    const gimnasioId = this.currentUser()?.gimnasioId;
    if (!gimnasioId) return [];

    const all = this.desafioService.getDesafiosForGym(gimnasioId)();
    const ocultos = this.ocultados();

    return all
      .filter(d => !ocultos.includes(d.id)) // allow local "pasar"
      .sort((a, b) => {
        const va = new Date(a.fechaVencimiento).getTime();
        const vb = new Date(b.fechaVencimiento).getTime();
        return va - vb; // soonest to expire first
      });
  });

  constructor() {
    addIcons({ trophyOutline });
  }

  openModal(d: Desafio) {
    this.selectedDesafio.set(d);
    this.isModalOpen.set(true);
  }

  closeModal() {
    closeModalWithAnimation(this.isModalOpen, this.selectedDesafio, 280);
  }

  onDeleted(id: string) {
    this.closeModal();
  }

  // Called from modal when user chooses "Pasar" (or we can call directly)
  onPasar(id: string) {
    this.ocultados.update(list => [...list, id]);
    this.closeModal();
  }

  getShortLabel(d: Desafio): string {
    // Prefer short title, fallback to creator first name
    if (d.titulo) {
      const t = d.titulo.length > 11 ? d.titulo.slice(0, 10) + '…' : d.titulo;
      return t;
    }
    const name = this.userService.getUserByUid(d.creadorId)()?.nombre || d.creadorNombre || 'Atleta';
    const first = name.split(' ')[0];
    return first.length > 10 ? first.slice(0, 9) + '…' : first;
  }

  getTimeHint(d: Desafio): string {
    if (!d.fechaVencimiento) return '';
    const diff = new Date(d.fechaVencimiento).getTime() - Date.now();
    if (diff <= 0) return 'fin';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d`;
    return `${hours}h`;
  }

  esMio(d: Desafio): boolean {
    return d.creadorId === this.currentUser()?.uid;
  }

  userPhoto(d: Desafio): string | null {
    return this.userService.getUserByUid(d.creadorId)()?.photoURL || d.creadorFoto || null;
  }
}
