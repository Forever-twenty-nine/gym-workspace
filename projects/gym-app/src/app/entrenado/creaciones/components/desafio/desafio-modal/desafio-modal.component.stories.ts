import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { DesafioModalComponent } from './desafio-modal.component';
import { mockProviders } from '../../../../social/testing-mocks';

const meta: Meta<DesafioModalComponent> = {
  title: 'Pages/entrenado/creaciones/desafio/desafio-modal',
  component: DesafioModalComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<DesafioModalComponent>;

export const Default: Story = {
  args: {
  },
};

