import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { CrearAgendaModalComponent } from './crear-agenda-modal.component';
import { mockProviders } from '../../../../entrenado/social/testing-mocks';

const meta: Meta<CrearAgendaModalComponent> = {
  title: 'Secciones/entrenador/agenda/Componentes/crear-agenda-modal',
  component: CrearAgendaModalComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app class="relative flex items-center justify-center">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<CrearAgendaModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true
  }
};
