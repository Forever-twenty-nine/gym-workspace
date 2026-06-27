import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { PerfilPlanStatusComponent } from './perfil-plan-status.component';

const meta: Meta<PerfilPlanStatusComponent> = {
  title: 'Secciones/entrenado/perfil/componentes/plan-status',
  component: PerfilPlanStatusComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<PerfilPlanStatusComponent>;

export const Premium: Story = {
  args: {
    plan: 'Premium Anual',
    isPremium: true
  }
};

export const Free: Story = {
  args: {
    plan: 'Básico',
    isPremium: false
  }
};