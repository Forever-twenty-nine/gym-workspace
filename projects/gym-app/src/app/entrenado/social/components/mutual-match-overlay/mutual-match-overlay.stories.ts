import type { Meta, StoryObj } from '@storybook/angular';
import { MutualMatchOverlayComponent } from './mutual-match-overlay.component';

const meta: Meta<MutualMatchOverlayComponent> = {
  title: 'Pages/entrenado/social/components/MutualMatchOverlay',
  component: MutualMatchOverlayComponent,
  tags: ['autodocs'],
  argTypes: {
    iniciarChat: { action: 'iniciarChat' },
    cerrarMatch: { action: 'cerrarMatch' },
  },
};

export default meta;
type Story = StoryObj<MutualMatchOverlayComponent>;

export const Default: Story = {
  args: {
    matchActual: {
      partnerId: 'partner-1',
      partnerName: 'Juan Pérez',
      partnerPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      tipo: 'afinidad',
      mensaje: '¡Coinciden en que ambos entrenan pierna los lunes!',
    },
    currentUserPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
};

export const WithoutMessage: Story = {
  args: {
    matchActual: {
      partnerId: 'partner-2',
      partnerName: 'María Gómez',
      partnerPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      tipo: 'general',
      mensaje: '',
    },
    currentUserPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
};

export const NoPhotos: Story = {
  args: {
    matchActual: {
      partnerId: 'partner-3',
      partnerName: 'Carlos López',
      partnerPhoto: null,
      tipo: 'horario',
      mensaje: '¡Ambos entrenan por la tarde de 18:00 a 20:00!',
    },
    currentUserPhoto: null,
  },
};
