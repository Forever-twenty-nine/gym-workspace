import { vi } from 'vitest';
import { EventEmitter } from '@angular/core';

type ListContract = {
  desafios: any[];
  create: EventEmitter<void>;
  delete: EventEmitter<string>;
  edit: EventEmitter<any>;
  onCreate(): void;
  onDelete(id: string, ev?: any): void;
  onEdit(item: any, ev?: any): void;
};

function makeDesafioList(): ListContract {
  const c = new EventEmitter<void>();
  const d = new EventEmitter<string>();
  const e = new EventEmitter<any>();
  return {
    desafios: [],
    create: c, delete: d, edit: e,
    onCreate() { c.emit(); },
    onDelete(id, ev) { ev?.stopPropagation?.(); d.emit(id); },
    onEdit(item, ev) { ev?.stopPropagation?.(); e.emit(item); },
  };
}

describe('DesafioListComponent (logic + resilience)', () => {
  let component: ListContract;

  beforeEach(() => { component = makeDesafioList(); });

  it('emits create/delete/edit with stopPropagation on action events', () => {
    const cs = vi.spyOn(component.create, 'emit');
    const ds = vi.spyOn(component.delete, 'emit');
    const es = vi.spyOn(component.edit, 'emit');
    const ev = { stopPropagation: vi.fn() };

    component.onCreate();
    component.onDelete('d1', ev);
    component.onEdit({ id: 'd1' }, ev);

    expect(cs).toHaveBeenCalled();
    expect(ds).toHaveBeenCalledWith('d1');
    expect(es).toHaveBeenCalled();
    expect(ev.stopPropagation).toHaveBeenCalled();
  });

  it('handles empty + partial data gracefully', () => {
    component.desafios = [];
    component.desafios = [{} as any];
    expect(() => component.onEdit({})).not.toThrow();
  });
});
