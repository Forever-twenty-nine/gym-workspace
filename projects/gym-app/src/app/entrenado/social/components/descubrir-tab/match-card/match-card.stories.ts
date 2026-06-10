import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { MatchCardComponent } from './match-card.component';
import { mockProviders, mockTarjetasDescubrirList } from '../../../testing-mocks';

const meta: Meta<MatchCardComponent> = {
  title: 'Social/DescubrirTab/MatchCard',
  component: MatchCardComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    })
  ]
};

export default meta;
type Story = StoryObj<MatchCardComponent>;

export const Afinidad: Story = {
  args: {
    tipo: 'afinidad',
    data: mockTarjetasDescubrirList[0].data,
    photoURL: mockTarjetasDescubrirList[0].data.photoURL
  }
};

export const Horario: Story = {
  args: {
    tipo: 'horario',
    data: mockTarjetasDescubrirList[1].data,
    photoURL: mockTarjetasDescubrirList[1].data.photoURL
  }
};

export const General: Story = {
  args: {
    tipo: 'general',
    data: mockTarjetasDescubrirList[2].data,
    photoURL: null
  }
};
