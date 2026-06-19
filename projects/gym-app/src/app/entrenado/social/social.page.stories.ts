import type { Meta, StoryObj } from '@storybook/angular';
import { SocialPage } from './social.page';

const meta: Meta<SocialPage> = {
  title: 'Pages/entrenado/social',
  component: SocialPage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<SocialPage>;

export const Default: Story = {
  args: {
  },
};
