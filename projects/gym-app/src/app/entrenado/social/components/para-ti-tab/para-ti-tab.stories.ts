import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { signal } from '@angular/core';
import { ParaTiTabComponent } from './para-ti-tab.component';
import { mockProviders, mockConvocatorias, mockDesafios } from '../../testing-mocks';
import { ConvocatoriaService } from '../../../../core/services/convocatoria.service';
import { DesafioService } from '../../../../core/services/desafio.service';
import { SesionRutinaService } from '../../../../core/services/sesion-rutina.service';

const meta: Meta<ParaTiTabComponent> = {
  title: 'Pages/entrenado/social/components/ParaTiTab',
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

// 1. Default state: displays all stories and feed
export const Default: Story = {};

// 2. Convocatorias Only state: no desafíos
export const ConvocatoriasOnly: Story = {
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders.filter(
          (p) => p.provide !== ConvocatoriaService && p.provide !== DesafioService
        ),
        {
          provide: ConvocatoriaService,
          useValue: {
            getConvocatoriasForGym: () => signal(mockConvocatorias)
          }
        },
        {
          provide: DesafioService,
          useValue: {
            getDesafiosForGym: () => signal([])
          }
        }
      ]
    })
  ]
};

// 3. Desafios Only state: no convocatorias
export const DesafiosOnly: Story = {
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders.filter(
          (p) => p.provide !== ConvocatoriaService && p.provide !== DesafioService
        ),
        {
          provide: ConvocatoriaService,
          useValue: {
            getConvocatoriasForGym: () => signal([])
          }
        },
        {
          provide: DesafioService,
          useValue: {
            getDesafiosForGym: () => signal(mockDesafios)
          }
        }
      ]
    })
  ]
};

// 4. Empty Stories state: no stories, but feed exists
export const NoStories: Story = {
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders.filter(
          (p) => p.provide !== ConvocatoriaService && p.provide !== DesafioService
        ),
        {
          provide: ConvocatoriaService,
          useValue: {
            getConvocatoriasForGym: () => signal([])
          }
        },
        {
          provide: DesafioService,
          useValue: {
            getDesafiosForGym: () => signal([])
          }
        }
      ]
    })
  ]
};

// 5. Empty Feed state: stories exist, feed empty
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

// 6. Interactive: Open Convocatoria Modal
export const OpenConvocatoriaModal: Story = {
  play: async ({ canvasElement }) => {
    // Wait for the component to render and signals to compute
    await new Promise((resolve) => setTimeout(resolve, 300));
    const buttons = canvasElement.querySelectorAll('button');
    if (buttons.length > 0) {
      (buttons[0] as HTMLButtonElement).click();
    }
  }
};

// 7. Interactive: Open Desafio Modal
export const OpenDesafioModal: Story = {
  play: async ({ canvasElement }) => {
    // Wait for the component to render and signals to compute
    await new Promise((resolve) => setTimeout(resolve, 300));
    const buttons = canvasElement.querySelectorAll('button');
    // The second button in our mock setup will be the first desafio story
    if (buttons.length > 1) {
      (buttons[1] as HTMLButtonElement).click();
    }
  }
};
