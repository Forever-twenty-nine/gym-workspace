import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, componentWrapperDecorator } from '@storybook/angular';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { RutinaModalComponent } from './rutina-modal.component';

const meta: Meta<RutinaModalComponent> = {
  title: 'Secciones/entrenador/rutinas/Componentes/rutina-modal',
  component: RutinaModalComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ReactiveFormsModule]
    }),
    componentWrapperDecorator((story) => `<ion-app class="relative flex items-center justify-center">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinaModalComponent>;

const mockEjercicios = [
  { id: 'ej-1', nombre: 'Sentadillas' },
  { id: 'ej-2', nombre: 'Press de Banca' },
  { id: 'ej-3', nombre: 'Dominadas' }
];

export const Creating: Story = {
  args: {
    isOpen: true,
    isCreating: true,
    ejercicios: mockEjercicios,
    diasSemana: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    rutinaData: null
  }
};

export const Editing: Story = {
  args: {
    isOpen: true,
    isCreating: false,
    ejercicios: mockEjercicios,
    diasSemana: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    rutinaData: {
      nombre: 'Fuerza Máxima',
      descripcion: 'Entrenamiento enfocado en fuerza pura',
      ejerciciosIds: ['ej-1', 'ej-2'],
      diasSemana: ['Lunes', 'Jueves']
    }
  }
};
