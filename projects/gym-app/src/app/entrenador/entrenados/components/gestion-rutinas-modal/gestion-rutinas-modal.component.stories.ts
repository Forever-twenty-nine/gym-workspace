import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { GestionRutinasModalComponent } from './gestion-rutinas-modal.component';
import { Plan, Rol } from 'gym-library';

const meta: Meta<GestionRutinasModalComponent> = {
  title: 'Secciones/entrenador/entrenados/Componentes/gestion-rutinas-modal',
  component: GestionRutinasModalComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="relative flex items-center justify-center">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<GestionRutinasModalComponent>;

const mockRutinas = [
  { id: 'r-1', nombre: 'Fuerza Superior', creadorId: 'coach-123', ejerciciosIds: [], diasSemana: ['Lunes', 'Miércoles'], activa: true },
  { id: 'r-2', nombre: 'Hipertrofia Piernas', creadorId: 'coach-123', ejerciciosIds: [], diasSemana: ['Martes'], activa: true }
];

const mockDisponibles = [
  { id: 'r-3', nombre: 'Cardio Quemagrasa', creadorId: 'coach-123', ejerciciosIds: [], diasSemana: [], activa: true },
  { id: 'r-4', nombre: 'PR Sentadillas', creadorId: 'coach-123', ejerciciosIds: [], diasSemana: [], activa: true }
];

export const Premium: Story = {
  args: {
    isOpen: true,
    entrenado: {
      id: 'e-1',
      entrenadoresId: ['coach-123'],
      rutinasAsignadasIds: ['r-1', 'r-2']
    },
    rutinasEntrenado: mockRutinas,
    rutinasDisponibles: mockDisponibles,
    diasSemana: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    plan: Plan.PREMIUM,
    getUserName: (id: string) => 'Juan Pérez',
    getDiasAsignados: (rutinaId: string) => {
      if (rutinaId === 'r-1') return ['Lunes', 'Miércoles'];
      if (rutinaId === 'r-2') return ['Martes'];
      return [];
    }
  }
};
