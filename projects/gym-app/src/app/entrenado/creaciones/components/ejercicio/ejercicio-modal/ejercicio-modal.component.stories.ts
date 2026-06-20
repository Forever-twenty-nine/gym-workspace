import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { EjercicioModalComponent } from './ejercicio-modal.component';
import { mockProviders } from '../../../../social/testing-mocks';

const meta: Meta<EjercicioModalComponent> = {
  title: 'Pages/entrenado/creaciones/ejercicio/ejercicio-modal',
  component: EjercicioModalComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EjercicioModalComponent>;

export const Default: Story = {
  args: {
  },
};

