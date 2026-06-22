import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { GymBackgroundComponent } from './gym-background.component';

const meta: Meta<GymBackgroundComponent> = {
  title: 'Componentes Compartidos/gym-background',
  component: GymBackgroundComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="relative h-[400px] overflow-hidden">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<GymBackgroundComponent>;

export const Free: Story = {
  args: {
    isPremium: false
  }
};

export const Premium: Story = {
  args: {
    isPremium: true
  }
};
