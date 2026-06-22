import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { ProximosEntrenadosComponent } from './proximos-entrenados.component';

const meta: Meta<ProximosEntrenadosComponent> = {
  title: 'Secciones/entrenador/dashboard/Componentes/proximos-entrenados',
  component: ProximosEntrenadosComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<ProximosEntrenadosComponent>;

const mockEntrenados = [
  {
    id: 'user-1',
    usuarioId: 'user-1',
    nombreRutina: 'Rutina Fuerza A',
    diaTexto: 'Hoy',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=juan'
  },
  {
    id: 'user-2',
    usuarioId: 'user-2',
    nombreRutina: 'Hipertrofia de Hombros',
    diaTexto: 'Mañana',
    photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria'
  }
];

export const Default: Story = {
  args: {
    entrenados: mockEntrenados,
    getUserName: (id: string) => {
      if (id === 'user-1') return 'Juan Pérez';
      if (id === 'user-2') return 'María Gómez';
      return 'Atleta';
    }
  }
};

export const Empty: Story = {
  args: {
    entrenados: [],
    getUserName: (id: string) => 'Atleta'
  }
};
