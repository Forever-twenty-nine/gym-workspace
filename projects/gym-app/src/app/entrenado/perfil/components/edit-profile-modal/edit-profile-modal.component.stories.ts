import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { EditProfileModalComponent } from './edit-profile-modal.component';
import { fn } from '@storybook/test';
import { Rol, Plan } from 'gym-library';
import { mockProviders } from '../../../social/testing-mocks';
import { FormBuilder } from '@angular/forms';
import { ToastController, LoadingController, Platform } from '@ionic/angular/standalone';

const meta: Meta<EditProfileModalComponent> = {
  title: 'Secciones/entrenado/perfil/componentes/edit-profile-modal',
  component: EditProfileModalComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders,
        FormBuilder,
        ToastController,
        LoadingController,
        Platform
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    modalClosed: fn()
  }
};

export default meta;
type Story = StoryObj<EditProfileModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    user: {
      uid: 'u-1',
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      role: Rol.ENTRENADO,
      plan: Plan.PREMIUM,
      gimnasioId: 'g-1'
    },
    entrenadoData: {
      objetivo: 'Ganar masa muscular',
      nivel: 'Avanzado',
      bio: 'Entrenando todos los días',
      visibleDescubrir: true,
      franjaHoraria: { inicio: '18:00', fin: '20:00' },
      configNotificaciones: {
        recordatoriosEntrenamiento: true,
        horaRecordatorio: '17:00',
        diasRecordatorio: [1, 3, 5]
      }
    }
  }
};
