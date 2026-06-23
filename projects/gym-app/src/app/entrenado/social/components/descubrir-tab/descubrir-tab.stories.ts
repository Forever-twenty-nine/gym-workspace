import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { DescubrirTabComponent } from './descubrir-tab.component';
import { mockProviders, mockTarjetasDescubrirList } from '../../testing-mocks';

const meta: Meta<DescubrirTabComponent> = {
  title: 'Secciones/entrenado/social/Componentes/descubrir-tab',
  component: DescubrirTabComponent,
  tags: ['autodocs'],
  argTypes: {
    pasar: { action: 'pasar' },
    chocarLos5: { action: 'chocarLos5' },
    cardTransitionEnd: { action: 'cardTransitionEnd' }
  },
  decorators: [
    applicationConfig({
      providers: [...mockProviders]
    })
  ]
};

export default meta;
type Story = StoryObj<DescubrirTabComponent>;

export const DefaultAfinidad: Story = {
  args: {
    tarjetaActiva: mockTarjetasDescubrirList[0]
  }
};

export const Horario: Story = {
  args: {
    tarjetaActiva: mockTarjetasDescubrirList[1]
  }
};

export const General: Story = {
  args: {
    tarjetaActiva: mockTarjetasDescubrirList[2]
  }
};

export const EmptyState: Story = {
  args: {
    tarjetaActiva: null
  }
};

