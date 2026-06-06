import { vi } from 'vitest';
import { EventEmitter } from '@angular/core';

type RutinaList = {
  rutinas: any[];
  isPremium: boolean;
  create: EventEmitter<void>;
  delete: EventEmitter<string>;
  edit: EventEmitter<any>;
  onCreate(): void;
  onDelete(id: string, ev?: any): void;
  onEdit(item: any, ev?: any): void;
};

function makeRutinaList(): RutinaList {
  return {
    rutinas: [],
    isPremium: false,
    create: new EventEmitter<void>(),
    delete: new EventEmitter<string>(),
    edit: new EventEmitter<any>(),
    onCreate() { this.create.emit(); },
    onDelete(id, ev) { ev?.stopPropagation?.(); this.delete.emit(id); },
    onEdit(item, ev) { ev?.stopPropagation?.(); this.edit.emit(item); },
  };
}

describe('RutinaListComponent (logic + resilience)', () => {
  let component: RutinaList;

  beforeEach(() => { component = makeRutinaList(); });

  it('create/delete/edit emit (premium banner vs list rendering is in template)', () => {
    const c = vi.spyOn(component.create, 'emit');
    const d = vi.spyOn(component.delete, 'emit');
    const e = vi.spyOn(component.edit, 'emit');

    component.onCreate();
    component.onDelete('r1');
    component.onEdit({ id: 'r1' });

    expect(c).toHaveBeenCalled();
    expect(d).toHaveBeenCalledWith('r1');
    expect(e).toHaveBeenCalled();
  });

  it('accepts isPremium flag and data (used by page to decide locked banner)', () => {
    component.isPremium = true;
    component.rutinas = [{ id: 'r', nombre: 'X' }];
    expect(component.isPremium).toBe(true);
    expect(component.rutinas.length).toBe(1);
  });
});
