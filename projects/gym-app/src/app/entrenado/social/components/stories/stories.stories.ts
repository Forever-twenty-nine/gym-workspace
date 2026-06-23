import type { Meta, StoryObj } from '@storybook/angular';
import { StoriesComponent, StoryDisplayItem } from './stories.component';

const mockStoryItems: StoryDisplayItem[] = [
  {
    id: 'convocatoria-1',
    type: 'convocatoria',
    label: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    timeHint: '18:00',
    esOficial: false,
    esSemanal: false,
    rawStory: {}
  },
  {
    id: 'convocatoria-2',
    type: 'convocatoria',
    label: '',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    timeHint: 'mañ',
    esOficial: true,
    esSemanal: true,
    rawStory: {}
  },
  {
    id: 'desafio-1',
    type: 'desafio',
    label: '',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    timeHint: '2d',
    esCreador: false,
    rawStory: {}
  },
  {
    id: 'desafio-2',
    type: 'desafio',
    label: '',
    photoUrl: null,
    timeHint: 'fin',
    esCreador: true,
    rawStory: {}
  }
];

const meta: Meta<StoriesComponent> = {
  title: 'Secciones/entrenado/social/Componentes/stories',
  component: StoriesComponent,
  tags: ['autodocs'],
  argTypes: {
    storyClick: { action: 'storyClick' }
  }
};

export default meta;
type Story = StoryObj<StoriesComponent>;

export const Default: Story = {
  args: {
    stories: mockStoryItems
  }
};

export const Empty: Story = {
  args: {
    stories: []
  }
};

