import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { GymActivationRingComponent } from './gym-activation-ring.component';

const meta: Meta<GymActivationRingComponent> = {
  title: 'Secciones/gimnasio/gimnasio-dashboard/Componentes/gym-activation-ring',
  component: GymActivationRingComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="flex items-center justify-center p-4 bg-slate-900">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<GymActivationRingComponent>;

export const Default: Story = {
  args: {
    rate: 75
  }
};

export const Empty: Story = {
  args: {
    rate: 0
  }
};

export const Full: Story = {
  args: {
    rate: 100
  }
};
