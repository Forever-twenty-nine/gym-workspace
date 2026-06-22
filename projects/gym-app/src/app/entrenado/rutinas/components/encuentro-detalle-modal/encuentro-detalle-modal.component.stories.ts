import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { EncuentroDetalleModalComponent } from './encuentro-detalle-modal.component';

const meta: Meta<EncuentroDetalleModalComponent> = {
  title: 'Secciones/entrenado/rutinas/components/encuentro-detalle-modal',
  component: EncuentroDetalleModalComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EncuentroDetalleModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    encuentro: {
      id: 'convo-1',
      creadorId: 'user-partner',
      creadorNombre: 'Juan Pérez',
      gimnasioId: 'gym-123',
      fechaCreacion: new Date(),
      fechaEntrenamiento: new Date(Date.now() + 24 * 3600 * 1000),
      horaInicio: '18:00',
      horaFin: '19:30',
      mensaje: 'Entrenamiento de pecho a morir 💪 Traigan agua.',
      interesados: ['user-current', 'user-3'],
      activo: true,
      esOficial: false,
      esSemanal: false
    } as any
  }
};
