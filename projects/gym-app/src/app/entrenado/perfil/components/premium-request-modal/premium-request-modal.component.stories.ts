import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, componentWrapperDecorator } from '@storybook/angular';
import { PremiumRequestModalComponent } from './premium-request-modal.component';
import { fn } from '@storybook/test';
import { Rol, Plan } from 'gym-library';
import { mockProviders } from '../../../social/testing-mocks';
import { ToastController, LoadingController } from '@ionic/angular/standalone';

const meta: Meta<PremiumRequestModalComponent> = {
  title: 'Secciones/entrenado/perfil/componentes/premium-request-modal',
  component: PremiumRequestModalComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        ...mockProviders,
        ToastController,
        LoadingController
      ]
    }),
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    modalClosed: fn()
  }
};

export default meta;
type Story = StoryObj<PremiumRequestModalComponent>;

export const Default: Story = {
  args: {
    isOpen: true,
    user: {
      uid: 'u-1',
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      role: Rol.ENTRENADO,
      plan: Plan.FREE,
      gimnasioId: 'g-1'
    }
  }
};
