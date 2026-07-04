import type { Meta, StoryObj } from '@storybook/angular';
import { AuthBackgroundComponent } from './auth-background.component';

const meta: Meta<AuthBackgroundComponent> = {
  title: 'Shared/Components/AuthBackground',
  component: AuthBackgroundComponent,
  tags: ['autodocs'],
  argTypes: {
    opacityClass: {
      control: 'text',
      description: 'CSS classes to control the opacity/gradient overlay',
    },
    showBlur: {
      control: 'boolean',
      description: 'Whether to show the blur effect on the background image',
    },
  },
};

export default meta;
type Story = StoryObj<AuthBackgroundComponent>;

export const Default: Story = {
  args: {
    opacityClass: ' ',
    showBlur: true,
  },
};

export const NoBlur: Story = {
  args: {
    opacityClass: ' ',
    showBlur: false,
  },
};

export const CustomOpacity: Story = {
  args: {
    opacityClass: 'bg-black/50',
    showBlur: true,
  },
};
