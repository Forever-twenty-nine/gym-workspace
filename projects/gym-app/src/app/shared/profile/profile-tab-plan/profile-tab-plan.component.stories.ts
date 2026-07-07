import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { ProfileTabPlanComponent } from './profile-tab-plan.component';
import { fn } from '@storybook/test';
import { Plan } from 'gym-library';

const meta: Meta<ProfileTabPlanComponent> = {
  title: 'Shared/profile/tabs/plan',
  component: ProfileTabPlanComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    openPremiumModal: fn()
  }
};

export default meta;
type Story = StoryObj<ProfileTabPlanComponent>;

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