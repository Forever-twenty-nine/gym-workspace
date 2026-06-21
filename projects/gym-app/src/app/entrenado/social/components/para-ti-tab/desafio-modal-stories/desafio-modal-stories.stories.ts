import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { DesafioModalStoriesComponent } from './desafio-modal-stories.component';
import { mockProviders, mockDesafios } from '../../../testing-mocks';

const meta: Meta<DesafioModalStoriesComponent> = {
  title: 'Secciones/entrenado/social/components/DesafioModalStories',
  component: DesafioModalStoriesComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    })
  ]
};

export default meta;
type Story = StoryObj<DesafioModalStoriesComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    desafio: mockDesafios[0]
  }
};

export const CreatedByMe: Story = {
  args: {
    isOpen: true,
    desafio: mockDesafios[1]
  }
};

