import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { PageBackgroundComponent } from './page-background.component';
import { AuthService } from '../../../core/services/auth.service';
import { signal } from '@angular/core';
import { Plan, User } from 'gym-library';

const meta: Meta<PageBackgroundComponent> = {
  title: 'Componentes Compartidos/page-background',
  component: PageBackgroundComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="relative h-[400px] overflow-hidden">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<PageBackgroundComponent>;

export const Free: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser: signal<User>({ plan: Plan.FREE } as User)
          }
        }
      ]
    })
  ]
};

export const Premium: Story = {
  decorators: [
    applicationConfig({
      providers: [
        {
          provide: AuthService,
          useValue: {
            currentUser: signal<User>({ plan: Plan.PREMIUM } as User)
          }
        }
      ]
    })
  ]
};
