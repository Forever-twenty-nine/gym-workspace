import { Meta, StoryObj } from '@storybook/angular';
import { TiposEntrenamientoListComponent } from './tipos-entrenamiento-list';

const meta: Meta<TiposEntrenamientoListComponent> = {
  title: 'Shared/Components/Tipos Entrenamiento List',
  component: TiposEntrenamientoListComponent,
  argTypes: {
    edit: { action: 'edit' },
    delete: { action: 'delete' },
    loadDefaults: { action: 'loadDefaults' },
  },
};

export default meta;
type Story = StoryObj<TiposEntrenamientoListComponent>;

export const Empty: Story = {
  args: {
    tipos: [],
  },
};

export const WithItems: Story = {
  args: {
    tipos: [
      { id: '1', nombre: 'Funcional', gimnasioId: 'g1' },
      { id: '2', nombre: 'CrossFit', gimnasioId: 'g1' },
      { id: '3', nombre: 'Yoga', gimnasioId: 'g1' },
    ],
  },
};
