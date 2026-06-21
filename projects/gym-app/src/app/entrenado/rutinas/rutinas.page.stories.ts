import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { RutinasPage } from './rutinas.page';
import { mockProviders } from '../social/testing-mocks';

const meta: Meta<RutinasPage> = {
  title: 'Secciones/entrenado/rutinas',
  component: RutinasPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinasPage>;

export const Default: Story = {
  args: {
  },
};


