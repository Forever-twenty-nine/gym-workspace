import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { AgendaPage } from './agenda.page';
import { mockProviders } from '../../entrenado/social/testing-mocks';

const meta: Meta<AgendaPage> = {
  title: 'Secciones/entrenador/agenda',
  component: AgendaPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<AgendaPage>;

export const Default: Story = {
  args: {
  },
};


