import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { InvitacionesPendientesComponent } from './invitaciones-pendientes.component';

const meta: Meta<InvitacionesPendientesComponent> = {
  title: 'Secciones/entrenador/entrenados/Componentes/invitaciones-pendientes',
  component: InvitacionesPendientesComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<InvitacionesPendientesComponent>;

const mockInvitaciones = [
  {
    id: 'inv-1',
    emailDestinatario: 'alumno1@gmail.com',
    fechaEnvio: new Date(Date.now() - 3600000 * 24),
    estado: 'pendiente'
  },
  {
    id: 'inv-2',
    emailDestinatario: 'alumno2@gmail.com',
    fechaEnvio: new Date(Date.now() - 3600000 * 48),
    estado: 'pendiente'
  }
];

export const Default: Story = {
  args: {
    invitaciones: mockInvitaciones
  }
};

export const Empty: Story = {
  args: {
    invitaciones: []
  }
};
