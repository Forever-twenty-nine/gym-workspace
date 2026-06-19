import type { Meta, StoryObj } from '@storybook/angular';
import { DesafioModalComponent } from './desafio-modal.component';

const meta: Meta<DesafioModalComponent> = {
  title: 'Pages/entrenado/creaciones/desafio/desafio-modal',
  component: DesafioModalComponent,
};

export default meta;
type Story = StoryObj<DesafioModalComponent>;

export const Default: Story = {
  args: {
  },
};
