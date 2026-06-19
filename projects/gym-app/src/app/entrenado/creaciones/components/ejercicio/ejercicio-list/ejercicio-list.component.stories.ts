import type { Meta, StoryObj } from '@storybook/angular';
import { EjercicioListComponent } from './ejercicio-list.component';

const meta: Meta<EjercicioListComponent> = {
  title: 'Pages/entrenado/creaciones/ejercicio/ejercicio-list',
  component: EjercicioListComponent,
};

export default meta;
type Story = StoryObj<EjercicioListComponent>;

export const Default: Story = {
  args: {
  },
};
