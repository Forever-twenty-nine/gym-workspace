import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { RutinasAsignadasComponent } from './rutinas-asignadas.component';

const meta: Meta<RutinasAsignadasComponent> = {
  title: 'Secciones/entrenado/dashboard/Componentes/rutinas-asignadas',
  component: RutinasAsignadasComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinasAsignadasComponent>;

export const Default: Story = {
  args: {
    entrenador: {
      nombre: 'Carlos Trainer',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
    },
    rutinas: [
      {
        id: 'rutina-1',
        nombre: 'Hipertrofia de Pecho',
        ejerciciosIds: [],
        creadorId: 'trainer-1',
        esEjecutable: true,
        activa: true
      },
      {
        id: 'rutina-2',
        nombre: 'Piernas y Pantorrillas',
        ejerciciosIds: [],
        creadorId: 'trainer-1',
        fecha: new Date(Date.now() + 24 * 3600 * 1000),
        activa: true
      },
      {
        id: 'rutina-3',
        nombre: 'Full Body Acondicionamiento',
        ejerciciosIds: [],
        creadorId: 'trainer-1',
        fecha: new Date(Date.now() + 48 * 3600 * 1000),
        activa: true
      }
    ]
  }
};

export const SinRutinas: Story = {
  args: {
    entrenador: null,
    rutinas: []
  }
};

