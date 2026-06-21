import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { GimnasioDashboardPage } from './gimnasio-dashboard.page';
import { mockProviders } from '../../entrenado/social/testing-mocks';

const meta: Meta<GimnasioDashboardPage> = {
  title: 'Secciones/gimnasio/gimnasio-dashboard',
  component: GimnasioDashboardPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<GimnasioDashboardPage>;

export const Default: Story = {
  args: {
  },
};

