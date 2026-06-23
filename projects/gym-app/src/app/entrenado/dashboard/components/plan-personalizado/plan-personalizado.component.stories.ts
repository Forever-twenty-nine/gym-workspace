import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { PlanPersonalizadoComponent } from './plan-personalizado.component';
import { Objetivo } from 'gym-library';

const meta: Meta<PlanPersonalizadoComponent> = {
  title: 'Secciones/entrenado/dashboard/Componentes/plan-personalizado',
  component: PlanPersonalizadoComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<PlanPersonalizadoComponent>;

export const Default: Story = {
  args: {
    nivel: 'Intermedio',
    objetivo: Objetivo.VOLUMEN,
    frecuencia: 4,
    entrenadorAsignado: 'Carlos Trainer',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  }
};

export const SinEntrenador: Story = {
  args: {
    nivel: 'Principiante',
    objetivo: Objetivo.DEFINICION,
    frecuencia: 3,
    entrenadorAsignado: undefined,
    photoURL: undefined
  }
};

