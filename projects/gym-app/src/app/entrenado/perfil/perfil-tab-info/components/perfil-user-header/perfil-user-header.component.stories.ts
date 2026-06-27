import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { PerfilUserHeaderComponent } from './perfil-user-header.component';
import { fn } from '@storybook/test';

const meta: Meta<PerfilUserHeaderComponent> = {
  title: 'Secciones/entrenado/perfil/tabs/info/componentes/user-header',
  component: PerfilUserHeaderComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    editClick: fn()
  }
};

export default meta;
type Story = StoryObj<PerfilUserHeaderComponent>;

export const Default: Story = {
  args: {
    user: {
      nombre: 'Juan Pérez',
      role: 'entrenado',
      photoURL: 'https://ionicframework.com/docs/img/demos/avatar.svg'
    },
    entrenado: {
      objetivo: 'Bajar de peso',
      nivel: 'Intermedio'
    },
    initials: 'JP',
    roleDisplayName: 'Entrenado'
  }
};

export const WithoutPhoto: Story = {
  args: {
    user: {
      nombre: 'Ana García',
      role: 'entrenado'
    },
    entrenado: {
      objetivo: 'Ganar masa muscular',
      nivel: 'Avanzado'
    },
    initials: 'AG',
    roleDisplayName: 'Entrenado'
  }
};