import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { ConvocatoriaListComponent } from './convocatoria-list.component';

const meta: Meta<ConvocatoriaListComponent> = {
  title: 'Secciones/entrenador/agenda/Componentes/convocatoria-list',
  component: ConvocatoriaListComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<ConvocatoriaListComponent>;

const mockItems = [
  {
    convocatoria: {
      id: 'convo-1',
      titulo: 'WOD CrossFit Oficial',
      mensaje: '5 Rounds of:\n- 10 Thrusters (95/65 lbs)\n- 10 Pull-ups',
      horaInicio: '08:00',
      horaFin: '09:00',
      esOficial: true,
      esSemanal: true
    },
    fechaFormateada: 'Hoy',
    asistentes: [
      { name: 'Juan Pérez', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=juan' },
      { name: 'María Gómez', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria' }
    ]
  },
  {
    convocatoria: {
      id: 'convo-2',
      titulo: 'Entrenamiento libre',
      mensaje: '¿Quién para hacer un entrenamiento de fuerza de piernas hoy por la tarde?',
      horaInicio: '17:00',
      horaFin: '18:30',
      esOficial: false,
      esSemanal: false
    },
    creadorName: 'Carlos López',
    creadorPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
    fechaFormateada: 'Mañana',
    asistentes: [
      { name: 'Sofía Díaz', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia' }
    ]
  }
];

export const Default: Story = {
  args: {
    items: mockItems,
    emptyTitle: 'Sin entrenamientos',
    emptyMessage: 'No hay entrenamientos planificados para esta semana.',
    emptyIcon: 'calendar-outline'
  }
};

export const Empty: Story = {
  args: {
    items: [],
    emptyTitle: 'Agenda vacía',
    emptyMessage: 'No tienes entrenamientos o WODs planificados para hoy o mañana.',
    emptyIcon: 'calendar-outline'
  }
};
