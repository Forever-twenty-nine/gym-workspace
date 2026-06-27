import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { PerfilTabInfoComponent } from './perfil-tab-info.component';
import { fn } from '@storybook/test';

const meta: Meta<PerfilTabInfoComponent> = {
  title: 'Secciones/entrenado/perfil/tabs/info',
  component: PerfilTabInfoComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    editClick: fn(),
    viewPlansClick: fn(),
    logoutClick: fn()
  }
};

export default meta;
type Story = StoryObj<PerfilTabInfoComponent>;

export const Free: Story = {
  args: {
    user: {
      nombre: 'Juan Pérez',
      role: 'entrenado',
      plan: 'FREE'
    },
    initials: 'JP',
    roleDisplayName: 'Entrenado',
    isPremium: false
  }
};

export const Premium: Story = {
  args: {
    user: {
      nombre: 'Juan Pérez',
      role: 'entrenado',
      plan: 'PREMIUM'
    },
    initials: 'JP',
    roleDisplayName: 'Entrenado',
    isPremium: true,
    estadisticasGenerales: {
      nivel: 5,
      experiencia: 120,
      experienciaProximoNivel: 500
    }
  }
};