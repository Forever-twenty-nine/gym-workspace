import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { signal } from '@angular/core';

import { RegisterPage } from './register.page';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

const mockAuthService = {
  registerWithEmail: () => Promise.resolve(true),
  loginWithGoogle: () => Promise.resolve(true),
  error: signal(null)
};

const mockUserService = {
  getUserByUid: () => signal(null)
};

const mockRouter = {
  navigate: () => {}
};

const meta: Meta<RegisterPage> = {
  title: 'Secciones/auth/register',
  component: RegisterPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter }
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RegisterPage>;

export const Default: Story = {};

