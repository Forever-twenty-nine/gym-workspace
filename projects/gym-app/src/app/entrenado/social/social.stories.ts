import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { SocialPage } from './social.page';
import { mockProviders } from './testing-mocks';

const meta: Meta<SocialPage> = {
  title: 'Secciones/entrenado/social',
  component: SocialPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<SocialPage>;

export const Default: Story = {};

