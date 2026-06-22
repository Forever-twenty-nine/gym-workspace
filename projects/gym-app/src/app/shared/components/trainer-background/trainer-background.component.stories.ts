import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { TrainerBackgroundComponent } from './trainer-background.component';

const meta: Meta<TrainerBackgroundComponent> = {
  title: 'Componentes Compartidos/trainer-background',
  component: TrainerBackgroundComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="relative h-[400px] overflow-hidden">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<TrainerBackgroundComponent>;

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
