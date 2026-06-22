import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { RutinaEjercicioDetalleModalComponent } from './rutina-ejercicio-detalle-modal.component';

const meta: Meta<RutinaEjercicioDetalleModalComponent> = {
  title: 'Secciones/entrenado/rutina-progreso/components/rutina-ejercicio-detalle-modal',
  component: RutinaEjercicioDetalleModalComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinaEjercicioDetalleModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    ejercicio: {
      id: 'ej-1',
      nombre: 'Sentadillas con Barra',
      descripcion: 'Mantén la espalda recta y baja controladamente hasta los 90 grados.',
      videoUrl: '',
      series: 4,
      repeticiones: 12,
      descanso: 90
    } as any
  }
};
