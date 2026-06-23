import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { RutinaOverlayComponent } from './rutina-overlay.component';

const meta: Meta<RutinaOverlayComponent> = {
  title: 'Secciones/entrenado/rutina-progreso/Componentes/rutina-overlay',
  component: RutinaOverlayComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinaOverlayComponent>;

export const Start: Story = {
  args: {
    type: 'start',
    title: '¡Hora de entrenar!',
    subtitle: 'Completa todos los ejercicios programados para hoy.',
    icon: 'barbell-outline',
    buttonText: 'Comenzar Entrenamiento',
    buttonColor: 'primary',
    buttonFill: 'solid',
    expand: 'block',
    yaRealizadaHoy: false,
    hideButton: false
  }
};

export const Success: Story = {
  args: {
    type: 'success',
    title: '¡Felicitaciones!',
    subtitle: 'Has completado todos los ejercicios de la rutina de hoy.',
    icon: 'checkmark-circle-outline',
    buttonText: 'Finalizar',
    buttonColor: 'success',
    buttonFill: 'solid',
    expand: 'block',
    yaRealizadaHoy: false,
    hideButton: false
  }
};
