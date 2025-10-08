export type ColorVariant = 'blue' | 'green' | 'orange' | 'purple';

export interface CardConfig {
  title: string;
  createButtonText: string;
  createButtonColor: ColorVariant;
  emptyStateTitle: string;
  displayField: string;
  showCounter?: boolean;
  counterColor?: ColorVariant;
  showChips?: string[];
  chipLabels?: Record<string, string>;
}

export interface CardItem {
  id?: string;
  uid?: string;
  needsReview?: boolean;
  [key: string]: any;
}

export interface ChipConfig {
  color: ColorVariant;
  icon: string;
}
