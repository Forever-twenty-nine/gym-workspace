import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { PerfilTabInfoComponent } from './perfil-tab-info.component';
import { fn } from '@storybook/test';
import { Rol, Plan } from 'gym-library';

const meta: Meta<PerfilTabInfoComponent> = {
  title: 'Secciones/entrenado/perfil/tabs/info',
  component: PerfilTabInfoComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    editClick: fn(),
    logoutClick: fn()
  }
};

export default meta;
type Story = StoryObj<PerfilTabInfoComponent>;

export const Free: Story = {
  args: {
    user: {
      nombre: 'Juan Pérez',
      role: Rol.ENTRENADO,
      plan: Plan.FREE
    } as any,
    currentEntrenado: {
      objetivo: 'Bajar de peso',
      nivel: 'Intermedio'
    } as any
  }
};

export const Premium: Story = {
  args: {
    user: {
      nombre: 'Juan Pérez',
      role: Rol.ENTRENADO,
      plan: Plan.PREMIUM
    } as any,
    currentEntrenado: {
      objetivo: 'Ganar masa muscular',
      nivel: 'Avanzado'
    } as any
  }
};