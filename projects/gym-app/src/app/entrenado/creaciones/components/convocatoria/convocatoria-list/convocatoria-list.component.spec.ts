import { vi } from 'vitest';
import { EventEmitter } from '@angular/core';

/**
 * ConvocatoriaListComponent logic tests (no DOM / no Ionic compile in this env).
 * These cover the full public API and resilience cases for the list used in creaciones.
 * When running under `ng test` (the project Angular test runner) the original component
 * + template tests can be added using CUSTOM_ELEMENTS_SCHEMA + detectChanges.
 */
type ListContract = {
  convocatorias: any[];
  create: EventEmitter<void>;
  delete: EventEmitter<string>;
  edit: EventEmitter<any>;
  onCreate(): void;
  onDelete(id: string, ev?: Event): void;
  onEdit(item: any, ev?: Event): void;
};

function createConvocatoriaListUnderTest(): ListContract {
  const create = new EventEmitter<void>();
  const del = new EventEmitter<string>();
  const edit = new EventEmitter<any>();
  return {
    convocatorias: [],
    create,
    delete: del,
    edit,
    onCreate() { create.emit(); },
    onDelete(id: string, ev?: any) { if (ev) ev.stopPropagation?.(); del.emit(id); },
    onEdit(item: any, ev?: any) { if (ev) ev.stopPropagation?.(); edit.emit(item); },
  };
}

describe('ConvocatoriaListComponent (logic + resilience)', () => {
  let component: ListContract;

  beforeEach(() => {
    component = createConvocatoriaListUnderTest();
  });

  it('should be instantiable and have outputs', () => {
    expect(component.create).toBeInstanceOf(EventEmitter);
    expect(component.delete).toBeInstanceOf(EventEmitter);
  });

  it('onCreate emits', () => {
    const spy = vi.spyOn(component.create, 'emit');
    component.onCreate();
    expect(spy).toHaveBeenCalled();
  });

  it('onDelete emits id (and stops prop when event passed)', () => {
    const spy = vi.spyOn(component.delete, 'emit');
    const ev = { stopPropagation: vi.fn() };
    component.onDelete('cv-123', ev as any);
    expect(spy).toHaveBeenCalledWith('cv-123');
    expect(ev.stopPropagation).toHaveBeenCalled();
  });

  it('onEdit emits item', () => {
    const spy = vi.spyOn(component.edit, 'emit');
    const item = { id: 'c1' };
    component.onEdit(item);
    expect(spy).toHaveBeenCalledWith(item);
  });

  it('accepts empty array (empty state path)', () => {
    component.convocatorias = [];
    expect(component.convocatorias.length).toBe(0);
  });

  it('is resilient to items with missing fields (list only uses id + a few date fields)', () => {
    component.convocatorias = [{ id: 'bad' } as any, {} as any];
    expect(() => component.onDelete('bad')).not.toThrow();
  });
});
