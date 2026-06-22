import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { ListaRutinasComponent } from './lista-rutinas.component';

const meta: Meta<ListaRutinasComponent> = {
  title: 'Secciones/entrenador/rutinas/Componentes/lista-rutinas',
  component: ListaRutinasComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<ListaRutinasComponent>;

const mockRutinas = [
  {
    id: 'r-1',
    nombre: 'Acondicionamiento Físico',
    ejerciciosIds: ['ej-1', 'ej-2'],
    diasSemana: ['Lunes', 'Miércoles']
  },
  {
    id: 'r-2',
    nombre: 'Hipertrofia Glúteos y Femorales',
    ejerciciosIds: ['ej-3', 'ej-4'],
    diasSemana: ['Martes', 'Viernes']
  }
];

export const Default: Story = {
  args: {
    rutinas: mockRutinas
  }
};

export const Empty: Story = {
  args: {
    rutinas: []
  }
};
