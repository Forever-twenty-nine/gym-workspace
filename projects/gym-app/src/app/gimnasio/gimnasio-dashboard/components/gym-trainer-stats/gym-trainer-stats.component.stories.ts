import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { GymTrainerStatsComponent } from './gym-trainer-stats.component';

const meta: Meta<GymTrainerStatsComponent> = {
  title: 'Secciones/gimnasio/gimnasio-dashboard/Componentes/gym-trainer-stats',
  component: GymTrainerStatsComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<GymTrainerStatsComponent>;

export const Default: Story = {
  args: {
    totalTrainers: 5,
    activeTrainers: 3,
    avgTraineesPerTrainer: 12.4,
    routinesCreatedByTrainers: 42,
    pendingInvitations: 2
  }
};

export const Empty: Story = {
  args: {
    totalTrainers: 0,
    activeTrainers: 0,
    avgTraineesPerTrainer: 0,
    routinesCreatedByTrainers: 0,
    pendingInvitations: 0
  }
};
