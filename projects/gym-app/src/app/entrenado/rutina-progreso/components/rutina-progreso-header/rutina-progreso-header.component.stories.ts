import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { RutinaProgresoHeaderComponent } from './rutina-progreso-header.component';

const meta: Meta<RutinaProgresoHeaderComponent> = {
  title: 'Secciones/entrenado/rutina-progreso/components/rutina-progreso-header',
  component: RutinaProgresoHeaderComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinaProgresoHeaderComponent>;

export const Default: Story = {
  args: {
    porcentaje: 45,
    tiempo: '12:34',
    estado: 'En progreso',
    iniciada: true
  }
};
