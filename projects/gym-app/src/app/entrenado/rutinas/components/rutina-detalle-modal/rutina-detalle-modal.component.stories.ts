import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { RutinaDetalleModalComponent } from './rutina-detalle-modal.component';

const meta: Meta<RutinaDetalleModalComponent> = {
  title: 'Secciones/entrenado/rutinas/Componentes/rutina-detalle-modal',
  component: RutinaDetalleModalComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinaDetalleModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    esFuturo: false,
    rutina: {
      id: 'rut-1',
      nombre: 'Rutina A: Torso',
      descripcion: 'Rutina enfocada en fuerza e hipertrofia de torso.',
      creadorId: 'user-coach',
      duracionMinutos: 60,
      ejerciciosIds: ['ej-1', 'ej-2']
    } as any,
    ejercicios: [
      {
        id: 'ej-1',
        nombre: 'Press de Banca',
        series: 4,
        repeticiones: 12
      },
      {
        id: 'ej-2',
        nombre: 'Dominadas',
        series: 4,
        repeticiones: 10
      }
    ] as any
  }
};
