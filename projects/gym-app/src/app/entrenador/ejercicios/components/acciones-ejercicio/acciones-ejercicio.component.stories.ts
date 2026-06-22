import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { AccionesEjercicioComponent } from './acciones-ejercicio.component';

const meta: Meta<AccionesEjercicioComponent> = {
  title: 'Secciones/entrenador/ejercicios/Componentes/acciones-ejercicio',
  component: AccionesEjercicioComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<AccionesEjercicioComponent>;

export const Default: Story = {
  args: {
    hasReachedLimit: false,
    limitMessage: 'Has creado 5 de 10 ejercicios permitidos'
  }
};

export const LimitReached: Story = {
  args: {
    hasReachedLimit: true,
    limitMessage: 'Límite alcanzado en plan gratuito (5 ejercicios)'
  }
};
