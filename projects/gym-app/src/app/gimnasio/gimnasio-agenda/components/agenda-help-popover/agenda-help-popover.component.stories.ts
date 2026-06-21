import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator } from '@storybook/angular';
import { AgendaHelpPopoverComponent } from './agenda-help-popover.component';

const meta: Meta<AgendaHelpPopoverComponent> = {
  title: 'Secciones/gimnasio/gimnasio-agenda/Componentes/agenda-help-popover',
  component: AgendaHelpPopoverComponent,
  tags: ['autodocs'],
  decorators: [
    componentWrapperDecorator((story) => `
      <ion-app class="p-4 bg-slate-900 flex flex-col justify-start items-center gap-4">
        <ion-button id="help-btn" size="small">Click para Ayuda</ion-button>
        ${story}
      </ion-app>
    `)
  ]
};

export default meta;
type Story = StoryObj<AgendaHelpPopoverComponent>;

export const Default: Story = {
  args: {
    triggerId: 'help-btn'
  }
};
