import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { GimnasioEntrenadosPage } from './gimnasio-entrenados.page';
import { mockProviders } from '../../entrenado/social/testing-mocks';

const meta: Meta<GimnasioEntrenadosPage> = {
  title: 'Pages/gimnasio/gimnasio-entrenados',
  component: GimnasioEntrenadosPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<GimnasioEntrenadosPage>;

export const Default: Story = {
  args: {
  },
};

