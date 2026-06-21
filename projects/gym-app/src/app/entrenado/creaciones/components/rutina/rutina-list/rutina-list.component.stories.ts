import type { Meta, StoryObj } from '@storybook/angular';
import { RutinaListComponent } from './rutina-list.component';
import { Rutina } from 'gym-library';

const meta: Meta<RutinaListComponent> = {
  title: 'Secciones/entrenado/creaciones/rutina/rutina-list',
  component: RutinaListComponent,
};

export default meta;
type Story = StoryObj<RutinaListComponent>;

const mockRutinas: Rutina[] = [
  {
    id: '1',
    nombre: 'Rutina de Hipertrofia',
    activa: true,
    descripcion: 'Rutina enfocada en aumento de masa muscular',
    diasSemana: ['Lunes', 'Miércoles', 'Viernes'],
    esPublica: true,
    fechaCreacion: new Date(),
    creadorId: 'ent1'
  } as any,
  {
    id: '2',
    nombre: 'Rutina de Fuerza',
    activa: false,
    descripcion: 'Entrenamiento de fuerza máxima',
    diasSemana: ['Martes', 'Jueves', 'Sábado'],
    esPublica: false,
    fechaCreacion: new Date(),
    creadorId: 'ent1'
  } as any
];

export const freeUser: Story = {
  args: {
    rutinas: mockRutinas,
    isPremium: false,
  },
};

export const premiumUser: Story = {
  args: {
    rutinas: mockRutinas,
    isPremium: true,
  },
};
export const empty: Story = {
  args: {
    rutinas: [],
    isPremium: false,
  },
};

