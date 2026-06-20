import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { EntrenadosPage } from './entrenados.page';
import { mockProviders } from '../../entrenado/social/testing-mocks';

const meta: Meta<EntrenadosPage> = {
  title: 'Pages/entrenador/entrenados',
  component: EntrenadosPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EntrenadosPage>;

export const Default: Story = {
  args: {
  },
};

