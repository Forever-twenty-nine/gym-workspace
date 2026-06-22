import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { MisEntrenadosComponent, EntrenadoViewModel } from './mis-entrenados.component';
import { Objetivo } from 'gym-library';

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

const mockEntrenadosVM: EntrenadoViewModel[] = [
  {
    id: 'user-1',
    nombre: 'Juan Pérez',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=juan',
    objetivo: Objetivo.DEFINICION,
    estaEntrenando: true,
    rutinasCount: 2,
    entrenado: {
      id: 'user-1',
      entrenadoresId: ['coach-123'],
      rutinasAsignadasIds: ['r-1', 'r-2'],
      objetivo: Objetivo.DEFINICION,
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=juan'
    }
  },
  {
    id: 'user-2',
    nombre: 'María Gómez',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
    objetivo: Objetivo.VOLUMEN,
    estaEntrenando: false,
    rutinasCount: 0,
    entrenado: {
      id: 'user-2',
      entrenadoresId: ['coach-123'],
      rutinasAsignadasIds: [],
      objetivo: Objetivo.VOLUMEN,
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'
    }
  }
];

export const Default: Story = {
  args: {
    entrenados: mockEntrenadosVM
  }
};

export const Empty: Story = {
  args: {
    entrenados: []
  }
};
