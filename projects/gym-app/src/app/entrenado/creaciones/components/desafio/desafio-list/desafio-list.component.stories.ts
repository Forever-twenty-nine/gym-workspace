import type { Meta, StoryObj } from '@storybook/angular';
import { DesafioListComponent } from './desafio-list.component';

const meta: Meta<DesafioListComponent> = {
  title: 'Secciones/entrenado/creaciones/Componentes/desafio/desafio-list',
  component: DesafioListComponent,
};

export default meta;
type Story = StoryObj<DesafioListComponent>;

export const Default: Story = {
  args: {
  },
};

