import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { PerfilStatsTeaserComponent } from './perfil-stats-teaser.component';
import { fn } from '@storybook/test';

const meta: Meta<PerfilStatsTeaserComponent> = {
  title: 'Secciones/entrenado/perfil/componentes/stats-teaser',
  component: PerfilStatsTeaserComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    viewPlansClick: fn()
  }
};

export default meta;
type Story = StoryObj<PerfilStatsTeaserComponent>;

export const Default: Story = {};