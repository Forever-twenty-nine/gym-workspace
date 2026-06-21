import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { EntrenadosGroupedListComponent } from './entrenados-grouped-list.component';

const meta: Meta<EntrenadosGroupedListComponent> = {
  title: 'Secciones/gimnasio/gimnasio-entrenados/Componentes/entrenados-grouped-list',
  component: EntrenadosGroupedListComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EntrenadosGroupedListComponent>;

export const Default: Story = {
  args: {
    groupedUsers: [
      {
        trainerName: 'Marcos Díaz',
        users: [
          { uid: '1', nombre: 'Andrés Morales', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=andres' },
          { uid: '2', nombre: 'Florencia Ruiz', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=florencia' }
        ]
      },
      {
        trainerName: 'Sin entrenador',
        users: [
          { uid: '3', nombre: 'Mateo Gómez', photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mateo' }
        ]
      }
    ]
  }
};

export const Empty: Story = {
  args: {
    groupedUsers: []
  }
};
