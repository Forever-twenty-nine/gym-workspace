import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { PerfilTabPlanComponent } from './perfil-tab-plan.component';
import { fn } from '@storybook/test';

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
      plan: 'Básico'
    },
    isPremium: false
  }
};

export const Premium: Story = {
  args: {
    user: {
      plan: 'Premium Anual'
    },
    isPremium: true
  }
};

export const Pending: Story = {
  args: {
    user: {
      plan: 'Básico'
    },
    isPremium: false,
    ultimaSolicitud: {
      estado: 'pestaña'
    }
  }
};