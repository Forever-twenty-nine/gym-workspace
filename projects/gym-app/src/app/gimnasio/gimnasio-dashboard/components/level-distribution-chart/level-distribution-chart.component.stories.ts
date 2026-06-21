import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { LevelDistributionChartComponent } from './level-distribution-chart.component';

const meta: Meta<LevelDistributionChartComponent> = {
  title: 'Secciones/gimnasio/gimnasio-dashboard/Componentes/level-distribution-chart',
  component: LevelDistributionChartComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<LevelDistributionChartComponent>;

export const Default: Story = {
  args: {
    total: 30,
    novato: 15,
    intermedio: 10,
    avanzado: 5
  }
};

export const Empty: Story = {
  args: {
    total: 0,
    novato: 0,
    intermedio: 0,
    avanzado: 0
  }
};
