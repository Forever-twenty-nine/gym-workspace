import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { signal } from '@angular/core';
import { EntrenadosPage } from './entrenados.page';
import { mockProviders } from '../../entrenado/social/testing-mocks';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { UserService } from '../../core/services/user.service';
import { InvitacionService } from '../../core/services/invitacion.service';
import { AuthService } from '../../core/services/auth.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { Plan } from 'gym-library';

const mockUsers = [
  { uid: 'coach-1', nombre: 'Entrenador de Prueba', role: 'entrenador', plan: Plan.PREMIUM },
  { uid: 'client-1', nombre: 'Carlos Rodríguez', photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', role: 'entrenado' },
  { uid: 'client-2', nombre: 'María Fernández', photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', role: 'entrenado' }
];

const mockEntrenadosList = [
  { id: 'client-1', entrenadoresId: ['coach-1'], rutinasAsignadasIds: ['rut-1'] },
  { id: 'client-2', entrenadoresId: ['coach-1'], rutinasAsignadasIds: [] }
];

const mockInvitacionesList = [
  { id: 'inv-1', entrenadorId: 'coach-1', entrenadoNombre: 'Pedro Gómez', emailEntrenado: 'pedro@test.com', fechaCreacion: new Date() }
];

const meta: Meta<EntrenadosPage> = {
  title: 'Secciones/entrenador/entrenados',
  component: EntrenadosPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders.filter(
          (p) => p.provide !== EntrenadoService && p.provide !== UserService && p.provide !== InvitacionService && p.provide !== AuthService
        ),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ uid: 'coach-1', nombre: 'Entrenador de Prueba', plan: Plan.PREMIUM })
          }
        },
        {
          provide: EntrenadoService,
          useValue: {
            entrenados: signal(mockEntrenadosList),
            initializeListener: () => {}
          }
        },
        {
          provide: UserService,
          useValue: {
            users: signal(mockUsers),
            getUserByUid: (uid: string) => signal(mockUsers.find(u => u.uid === uid) || { uid, nombre: 'Usuario' })
          }
        },
        {
          provide: InvitacionService,
          useValue: {
            getInvitacionesPendientesPorEntrenador: () => signal(mockInvitacionesList)
          }
        }
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<EntrenadosPage>;

export const Default: Story = {};

export const SinEntrenados: Story = {
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders.filter(
          (p) => p.provide !== EntrenadoService && p.provide !== UserService && p.provide !== InvitacionService && p.provide !== AuthService
        ),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ uid: 'coach-1', nombre: 'Entrenador de Prueba', plan: Plan.PREMIUM })
          }
        },
        {
          provide: EntrenadoService,
          useValue: {
            entrenados: signal([]),
            initializeListener: () => {}
          }
        },
        {
          provide: UserService,
          useValue: {
            users: signal(mockUsers),
            getUserByUid: (uid: string) => signal({ uid, nombre: 'Usuario' })
          }
        },
        {
          provide: InvitacionService,
          useValue: {
            getInvitacionesPendientesPorEntrenador: () => signal([])
          }
        }
      ]
    })
  ]
};

export const PlanLimiteAlcanzado: Story = {
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders.filter(
          (p) => p.provide !== EntrenadoService && p.provide !== UserService && p.provide !== InvitacionService && p.provide !== AuthService && p.provide !== EntrenadorService
        ),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({ uid: 'coach-1', nombre: 'Entrenador de Prueba', plan: Plan.FREE })
          }
        },
        {
          provide: EntrenadoService,
          useValue: {
            entrenados: signal(mockEntrenadosList),
            initializeListener: () => {}
          }
        },
        {
          provide: UserService,
          useValue: {
            users: signal(mockUsers),
            getUserByUid: (uid: string) => signal(mockUsers.find(u => u.uid === uid) || { uid, nombre: 'Usuario' })
          }
        },
        {
          provide: InvitacionService,
          useValue: {
            getInvitacionesPendientesPorEntrenador: () => signal(mockInvitacionesList)
          }
        },
        {
          provide: EntrenadorService,
          useValue: {
            initializeListener: () => {},
            getLimits: () => ({ maxClients: 1 })
          }
        }
      ]
    })
  ]
};
