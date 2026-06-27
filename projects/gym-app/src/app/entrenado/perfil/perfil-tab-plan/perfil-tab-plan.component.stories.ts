import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { PerfilTabPlanComponent } from './perfil-tab-plan.component';
import { fn } from '@storybook/test';
import { Plan } from 'gym-library';

const meta: Meta<PerfilTabPlanComponent> = {
  title: 'Secciones/entrenado/perfil/tabs/plan',
  component: PerfilTabPlanComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    openPremiumModal: fn()
  }
};

export default meta;
type Story = StoryObj<PerfilTabPlanComponent>;

export const Free: Story = {
  args: {
    user: {
      plan: Plan.FREE
    } as any
  }
};

export const Premium: Story = {
  args: {
    user: {
      plan: Plan.PREMIUM
    } as any
  }
};

export const Pending: Story = {
  args: {
    user: {
      plan: Plan.FREE
    } as any,
    ultimaSolicitud: {
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString()
    } as any
  }
};