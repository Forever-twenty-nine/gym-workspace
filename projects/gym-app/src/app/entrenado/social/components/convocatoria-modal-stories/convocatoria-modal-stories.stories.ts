import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { ConvocatoriaModalStoriesComponent } from './convocatoria-modal-stories.component';
import { mockProviders, mockConvocatorias } from '../../testing-mocks';

const meta: Meta<ConvocatoriaModalStoriesComponent> = {
  title: 'Social/ConvocatoriaModalStories',
  component: ConvocatoriaModalStoriesComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    })
  ]
};

export default meta;
type Story = StoryObj<ConvocatoriaModalStoriesComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    convocatoria: mockConvocatorias[0]
  }
};

export const CreatedByMe: Story = {
  args: {
    isOpen: true,
    convocatoria: mockConvocatorias[1]
  }
};
