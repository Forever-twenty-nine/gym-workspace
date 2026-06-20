import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { RutinaModalComponent } from './rutina-modal.component';
import { mockProviders } from '../../../../social/testing-mocks';

const meta: Meta<RutinaModalComponent> = {
  title: 'Pages/entrenado/creaciones/rutina/rutina-modal',
  component: RutinaModalComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinaModalComponent>;

export const Default: Story = {
  args: {
  },
};

