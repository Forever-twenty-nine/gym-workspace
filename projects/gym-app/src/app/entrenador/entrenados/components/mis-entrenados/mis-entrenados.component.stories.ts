import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { MisEntrenadosComponent } from './mis-entrenados.component';
import { Entrenado, Objetivo } from 'gym-library';

const meta: Meta<MisEntrenadosComponent> = {
  title: 'Secciones/entrenador/entrenados/Componentes/mis-entrenados',
  component: MisEntrenadosComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<MisEntrenadosComponent>;

const mockEntrenados: Entrenado[] = [
  {
    id: 'user-1',
    entrenadoresId: ['coach-123'],
    rutinasAsignadasIds: ['r-1'],
    objetivo: Objetivo.DEFINICION,
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=juan'
  },
  {
    id: 'user-2',
    entrenadoresId: ['coach-123'],
    rutinasAsignadasIds: [],
    objetivo: Objetivo.VOLUMEN,
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'
  }
];

export const Default: Story = {
  args: {
    entrenados: mockEntrenados,
    getUserName: (id: string) => id === 'user-1' ? 'Juan Pérez' : 'María Gómez',
    estaEntrenando: (id: string) => id === 'user-1',
    getRutinasCount: (id: string) => id === 'user-1' ? 2 : 0
  }
};

export const Empty: Story = {
  args: {
    entrenados: [],
    getUserName: (id: string) => 'Atleta',
    estaEntrenando: (id: string) => false,
    getRutinasCount: (id: string) => 0
  }
};
