import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { RutinaSelfModalComponent } from './rutina-modal.component';
import { mockProviders } from '../../../../social/testing-mocks';

const meta: Meta<RutinaSelfModalComponent> = {
  title: 'Secciones/entrenado/creaciones/Componentes/rutina/rutina-self-modal',
  component: RutinaSelfModalComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinaSelfModalComponent>;

export const Default: Story = {
  args: {
  },
};