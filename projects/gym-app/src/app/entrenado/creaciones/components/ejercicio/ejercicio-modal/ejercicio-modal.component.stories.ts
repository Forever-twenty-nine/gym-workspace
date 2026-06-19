import type { Meta, StoryObj } from '@storybook/angular';
import { EjercicioModalComponent } from './ejercicio-modal.component';

const meta: Meta<EjercicioModalComponent> = {
  title: 'Pages/entrenado/creaciones/ejercicio/ejercicio-modal',
  component: EjercicioModalComponent,
};

export default meta;
type Story = StoryObj<EjercicioModalComponent>;

export const Default: Story = {
  args: {
  },
};
