import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { PerfilGoalsComponent } from './perfil-goals.component';

const meta: Meta<PerfilGoalsComponent> = {
  title: 'Secciones/entrenado/perfil/componentes/goals',
  component: PerfilGoalsComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<PerfilGoalsComponent>;

export const Default: Story = {
  args: {
    entrenado: {
      objetivo: 'Ganar masa muscular',
      nivel: 'Intermedio'
    }
  }
};

export const Beginner: Story = {
  args: {
    entrenado: {
      objetivo: 'Perder peso',
      nivel: 'Principiante'
    }
  }
};