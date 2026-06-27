import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { ProgresoEstadisticasComponent } from './progreso-estadisticas.component';

const meta: Meta<ProgresoEstadisticasComponent> = {
  title: 'Secciones/entrenado/perfil/tabs/estadisticas/componentes/progreso-estadisticas',
  component: ProgresoEstadisticasComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<ProgresoEstadisticasComponent>;

export const Default: Story = {
  args: {
    stats: {
      rutinasAsignadas: 3,
      sesionesTotales: 15,
      completadas: 12,
      enProgreso: 3,
      tiempoTotal: 450
    },
    sesiones: [
      {
        id: 's-1',
        fechaInicio: new Date(),
        completada: true,
        duracion: 3600,
        rutinaResumen: { nombre: 'Fuerza Pecho' }
      } as any
    ],
    dbStats: {
      nivel: 5,
      experiencia: 250,
      experienciaProximoNivel: 1000,
      rachaActual: 4,
      mejorRacha: 12
    } as any
  }
};
