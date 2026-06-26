import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { SocialCardComponent } from './social-card.component';
import { mockProviders, mockSesionesCompartidas } from '../../../../testing-mocks';

const meta: Meta<SocialCardComponent> = {
  title: 'Secciones/entrenado/social/Componentes/para-ti-tab/feed-tab/social-card/SocialCard',
  component: SocialCardComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    })
  ]
};

export default meta;
type Story = StoryObj<SocialCardComponent>;

export const MiPublicacion: Story = {
  args: {
    // user-current es el usuario actual en los mocks
    sesion: {
      ...mockSesionesCompartidas[0],
      entrenadoId: 'user-current',
      nombreUsuario: 'Mi Perfil'
    }
  }
};

export const UsuarioSeguido: Story = {
  args: {
    // user-partner es un usuario seguido según mockEntrenadoProfile
    sesion: {
      ...mockSesionesCompartidas[0],
      id: 'sesion-followed',
      entrenadoId: 'user-partner',
      nombreUsuario: 'Juan Pérez'
    }
  }
};

export const UsuarioNoSeguido: Story = {
  args: {
    // user-4 no está en la lista de seguidos de mockEntrenadoProfile
    sesion: {
      ...mockSesionesCompartidas[0],
      id: 'sesion-unfollowed',
      entrenadoId: 'user-4',
      nombreUsuario: 'Carlos López'
    }
  }
};

