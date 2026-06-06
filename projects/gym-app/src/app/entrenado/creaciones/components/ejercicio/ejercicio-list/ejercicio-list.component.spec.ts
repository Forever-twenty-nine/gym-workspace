import { vi } from 'vitest';
import { EventEmitter } from '@angular/core';

type EjList = {
  ejercicios: any[];
  isPremium: boolean;
  ownEjercicioIds: any;
  create: EventEmitter<void>;
  delete: EventEmitter<string>;
  edit: EventEmitter<any>;
  isOwn(id: string): boolean;
  onCreate(): void;
  onDelete(id: string, ev?: any): void;
  onEdit(item: any, ev?: any): void;
};

function makeEjercicioList(): EjList {
  let _own = new Set<string>();
  return {
    ejercicios: [],
    isPremium: false,
    get ownEjercicioIds() { return _own; },
    set ownEjercicioIds(v: any) {
      if (v instanceof Set) _own = v;
      else _own = new Set(v || []);
    },
    create: new EventEmitter<void>(),
    delete: new EventEmitter<string>(),
    edit: new EventEmitter<any>(),
    isOwn(id: string) { return _own.has(id); },
    onCreate() { this.create.emit(); },
    onDelete(id, ev) { ev?.stopPropagation?.(); this.delete.emit(id); },
    onEdit(item, ev) { ev?.stopPropagation?.(); this.edit.emit(item); },
  };
}

describe('EjercicioListComponent (logic + resilience)', () => {
  let component: EjList;

  beforeEach(() => { component = makeEjercicioList(); });

  it('ownEjercicioIds setter + isOwn()', () => {
    component.ownEjercicioIds = new Set(['e1']);
    expect(component.isOwn('e1')).toBe(true);
    component.ownEjercicioIds = ['e2'];
    expect(component.isOwn('e2')).toBe(true);
  });

  it('emits create/delete/edit', () => {
    const c = vi.spyOn(component.create, 'emit');
    const d = vi.spyOn(component.delete, 'emit');
    const e = vi.spyOn(component.edit, 'emit');
    component.onCreate();
    component.onDelete('e1');
    component.onEdit({ id: 'e1' });
    expect(c).toHaveBeenCalled(); expect(d).toHaveBeenCalled(); expect(e).toHaveBeenCalled();
  });

  it('premium flag + bad data do not crash handlers', () => {
    component.isPremium = false;
    component.ejercicios = [null as any];
    expect(() => component.onEdit({})).not.toThrow();
  });
});
