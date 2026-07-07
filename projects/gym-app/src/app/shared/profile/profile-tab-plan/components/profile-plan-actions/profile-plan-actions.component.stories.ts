import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { ProfilePlanActionsComponent } from './profile-plan-actions.component';
import { fn } from '@storybook/test';

const meta: Meta<ProfilePlanActionsComponent> = {
  title: 'Shared/profile/tabs/plan/plan-actions',
  component: ProfilePlanActionsComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    openPremiumModal: fn()
  }
};

export default meta;
type Story = StoryObj<ProfilePlanActionsComponent>;

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
      estado: 'PENDIENTE',
      fechaCreacion: new Date().toISOString()
    }
  }
};

export const alreadyPremium: Story = {
  args: {
    isPremium: true
  }
};