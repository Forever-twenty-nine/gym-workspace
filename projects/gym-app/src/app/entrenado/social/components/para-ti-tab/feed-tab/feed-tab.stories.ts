import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { FeedTabComponent } from './feed-tab.component';
import { mockProviders } from '../../../testing-mocks';

const meta: Meta<FeedTabComponent> = {
  title: 'Secciones/entrenado/social/Componentes/para-ti-tab/feed-tab',
  component: FeedTabComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app><ion-content style="--background: transparent;">${story}</ion-content></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<FeedTabComponent>;

export const ParaTi: Story = {
  args: {
    tab: 'para-ti'
  }
};

export const Siguiendo: Story = {
  args: {
    tab: 'siguiendo'
  }
};

