import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { RutinasHistorialComponent } from './rutinas-historial.component';

const meta: Meta<RutinasHistorialComponent> = {
  title: 'Secciones/entrenado/rutinas/components/rutinas-historial',
  component: RutinasHistorialComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinasHistorialComponent>;

export const Default: Story = {
  args: {
    sesiones: [
      {
        id: 'sesion-1',
        fechaInicio: new Date(),
        duracion: 3600,
        completada: true,
        rutinaResumen: {
          nombre: 'Hipertrofia Piernas'
        }
      } as any,
      {
        id: 'sesion-2',
        fechaInicio: new Date(Date.now() - 24 * 3600 * 1000),
        duracion: 2700,
        completada: true,
        rutinaResumen: {
          nombre: 'Fuerza Empuje'
        }
      } as any
    ]
  }
};
