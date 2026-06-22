import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { AccionesRutinaComponent } from './acciones-rutina.component';

const meta: Meta<AccionesRutinaComponent> = {
  title: 'Secciones/entrenador/rutinas/Componentes/acciones-rutina',
  component: AccionesRutinaComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<AccionesRutinaComponent>;

export const Default: Story = {
  args: {
    hasReachedLimit: false,
    limitMessage: 'Rutinas creadas: 3 de 5 permitidas'
  }
};

export const LimitReached: Story = {
  args: {
    hasReachedLimit: true,
    limitMessage: 'Límite alcanzado en plan gratuito (5 rutinas)'
  }
};
