import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { DateBadgeComponent } from './date-badge.component';

const meta: Meta<DateBadgeComponent> = {
  title: 'Componentes Compartidos/date-badge',
  component: DateBadgeComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="relative flex items-center justify-center h-[120px] bg-slate-50 dark:bg-slate-900">${story}</ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<DateBadgeComponent>;

export const Default: Story = {
  args: {
    fecha: new Date('2026-06-25T12:00:00Z'),
    esEjecutable: false
  }
};

export const EjecutableHoy: Story = {
  args: {
    fecha: new Date('2026-06-23T12:00:00Z'),
    esEjecutable: true
  }
};

export const SinFechaConDiaCorto: Story = {
  args: {
    diaCorto: 'LUN',
    esEjecutable: false
  }
};

export const SinFechaSinDiaCorto: Story = {
  args: {
    esEjecutable: false
  }
};
