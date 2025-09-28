import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from 'gym-library';

@Component({
  selector: 'app-usuarios-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios-card.component.html'
})
export class UsuariosCardComponent {
  @Input() usuarios: User[] = [];
  @Output() createUsuario = new EventEmitter<void>();
  @Output() editUsuario = new EventEmitter<User>();
  @Output() deleteUsuario = new EventEmitter<string>();

  onCreateUsuario() {
    this.createUsuario.emit();
  }

  onEditUsuario(usuario: User) {
    this.editUsuario.emit(usuario);
  }

  onDeleteUsuario(uid: string) {
    this.deleteUsuario.emit(uid);
  }
}