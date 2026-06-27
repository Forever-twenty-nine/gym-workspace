import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { PerfilPage } from './perfil.page';
import { mockProviders } from '../social/testing-mocks';
import { signal } from '@angular/core';
import { EstadisticasEntrenadoService } from '../../core/services/estadisticas-entrenado.service';
import { PlanService } from '../../core/services/plan.service';
import { MensajesGlobalesService } from '../../core/services/mensajes-globales.service';
import { LoadingController } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { PerfilEstadisticasService } from '../../core/services/perfil-estadisticas.service';

const mockAuthService = {
  currentUser: signal({
    uid: 'user-current',
    nombre: 'Mi Perfil',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    gimnasioId: 'gym-123',
    plan: 'FREE',
    role: 'entrenado'
  }),
  logout: () => Promise.resolve()
};

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

const mockPerfilEstadisticasService = {
  getEstadisticasGenerales: () => signal({
    rutinasAsignadas: 3,
    sesionesTotales: 15,
    completadas: 12,
    enProgreso: 3,
    tiempoTotal: 600
  }),
  getHistorialSesiones: () => signal([]),
  getDbEstadisticas: () => signal({
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
        { provide: AuthService, useValue: mockAuthService },
        { provide: EstadisticasEntrenadoService, useValue: mockEstadisticasService },
        { provide: PerfilEstadisticasService, useValue: mockPerfilEstadisticasService },
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

export const Free: Story = {};

export const Premium: Story = {
  decorators: [
    applicationConfig({
      providers: [
        { 
          provide: AuthService, 
          useValue: {
            ...mockAuthService,
            currentUser: signal({ ...mockAuthService.currentUser(), plan: 'PREMIUM' })
          } 
        }
      ]
    })
  ]
};

export const WithUnreadMessages: Story = {
  decorators: [
    applicationConfig({
      providers: [
        { provide: MensajesGlobalesService, useValue: { mensajesNoLeidos: signal([{ id: 1, contenido: 'Mensaje no leído' }]) } }
      ]
    })
  ]
};
