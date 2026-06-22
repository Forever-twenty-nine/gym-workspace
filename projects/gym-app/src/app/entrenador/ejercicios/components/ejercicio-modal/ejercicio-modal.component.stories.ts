import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { EjercicioModalComponent } from './ejercicio-modal.component';

const meta: Meta<EjercicioModalComponent> = {
  title: 'Secciones/entrenador/ejercicios/Componentes/ejercicio-modal',
  component: EjercicioModalComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="relative flex items-center justify-center">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EjercicioModalComponent>;

export const Creating: Story = {
  args: {
    isOpen: true,
    isCreating: true,
    isFreePlan: true,
    ejercicio: {
      nombre: '',
      descripcion: '',
      series: 3,
      repeticiones: 10,
      peso: 0
    }
  }
};

export const EditingPremium: Story = {
  args: {
    isOpen: true,
    isCreating: false,
    isFreePlan: false,
    ejercicio: {
      nombre: 'Sentadillas',
      descripcion: 'Sentadillas profundas con barra libre',
      series: 4,
      repeticiones: 8,
      peso: 80,
      serieSegundos: 45,
      descansoSegundos: 90
    }
  }
};
