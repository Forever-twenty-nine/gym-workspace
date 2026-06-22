import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { EntrenadoDetallePopoverComponent } from './entrenado-detalle-popover.component';

const meta: Meta<EntrenadoDetallePopoverComponent> = {
  title: 'Secciones/entrenador/entrenados/Componentes/entrenado-detalle-popover',
  component: EntrenadoDetallePopoverComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="relative flex items-center justify-center">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EntrenadoDetallePopoverComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    entrenado: {
      id: 'e-123',
      entrenadoresId: ['coach-123'],
      rutinasAsignadasIds: ['r-1', 'r-2']
    },
    estadisticas: {
      rutinasAsignadas: 2,
      completadas: 15,
      enProgreso: 1,
      tiempoTotal: 3600 * 5 + 120
    },
    getUserName: (id: string) => 'Juan Pérez',
    formatearTiempo: (segundos: number) => '5h 2m',
    getAntiguedadDias: () => 45
  }
};
