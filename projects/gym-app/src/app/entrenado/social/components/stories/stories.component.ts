import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonAvatar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophyOutline, personOutline } from 'ionicons/icons';

export interface StoryDisplayItem {
  id: string;
  type: 'convocatoria' | 'desafio';
  label: string;
  photoUrl: string | null;
  timeHint: string;
  esOficial?: boolean;
  esSemanal?: boolean;
  esCreador?: boolean;
  rawStory: any;
}

@Component({
  selector: 'app-stories',
  templateUrl: './stories.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonIcon,
    IonAvatar
  ]
})
export class StoriesComponent {
  @Input() stories: StoryDisplayItem[] = [];
  @Output() storyClick = new EventEmitter<StoryDisplayItem>();

  constructor() {
    addIcons({ trophyOutline, personOutline });
  }
}
