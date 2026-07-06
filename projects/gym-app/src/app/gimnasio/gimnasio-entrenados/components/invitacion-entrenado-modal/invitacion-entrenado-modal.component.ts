import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { 
  IonHeader, 
  IonContent, 
  IonModal, 
  IonButton, 
  IonItem, 
  IonInput, 
  IonTextarea, 
  IonToolbar, 
  IonButtons, 
  IonTitle,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonList,
  IonAvatar,
  IonLabel,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, send } from 'ionicons/icons';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-invitacion-entrenado-modal',
  templateUrl: './invitacion-entrenado-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonContent,
    IonModal,
    IonButton,
    IonIcon,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonSearchbar,
    IonList,
    IonAvatar,
    IonLabel,
    IonInput,
    IonTextarea
  ]
})
export class InvitacionEntrenadoModalComponent {
  private userService = inject(UserService);

  isOpen = input.required<boolean>();
  isLoading = input.required<boolean>();
  gymTrainers = input.required<any[]>();
  inviteForm = input.required<FormGroup>();

  close = output<void>();
  save = output<void>();

  searchResults = signal<any[]>([]);

  constructor() {
    addIcons({ closeOutline, send });
  }

  cancel() {
    this.searchResults.set([]);
    this.close.emit();
  }

  submit() {
    if (this.inviteForm().valid) {
      this.save.emit();
    }
  }

  searchTrainees(event: any) {
    const val = (event.detail.value || '').toLowerCase().trim();
    if (!val) {
      this.searchResults.set([]);
      return;
    }
    const matches = this.userService.users().filter(u => 
      u.role === 'entrenado' &&
      ((u.nombre?.toLowerCase().includes(val) || false) || 
       (u.email?.toLowerCase().includes(val) || false))
    );
    this.searchResults.set(matches);
  }

  clearSearchResults() {
    this.searchResults.set([]);
  }

  selectTrainee(user: any) {
    this.inviteForm().patchValue({ email: user.email });
    this.searchResults.set([]);
  }
}
