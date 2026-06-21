import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { DashboardPage } from './dashboard.page';
import { mockProviders } from '../social/testing-mocks';

const meta: Meta<DashboardPage> = {
  title: 'Secciones/entrenado/dashboard',
  component: DashboardPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<DashboardPage>;

export const Default: Story = {
  args: {
    
  },
};


