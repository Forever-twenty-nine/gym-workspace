import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { SocialCommentsModalComponent } from './social-comments-modal.component';
import { mockProviders, mockSesionesCompartidas } from '../../../../testing-mocks';

const meta: Meta<SocialCommentsModalComponent> = {
  title: 'Secciones/entrenado/social/Componentes/para-ti-tab/feed-tab/social-card/social-comments-modal/SocialCommentsModal',
  component: SocialCommentsModalComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    })
  ]
};

export default meta;
type Story = StoryObj<SocialCommentsModalComponent>;

export const Default: Story = {
  args: {
    sesion: {
      ...mockSesionesCompartidas[0],
      entrenadoId: 'user-current',
      nombreUsuario: 'Mi Perfil'
    },
    triggerId: 'test-trigger'
  }
};
