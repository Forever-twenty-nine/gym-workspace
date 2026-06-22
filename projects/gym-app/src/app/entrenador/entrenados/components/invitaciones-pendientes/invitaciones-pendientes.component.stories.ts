import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { InvitacionesPendientesComponent, InvitacionViewModel } from './invitaciones-pendientes.component';

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

const mockInvitacionesVM: InvitacionViewModel[] = [
  {
    id: 'inv-1',
    nombre: 'Alumno Uno',
    email: 'alumno1@gmail.com',
    fechaCreacion: new Date(Date.now() - 3600000 * 24)
  },
  {
    id: 'inv-2',
    nombre: 'Alumno Dos',
    email: 'alumno2@gmail.com',
    fechaCreacion: new Date(Date.now() - 3600000 * 48)
  }
];

export const Default: Story = {
  args: {
    invitaciones: mockInvitacionesVM
  }
};

export const Empty: Story = {
  args: {
    invitaciones: []
  }
};
