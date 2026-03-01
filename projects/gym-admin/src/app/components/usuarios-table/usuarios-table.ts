import { Component, input, output } from '@angular/core';


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
  imports: [],
  templateUrl: './usuarios-table.html',
})
export class UsuariosTable {
  usuarios = input<Usuario[]>([]);
  edit = output<Usuario>();
  delete = output<string>();
}
