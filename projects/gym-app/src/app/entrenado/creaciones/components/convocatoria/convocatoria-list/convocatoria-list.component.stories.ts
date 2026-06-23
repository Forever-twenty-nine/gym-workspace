import type { Meta, StoryObj } from '@storybook/angular';
import { ConvocatoriaListComponent } from './convocatoria-list.component';

const meta: Meta<ConvocatoriaListComponent> = {
  title: 'Secciones/entrenado/creaciones/Componentes/convocatoria/convocatoria-list',
  component: ConvocatoriaListComponent,
};

export default meta;
type Story = StoryObj<ConvocatoriaListComponent>;

export const Default: Story = {
  args: {
  },
};

