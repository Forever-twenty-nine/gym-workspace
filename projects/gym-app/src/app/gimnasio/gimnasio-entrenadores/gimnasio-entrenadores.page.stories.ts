import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { GimnasioEntrenadoresPage } from './gimnasio-entrenadores.page';
import { mockProviders } from '../../entrenado/social/testing-mocks';

const meta: Meta<GimnasioEntrenadoresPage> = {
  title: 'Pages/gimnasio/gimnasio-entrenadores',
  component: GimnasioEntrenadoresPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<GimnasioEntrenadoresPage>;

export const Default: Story = {
  args: {
  },
};

