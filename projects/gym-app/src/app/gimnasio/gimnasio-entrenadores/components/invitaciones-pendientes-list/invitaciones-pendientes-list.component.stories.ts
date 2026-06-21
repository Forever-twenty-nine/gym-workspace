import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { InvitacionesPendientesListComponent } from './invitaciones-pendientes-list.component';

const meta: Meta<InvitacionesPendientesListComponent> = {
  title: 'Secciones/gimnasio/gimnasio-entrenadores/Componentes/invitaciones-pendientes-list',
  component: InvitacionesPendientesListComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<InvitacionesPendientesListComponent>;

export const Default: Story = {
  args: {
    invitaciones: [
      {
        id: 'inv1',
        entrenadorNombre: 'Carlos Santana',
        emailDestinatario: 'carlos@gym.com',
        fechaCreacion: new Date('2026-06-20T10:00:00Z').getTime()
      },
      {
        id: 'inv2',
        entrenadorNombre: '',
        emailDestinatario: 'laura@gym.com',
        fechaCreacion: new Date('2026-06-21T08:30:00Z').getTime()
      }
    ],
    cancelar: {
      emit: (id: string) => { console.log('cancelar emitted:', id); }
    } as any
  }
};

export const Empty: Story = {
  args: {
    invitaciones: []
  }
};
