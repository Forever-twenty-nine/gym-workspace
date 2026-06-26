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
  },
  {
    id: 'convocatoria-3',
    type: 'convocatoria',
    label: '',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    timeHint: '12:00',
    esOficial: false,
    esSemanal: false,
    rawStory: {}
  },
  {
    id: 'desafio-3',
    type: 'desafio',
    label: '',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    timeHint: '1d',
    esCreador: false,
    rawStory: {}
  },
  {
    id: 'convocatoria-4',
    type: 'convocatoria',
    label: '',
    photoUrl: null,
    timeHint: 'hoy',
    esOficial: true,
    esSemanal: false,
    rawStory: {}
  },
  {
    id: 'desafio-4',
    type: 'desafio',
    label: '',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    timeHint: '3d',
    esCreador: false,
    rawStory: {}
  },
  {
    id: 'convocatoria-5',
    type: 'convocatoria',
    label: '',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    timeHint: '15:30',
    esOficial: false,
    esSemanal: true,
    rawStory: {}
  },
  {
    id: 'desafio-5',
    type: 'desafio',
    label: '',
    photoUrl: null,
    timeHint: 'fin',
    esCreador: true,
    rawStory: {}
  },
  {
    id: 'convocatoria-6',
    type: 'convocatoria',
    label: '',
    photoUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=200',
    timeHint: '10:00',
    esOficial: false,
    esSemanal: false,
    rawStory: {}
  }
];

const meta: Meta<StoriesComponent> = {
  title: 'Secciones/entrenado/social/Componentes/stories/Stories',
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

