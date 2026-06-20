import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { EjerciciosPage } from './ejercicios.page';
import { mockProviders } from '../../entrenado/social/testing-mocks';

const meta: Meta<EjerciciosPage> = {
  title: 'Pages/entrenador/ejercicios',
  component: EjerciciosPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EjerciciosPage>;

export const Default: Story = {
  args: {
  },
};

