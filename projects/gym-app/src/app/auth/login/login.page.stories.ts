import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { signal } from '@angular/core';

import { LoginPage } from './login.page';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { StorageService } from '../../core/services/storage.service';

const mockAuthService = {
  loginWithEmail: () => Promise.resolve(true),
  loginWithGoogle: () => Promise.resolve(true),
  currentUser: signal(null),
  error: signal(null)
};

const mockUserService = {
  getUserByUid: () => signal(null)
};

const mockStorageService = {
  get: () => Promise.resolve(null),
  set: () => Promise.resolve(),
  remove: () => Promise.resolve()
};

const mockRouter = {
  navigate: () => {}
};

const mockNavController = {
  navigateRoot: () => {},
  navigateBack: () => {}
};

const meta: Meta<LoginPage> = {
  title: 'Secciones/auth/login',
  component: LoginPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: Router, useValue: mockRouter },
        { provide: NavController, useValue: mockNavController }
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<LoginPage>;

export const Default: Story = {};

