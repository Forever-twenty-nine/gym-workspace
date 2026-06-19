import type { Meta, StoryObj } from '@storybook/angular';
import { GimnasioEntrenadoresPage } from './gimnasio-entrenadores.page';

const meta: Meta<GimnasioEntrenadoresPage> = {
  title: 'Pages/gimnasio/gimnasio-entrenadores',
  component: GimnasioEntrenadoresPage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<GimnasioEntrenadoresPage>;

export const Default: Story = {
  args: {
  },
};
