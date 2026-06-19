import type { Meta, StoryObj } from '@storybook/angular';
import { GimnasioEntrenadosPage } from './gimnasio-entrenados.page';

const meta: Meta<GimnasioEntrenadosPage> = {
  title: 'Pages/gimnasio/gimnasio-entrenados',
  component: GimnasioEntrenadosPage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<GimnasioEntrenadosPage>;

export const Default: Story = {
  args: {
  },
};
