import type { Meta, StoryObj } from '@storybook/angular';
import { AgendaPage } from './agenda.page';

const meta: Meta<AgendaPage> = {
  title: 'Pages/entrenador/agenda',
  component: AgendaPage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<AgendaPage>;

export const Default: Story = {
  args: {
  },
};
