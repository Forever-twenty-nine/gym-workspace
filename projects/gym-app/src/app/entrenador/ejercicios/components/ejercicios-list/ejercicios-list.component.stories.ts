import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { EjerciciosListComponent } from './ejercicios-list.component';

const meta: Meta<EjerciciosListComponent> = {
  title: 'Secciones/entrenador/ejercicios/Componentes/ejercicios-list',
  component: EjerciciosListComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EjerciciosListComponent>;

const mockEjercicios = [
  {
    id: 'ej-1',
    nombre: 'Sentadillas con barra',
    grupoMuscular: 'Piernas',
    explicacion: 'Mantén la espalda recta y baja hasta un ángulo de 90 grados.'
  },
  {
    id: 'ej-2',
    nombre: 'Press de Banca',
    grupoMuscular: 'Pecho',
    explicacion: 'Empuja la barra de forma controlada desde el pecho hasta extender los brazos.'
  },
  {
    id: 'ej-3',
    nombre: 'Dominadas',
    grupoMuscular: 'Espalda',
    explicacion: 'Sube hasta que tu barbilla pase la barra, controlando la bajada.'
  }
];

export const Default: Story = {
  args: {
    ejercicios: mockEjercicios
  }
};

export const Empty: Story = {
  args: {
    ejercicios: []
  }
};
