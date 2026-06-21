import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { EntrenadorListComponent } from './entrenador-list.component';

const meta: Meta<EntrenadorListComponent> = {
  title: 'Secciones/gimnasio/gimnasio-entrenadores/Componentes/entrenador-list',
  component: EntrenadorListComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EntrenadorListComponent>;

export const Default: Story = {
  args: {
    entrenadores: [
      { uid: '1', nombre: 'Alex Rivera', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
      { uid: '2', nombre: 'Sofia Castro', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia' }
    ],
    desvincular: {
      emit: (user: any) => { console.log('desvincular emitted:', user); }
    } as any
  }
};

export const Empty: Story = {
  args: {
    entrenadores: []
  }
};
