import type { Meta, StoryObj } from '@storybook/angular';
import { ProgresoPage } from './progreso.page';

const meta: Meta<ProgresoPage> = {
  title: 'Pages/entrenado/progreso',
  component: ProgresoPage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ProgresoPage>;

export const Default: Story = {
  args: {
  },
};
