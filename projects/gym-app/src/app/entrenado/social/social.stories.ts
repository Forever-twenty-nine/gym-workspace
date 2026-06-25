import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { signal } from '@angular/core';
import { SocialPage } from './social.page';
import { mockProviders, mockConvocatorias, mockDesafios } from './testing-mocks';
import { ConvocatoriaService } from '../../core/services/convocatoria.service';
import { DesafioService } from '../../core/services/desafio.service';

const meta: Meta<SocialPage> = {
  title: 'Secciones/entrenado/social/SocialPage',
  component: SocialPage,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<SocialPage>;

export const Default: Story = {};

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
