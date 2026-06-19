import type { Meta, StoryObj } from '@storybook/angular';
import { EjerciciosPage } from './ejercicios.page';

const meta: Meta<EjerciciosPage> = {
  title: 'Pages/entrenador/ejercicios',
  component: EjerciciosPage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<EjerciciosPage>;

export const Default: Story = {
  args: {
  },
};
