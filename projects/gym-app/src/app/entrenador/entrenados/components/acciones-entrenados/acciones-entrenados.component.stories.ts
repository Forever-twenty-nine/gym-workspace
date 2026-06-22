import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { AccionesEntrenadosComponent } from './acciones-entrenados.component';

const meta: Meta<AccionesEntrenadosComponent> = {
  title: 'Secciones/entrenador/entrenados/Componentes/acciones-entrenados',
  component: AccionesEntrenadosComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<AccionesEntrenadosComponent>;

export const Default: Story = {
  args: {
    hasReachedLimit: false,
    limitMessage: 'Clientes activos: 4 de 10 permitidos'
  }
};

export const LimitReached: Story = {
  args: {
    hasReachedLimit: true,
    limitMessage: 'Límite alcanzado en plan gratuito (5 clientes)'
  }
};
