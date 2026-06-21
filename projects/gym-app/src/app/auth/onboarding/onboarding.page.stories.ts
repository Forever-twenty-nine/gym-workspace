import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { OnboardingPage } from './onboarding.page';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { EntrenadoService } from '../../core/services/entrenado.service';
import { EntrenadorService } from '../../core/services/entrenador.service';
import { GimnasioService } from '../../core/services/gimnasio.service';

const mockAuthService = {
  currentUser: signal({ uid: 'test-user-uid', nombre: 'Test User' })
};

const mockUserService = {
  updateUser: () => Promise.resolve()
};

const mockEntrenadoService = {
  save: () => Promise.resolve()
};

const mockEntrenadorService = {
  createWithId: () => Promise.resolve()
};

const mockGimnasioService = {
  save: () => Promise.resolve()
};

const mockRouter = {
  navigate: () => {}
};

const meta: Meta<OnboardingPage> = {
  title: 'Secciones/auth/onboarding',
  component: OnboardingPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: EntrenadoService, useValue: mockEntrenadoService },
        { provide: EntrenadorService, useValue: mockEntrenadorService },
        { provide: GimnasioService, useValue: mockGimnasioService },
        { provide: Router, useValue: mockRouter }
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<OnboardingPage>;

export const Default: Story = {};

export const PasoDos: Story = {
  args: {
    step: 2,
    initialData: {
      nombre: 'Juan Pérez',
      role: 'entrenado',
      objetivo: 'SALUD'
    }
  }
};




