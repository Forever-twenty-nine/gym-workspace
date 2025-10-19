import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Usuario {
  uid: string;
  displayName: string;
  email?: string;
  role?: string;
  emailVerified?: boolean;
  onboarded?: boolean;
  plan?: string;
  needsReview?: boolean;
}

@Component({
  selector: 'app-usuarios-table',
  imports: [CommonModule],
  templateUrl: './usuarios-table.html',
})
export class UsuariosTable {
  usuarios = input<Usuario[]>([]);
  edit = output<Usuario>();
  delete = output<string>();
}
