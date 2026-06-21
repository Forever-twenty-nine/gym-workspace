import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { ObjectiveDistributionChartComponent } from './objective-distribution-chart.component';

const meta: Meta<ObjectiveDistributionChartComponent> = {
  title: 'Secciones/gimnasio/gimnasio-dashboard/Componentes/objective-distribution-chart',
  component: ObjectiveDistributionChartComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<ObjectiveDistributionChartComponent>;

export const Default: Story = {
  args: {
    total: 20,
    salud: 8,
    volumen: 5,
    definicion: 4,
    fuerza: 3
  }
};

export const Empty: Story = {
  args: {
    total: 0,
    salud: 0,
    volumen: 0,
    definicion: 0,
    fuerza: 0
  }
};
