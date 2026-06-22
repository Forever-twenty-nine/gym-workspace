import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { PerfilPage } from './perfil.page';
import { mockProviders } from '../social/testing-mocks';
import { signal } from '@angular/core';
import { EstadisticasEntrenadoService } from '../../core/services/estadisticas-entrenado.service';
import { PlanService } from '../../core/services/plan.service';
import { MensajesGlobalesService } from '../../core/services/mensajes-globales.service';
import { LoadingController } from '@ionic/angular/standalone';

const mockEstadisticasService = {
  initializeListener: () => {},
  stopListener: () => {},
  getEstadisticas: () => signal({
    nivel: 5,
    experiencia: 120,
    experienciaProximoNivel: 500,
    rachaActual: 3,
    mejorRacha: 10
  })
};

const mockPlanService = {
  getSolicitudesUsuarioListener: (userId: string, callback: any) => {
    callback([]);
    return () => {};
  }
};

const mockMensajesGlobalesService = {
  mensajesNoLeidos: signal([])
};

const mockLoadingController = {
  create: () => Promise.resolve({
    present: () => Promise.resolve(),
    dismiss: () => Promise.resolve()
  })
};

const meta: Meta<PerfilPage> = {
  title: 'Secciones/entrenado/perfil',
  component: PerfilPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders,
        { provide: EstadisticasEntrenadoService, useValue: mockEstadisticasService },
        { provide: PlanService, useValue: mockPlanService },
        { provide: MensajesGlobalesService, useValue: mockMensajesGlobalesService },
        { provide: LoadingController, useValue: mockLoadingController }
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<PerfilPage>;

export const Default: Story = {};
