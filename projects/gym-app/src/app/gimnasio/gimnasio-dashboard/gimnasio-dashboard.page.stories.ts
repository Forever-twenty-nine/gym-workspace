import type { Meta, StoryObj } from '@storybook/angular';
import { GimnasioDashboardPage } from './gimnasio-dashboard.page';

const meta: Meta<GimnasioDashboardPage> = {
  title: 'Pages/gimnasio/gimnasio-dashboard',
  component: GimnasioDashboardPage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<GimnasioDashboardPage>;

export const Default: Story = {
  args: {
  },
};
