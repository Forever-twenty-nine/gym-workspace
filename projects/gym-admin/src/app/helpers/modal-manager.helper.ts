import { signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

/**
 * Clase genérica para manejar la lógica de modales CRUD
 * Elimina la duplicación de código para crear/editar/eliminar entidades
 */
export class GenericModalManager<T> {
  readonly isModalOpen: WritableSignal<boolean>;
  readonly modalData: WritableSignal<T | null>;
  readonly editForm: WritableSignal<FormGroup | null>;
  readonly isCreating: WritableSignal<boolean>;

  constructor(
    private fb: FormBuilder,
    private createFormConfig: (item: T) => any,
    private saveService: (item: T) => Promise<void>,
    private deleteService?: (id: string) => Promise<void>
  ) {
    this.isModalOpen = signal(false);
    this.modalData = signal<T | null>(null);
    this.editForm = signal<FormGroup | null>(null);
    this.isCreating = signal(false);
  }

  openCreateModal(emptyItem: T) {
    this.modalData.set(emptyItem);
    this.isModalOpen.set(true);
    this.isCreating.set(true);
    this.createEditForm(emptyItem);
  }

  openEditModal(item: T) {
    this.modalData.set(item);
    this.isModalOpen.set(true);
    this.isCreating.set(false);
    this.createEditForm(item);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.modalData.set(null);
    this.editForm.set(null);
    this.isCreating.set(false);
  }

  private createEditForm(item: T) {
    const formConfig = this.createFormConfig(item);
    this.editForm.set(this.fb.group(formConfig));
  }

  async save(additionalData?: Partial<T>): Promise<{ success: boolean; error?: string }> {
    const form = this.editForm();
    const originalData = this.modalData();

    if (!form || !originalData) {
      return { success: false, error: 'Formulario inválido o datos faltantes' };
    }

    form.markAllAsTouched();

    if (!form.valid) {
      return { success: false, error: 'Por favor, completa todos los campos obligatorios' };
    }

    try {
      const updatedData = { 
        ...originalData, 
        ...form.value,
        ...additionalData
      };
      
      await this.saveService(updatedData as T);
      this.closeModal();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    if (!this.deleteService) {
      return { success: false, error: 'Servicio de eliminación no disponible' };
    }

    try {
      await this.deleteService(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
