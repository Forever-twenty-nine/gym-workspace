import { Signal } from '@angular/core';

export interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'date' | 'boolean' | 'badge' | 'avatar';
  class?: string;
  badgeConfig?: {
    trueLabel: string;
    falseLabel: string;
    trueClass: string;
    falseClass: string;
  };
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'number' | 'email' | 'password' | 'multiselect' | 'date';
  placeholder?: string;
  options?: { value: any, label: string }[]; // Para selects y multiselect
  validators?: any[];
  colSpan?: 1 | 2;
  defaultValue?: any;
}

export interface DataConfig {
  title: string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
}
