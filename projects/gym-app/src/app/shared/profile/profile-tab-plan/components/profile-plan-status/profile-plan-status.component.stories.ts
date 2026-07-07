import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { ProfilePlanStatusComponent } from './profile-plan-status.component';

const meta: Meta<ProfilePlanStatusComponent> = {
  title: 'Shared/profile/tabs/plan/plan-status',
  component: ProfilePlanStatusComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<ProfilePlanStatusComponent>;

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