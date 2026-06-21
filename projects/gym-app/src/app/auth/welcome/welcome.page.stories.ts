import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular/standalone';
import { WelcomePage } from './welcome.page';

const mockRouter = {
  navigate: () => {}
};

const mockNavController = {
  navigateForward: () => {},
  navigateBack: () => {}
};

const meta: Meta<WelcomePage> = {
  title: 'Secciones/auth/welcome',
  component: WelcomePage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: NavController, useValue: mockNavController }
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<WelcomePage>;

export const Default: Story = {};

