import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, componentWrapperDecorator } from '@storybook/angular';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { InvitacionModalComponent } from './invitacion-modal.component';

const fb = new FormBuilder();

const meta: Meta<InvitacionModalComponent> = {
  title: 'Secciones/entrenador/entrenados/Componentes/invitacion-modal',
  component: InvitacionModalComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ReactiveFormsModule]
    }),
    componentWrapperDecorator((story) => `<ion-app class="relative flex items-center justify-center">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<InvitacionModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    form: fb.group({
      email: ['', [Validators.required, Validators.email]],
      mensaje: ['¡Hola! Me gustaría ser tu entrenador para ayudarte con tu planificación.']
    }),
    isSaveDisabled: false
  }
};
