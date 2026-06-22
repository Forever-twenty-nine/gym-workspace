import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { RutinaProgresoPage } from './rutina-progreso.page';
import { mockProviders } from '../social/testing-mocks';
import { ActivatedRoute } from '@angular/router';

const mockActivatedRoute = {
  snapshot: {
    paramMap: {
      get: (key: string) => 'rutina-123'
    }
  }
};

const meta: Meta<RutinaProgresoPage> = {
  title: 'Secciones/entrenado/rutina-progreso',
  component: RutinaProgresoPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders,
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<RutinaProgresoPage>;

export const Default: Story = {};
