import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { ForgotPasswordPage } from './forgot-password.page';
import { AuthService } from '../../core/services/auth.service';

const mockAuthService = {
  error: signal(null)
};

const mockRouter = {
  navigate: () => {}
};

const meta: Meta<ForgotPasswordPage> = {
  title: 'Secciones/auth/forgot-password',
  component: ForgotPasswordPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<ForgotPasswordPage>;

export const Default: Story = {};

