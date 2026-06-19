import type { Meta, StoryObj } from '@storybook/angular';
import { EntrenadosPage } from './entrenados.page';

const meta: Meta<EntrenadosPage> = {
  title: 'Pages/entrenador/entrenados',
  component: EntrenadosPage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<EntrenadosPage>;

export const Default: Story = {
  args: {
  },
};
