import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { ConvocatoriaModalStoriesComponent } from './convocatoria-modal-stories.component';
import { mockProviders, mockConvocatorias } from '../../../testing-mocks';

const meta: Meta<ConvocatoriaModalStoriesComponent> = {
  title: 'Secciones/entrenado/social/Componentes/para-ti-tab/convocatoria-modal-stories',
  component: ConvocatoriaModalStoriesComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    })
  ]
};

export default meta;
type Story = StoryObj<ConvocatoriaModalStoriesComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    convocatoria: {
      "id": "convo-1",
      "creadorId": "user-partner",
      "creadorNombre": "Juan sebas",
      "gimnasioId": "gym-123",
      "fechaCreacion": new Date("2026-06-11T19:45:37.444Z"),
      "fechaEntrenamiento": new Date("2026-06-12T19:45:37.444Z"),
      "horaInicio": "18:00",
      "horaFin": "19:30",
      "mensaje": "Entrenamiento de pecho a morir 💪 Traigan agua.",
      "interesados": ["user-current", "user-3"],
      "activo": true,
      "esOficial": false,
      "esSemanal": false
    }
  }
};

export const CreatedByMe: Story = {
  args: {
    isOpen: true,
    convocatoria: mockConvocatorias[1]
  }
};

