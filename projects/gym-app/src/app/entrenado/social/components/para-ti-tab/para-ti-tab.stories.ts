import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { signal } from '@angular/core';
import { ParaTiTabComponent } from './para-ti-tab.component';
import { mockProviders } from '../../testing-mocks';
import { SesionRutinaService } from '../../../../core/services/sesion-rutina.service';

const meta: Meta<ParaTiTabComponent> = {
  title: 'Secciones/entrenado/social/Componentes/para-ti-tab/ParaTiTab',
  component: ParaTiTabComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app><ion-content style="--background: transparent;">${story}</ion-content></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<ParaTiTabComponent>;

// 1. Default state: displays feed
export const Default: Story = {};

// 2. Empty Feed state: feed empty
export const NoFeed: Story = {
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders.filter((p) => p.provide !== SesionRutinaService),
        {
          provide: SesionRutinaService,
          useValue: {
            getSesionesCompartidas: () => signal([])
          }
        }
      ]
    })
  ]
};

