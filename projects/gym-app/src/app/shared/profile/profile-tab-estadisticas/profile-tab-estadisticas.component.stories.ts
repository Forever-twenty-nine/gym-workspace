import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator, applicationConfig } from '@storybook/angular';
import { ProfileTabEstadisticasComponent } from './profile-tab-estadisticas.component';
import { fn } from '@storybook/test';
import { ProfileStatsService } from '../../../core/services/profile-stats.service';
import { signal } from '@angular/core';
import { Rol, Plan } from 'gym-library';

// Mock values
const emptyStatsMock = {
  getEstadisticasGenerales: () => signal(null),
  getHistorialSesiones: () => signal([]),
  getDbEstadisticas: () => signal(null),
};

const fullStatsMock = {
  getEstadisticasGenerales: () => signal({
    rutinasAsignadas: 3,
    sesionesTotales: 15,
    completadas: 12,
    enProgreso: 3,
    tiempoTotal: 600
  }),
  getHistorialSesiones: () => signal([
    {
      id: '1',
      rutinaId: 'r1',
      nombreRutina: 'Fuerza',
      fechaInicio: new Date().toISOString(),
      completada: true,
      duracion: 3600
    }
  ]),
  getDbEstadisticas: () => signal({
    nivel: 5,
    experiencia: 120,
    experienciaProximoNivel: 500,
    rachaActual: 3,
    mejorRacha: 10,
    entrenamientosCompletados: 45,
    tiempoTotalEntrenamiento: 2000
  }),
};

const meta: Meta<ProfileTabEstadisticasComponent> = {
  title: 'Shared/profile/tabs/estadisticas',
  component: ProfileTabEstadisticasComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    viewPlansClick: fn()
  }
};

export default meta;
type Story = StoryObj<ProfileTabEstadisticasComponent>;

export const Free: Story = {
  decorators: [
    applicationConfig({
      providers: [
        { provide: ProfileStatsService, useValue: emptyStatsMock }
      ]
    })
  ],
  args: {
    user: {
      nombre: 'Juan Pérez',
      role: Rol.ENTRENADO,
      plan: Plan.FREE
    } as any
  }
};

export const PremiumWithStats: Story = {
  decorators: [
    applicationConfig({
      providers: [
        { provide: ProfileStatsService, useValue: fullStatsMock }
      ]
    })
  ],
  args: {
    user: {
      nombre: 'Juan Pérez',
      role: Rol.ENTRENADO,
      plan: Plan.PREMIUM
    } as any
  }
};

export const PremiumLoading: Story = {
  decorators: [
    applicationConfig({
      providers: [
        { provide: ProfileStatsService, useValue: emptyStatsMock }
      ]
    })
  ],
  args: {
    user: {
      nombre: 'Juan Pérez',
      role: Rol.ENTRENADO,
      plan: Plan.PREMIUM
    } as any
  }
};
