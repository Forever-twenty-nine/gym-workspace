import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { GymTraineeStatsComponent } from './gym-trainee-stats.component';

const meta: Meta<GymTraineeStatsComponent> = {
  title: 'Secciones/gimnasio/gimnasio-dashboard/Componentes/gym-trainee-stats',
  component: GymTraineeStatsComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<GymTraineeStatsComponent>;

export const Default: Story = {
  args: {
    totalTrainees: 45,
    activeTrainees: 38,
    traineesWithoutTrainer: 7
  }
};

export const Empty: Story = {
  args: {
    totalTrainees: 0,
    activeTrainees: 0,
    traineesWithoutTrainer: 0
  }
};
