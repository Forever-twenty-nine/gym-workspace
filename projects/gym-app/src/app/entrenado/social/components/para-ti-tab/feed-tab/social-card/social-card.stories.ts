import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { SocialCardComponent } from './social-card.component';
import { mockProviders, mockSesionesCompartidas } from '../../../../testing-mocks';

const meta: Meta<SocialCardComponent> = {
  title: 'Pages/entrenado/social/components/FeedTab/SocialCard',
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

export const Default: Story = {
  args: {
    sesion: mockSesionesCompartidas[0]
  }
};

export const AnotherPost: Story = {
  args: {
    sesion: mockSesionesCompartidas[1]
  }
};
