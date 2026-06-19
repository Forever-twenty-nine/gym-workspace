import type { Meta, StoryObj } from '@storybook/angular';
import { RutinasPage } from './rutinas.page';

const meta: Meta<RutinasPage> = {
  title: 'Pages/entrenador/rutinas',
  component: RutinasPage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<RutinasPage>;

export const Default: Story = {
  args: {
  },
};
