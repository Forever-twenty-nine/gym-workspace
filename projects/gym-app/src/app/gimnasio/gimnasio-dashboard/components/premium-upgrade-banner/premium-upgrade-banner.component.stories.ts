import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { PremiumUpgradeBannerComponent } from './premium-upgrade-banner.component';

const meta: Meta<PremiumUpgradeBannerComponent> = {
  title: 'Secciones/gimnasio/gimnasio-dashboard/Componentes/premium-upgrade-banner',
  component: PremiumUpgradeBannerComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `<ion-app class="p-4 bg-slate-900 flex justify-center items-center"><div style="width: 100%; max-width: 450px;">${story}</div></ion-app>`)
  ]
};

export default meta;
type Story = StoryObj<PremiumUpgradeBannerComponent>;

export const Default: Story = {
  args: {
    upgrade: {
      emit: () => { console.log('upgrade emitted'); }
    } as any
  }
};
