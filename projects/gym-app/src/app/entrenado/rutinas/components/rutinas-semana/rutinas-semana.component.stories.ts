import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { RutinasSemanaComponent } from './rutinas-semana.component';

const meta: Meta<RutinasSemanaComponent> = {
  title: 'Secciones/entrenado/rutinas/Componentes/rutinas-semana',
  component: RutinasSemanaComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinasSemanaComponent>;

export const Default: Story = {
  args: {
    rutinasPorDia: [
      {
        fecha: new Date(),
        diaCorto: 'LUN',
        esHoy: true,
        esFuturo: false,
        rutinas: [
          { id: 'rut-1', nombre: 'Pecho y Tríceps' } as any
        ],
        encuentros: [
          { id: 'convo-1', creadorNombre: 'Juan', horaInicio: '18:00', horaFin: '19:00', mensaje: 'Entrenar Pecho' } as any
        ]
      },
      {
        fecha: new Date(Date.now() + 24 * 3600 * 1000),
        diaCorto: 'MAR',
        esHoy: false,
        esFuturo: true,
        rutinas: [],
        encuentros: []
      }
    ]
  }
};

export const SinRutinas: Story = {
  args: {
    rutinasPorDia: [ ]
  }
};
