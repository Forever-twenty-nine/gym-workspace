import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { PerfilPlanActionsComponent } from './perfil-plan-actions.component';
import { fn } from '@storybook/test';

const meta: Meta<PerfilPlanActionsComponent> = {
  title: 'Secciones/entrenado/perfil/componentes/plan-actions',
  component: PerfilPlanActionsComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    openPremiumModal: fn()
  }
};

export default meta;
type Story = StoryObj<PerfilPlanActionsComponent>;

export const upgradeAvailable: Story = {
  args: {
    isPremium: false,
    ultimaSolicitud: null
  }
};

export const pendingRequest: Story = {
  args: {
    isPremium: false,
    ultimaSolicitud: {
      estado: 'pestaña'
    }
  }
};

export const alreadyPremium: Story = {
  args: {
    isPremium: true
  }
};