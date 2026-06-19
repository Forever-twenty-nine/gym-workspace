import type { Meta, StoryObj } from '@storybook/angular';
import { ConvocatoriaModalComponent } from './convocatoria-modal.component';

const meta: Meta<ConvocatoriaModalComponent> = {
  title: 'Pages/entrenado/creaciones/convocatoria/convocatoria-modal',
  component: ConvocatoriaModalComponent,
};

export default meta;
type Story = StoryObj<ConvocatoriaModalComponent>;

export const Default: Story = {
  args: {
  },
};
