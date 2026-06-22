import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { CreacionesPage } from './creaciones.page';
import { mockProviders } from '../social/testing-mocks';

const meta: Meta<CreacionesPage> = {
  title: 'Secciones/entrenado/creaciones',
  component: CreacionesPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<CreacionesPage>;

export const Default: Story = {};
