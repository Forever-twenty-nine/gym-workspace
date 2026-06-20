import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { InvitacionesPendientesComponent } from './invitaciones-pendientes.component';

const meta: Meta<InvitacionesPendientesComponent> = {
  title: 'Pages/entrenado/dashboard/components/InvitacionesPendientes',
  component: InvitacionesPendientesComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<InvitacionesPendientesComponent>;

export const Default: Story = {
  args: {
    invitaciones: [
      {
        id: 'inv-1',
        remitenteId: 'trainer-1',
        destinatarioId: 'user-current',
        remitenteNombre: 'Carlos Trainer',
        entrenadorNombre: 'Carlos Trainer',
        tipo: 'entrenador_a_entrenado',
        estado: 'pendiente',
        mensajePersonalizado: 'Carlos Trainer quiere ser tu entrenador personal.',
        fechaCreacion: new Date(),
        activa: true
      }
    ]
  }
};



export const Vacia: Story = {
  args: {
    invitaciones: []
  }
};
