import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { EntrenadoTabsPage } from './entrenado-tabs.page';
import { mockProviders } from '../social/testing-mocks';

const meta: Meta<EntrenadoTabsPage> = {
  title: 'Secciones/entrenado/entrenado-tabs',
  component: EntrenadoTabsPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EntrenadoTabsPage>;

export const Default: Story = {};
