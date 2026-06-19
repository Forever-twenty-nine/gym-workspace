import type { Meta, StoryObj } from '@storybook/angular';
import { RutinaModalComponent } from './rutina-modal.component';

const meta: Meta<RutinaModalComponent> = {
  title: 'Pages/entrenado/creaciones/rutina/rutina-modal',
  component: RutinaModalComponent,
};

export default meta;
type Story = StoryObj<RutinaModalComponent>;

export const Default: Story = {
  args: {
  },
};
