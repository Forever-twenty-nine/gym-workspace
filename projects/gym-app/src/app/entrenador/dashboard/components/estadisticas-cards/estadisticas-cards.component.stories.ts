import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { EstadisticasCardsComponent } from './estadisticas-cards.component';

const meta: Meta<EstadisticasCardsComponent> = {
  title: 'Secciones/entrenador/dashboard/Componentes/estadisticas-cards',
  component: EstadisticasCardsComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EstadisticasCardsComponent>;

export const Free: Story = {
  args: {
    entrenadosCount: 2,
    ejerciciosCount: 5,
    rutinasCount: 3,
    isPremium: false
  }
};

export const Premium: Story = {
  args: {
    entrenadosCount: 15,
    ejerciciosCount: 45,
    rutinasCount: 20,
    isPremium: true
  }
};
