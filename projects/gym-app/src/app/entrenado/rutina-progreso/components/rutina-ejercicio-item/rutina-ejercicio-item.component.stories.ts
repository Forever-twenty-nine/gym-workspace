import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { RutinaEjercicioItemComponent } from './rutina-ejercicio-item.component';

const meta: Meta<RutinaEjercicioItemComponent> = {
  title: 'Secciones/entrenado/rutina-progreso/Componentes/rutina-ejercicio-item',
  component: RutinaEjercicioItemComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinaEjercicioItemComponent>;

export const Pendiente: Story = {
  args: {
    completado: false,
    ejercicio: {
      id: 'ej-1',
      nombre: 'Curl de Bíceps',
      series: 3,
      repeticiones: 12
    } as any
  }
};

export const Completado: Story = {
  args: {
    completado: true,
    ejercicio: {
      id: 'ej-1',
      nombre: 'Curl de Bíceps',
      series: 3,
      repeticiones: 12
    } as any
  }
};
