import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { ConvocatoriaModalComponent } from './convocatoria-modal.component';
import { mockProviders } from '../../../../social/testing-mocks';

const meta: Meta<ConvocatoriaModalComponent> = {
  title: 'Pages/entrenado/creaciones/convocatoria/convocatoria-modal',
  component: ConvocatoriaModalComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<ConvocatoriaModalComponent>;

export const Default: Story = {
  args: {
  },
};

