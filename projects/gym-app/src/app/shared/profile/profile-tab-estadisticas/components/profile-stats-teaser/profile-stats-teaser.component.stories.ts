import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { ProfileStatsTeaserComponent } from './profile-stats-teaser.component';
import { fn } from '@storybook/test';

const meta: Meta<ProfileStatsTeaserComponent> = {
  title: 'Shared/profile/tabs/estadisticas/stats-teaser',
  component: ProfileStatsTeaserComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app>${story}</ion-app>`)
  ],
  args: {
    viewPlansClick: fn()
  }
};

export default meta;
type Story = StoryObj<ProfileStatsTeaserComponent>;

export const Default: Story = {};