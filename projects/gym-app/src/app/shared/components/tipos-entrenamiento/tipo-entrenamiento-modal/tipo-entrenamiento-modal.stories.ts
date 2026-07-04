import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { TipoEntrenamientoModalComponent } from './tipo-entrenamiento-modal';
import { FormBuilder } from '@angular/forms';

const meta: Meta<TipoEntrenamientoModalComponent> = {
  title: 'Shared/Components/Tipo Entrenamiento Modal',
  component: TipoEntrenamientoModalComponent,
  decorators: [
    moduleMetadata({
      providers: [FormBuilder],
    }),
  ],
  argTypes: {
    close: { action: 'close' },
    save: { action: 'save' },
  },
};

export default meta;
type Story = StoryObj<TipoEntrenamientoModalComponent>;

export const Creating: Story = {
  args: {
    isOpen: true,
    isCreating: true,
    tipo: null,
  },
};

export const Editing: Story = {
  args: {
    isOpen: true,
    isCreating: false,
    tipo: { id: '1', nombre: 'CrossFit', gimnasioId: 'g1' },
  },
};
