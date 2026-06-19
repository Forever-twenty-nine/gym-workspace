import type { Meta, StoryObj } from '@storybook/angular';
import { DashboardPage } from './dashboard.page';

const meta: Meta<DashboardPage> = {
  title: 'Pages/entrenador/dashboard',
  component: DashboardPage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<DashboardPage>;

export const Default: Story = {
  args: {
  },
};
