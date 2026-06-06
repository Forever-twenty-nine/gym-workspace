import { vi } from 'vitest';
import { FormBuilder, Validators } from '@angular/forms';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function makeRutinaLogic() {
  const fb = new FormBuilder();
  const form = fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: ['', [Validators.maxLength(300)]],
    diasSemana: [[]],
  });

  let isEditing = false;
  let item: any = null;
  let selected: string[] = [];
  let saved = 0;
  let addedRutinaCreadaCalls: any[] = [];
  const toasts: any[] = [];

  // Simulated "computed" only-own ejercicios
  function getOwnEjercicios(allEj: any[], uid: string, entrenado: any) {
    const ids = new Set<string>(entrenado?.ejerciciosCreadosIds || []);
    allEj.forEach(e => { if (e.creadorId === uid) ids.add(e.id); });
    return allEj.filter(e => ids.has(e.id));
  }

  function loadForEdit(it: any) {
    if (!it) return;
    isEditing = true;
    item = it;
    const dias = (it.diasSemana || []).slice().sort((a: string, b: string) => DIAS.indexOf(a) - DIAS.indexOf(b));
    form.patchValue({ nombre: it.nombre || '', descripcion: it.descripcion || '', diasSemana: dias });
    selected = (it.ejerciciosIds || []).slice();
  }

  function toggle(id: string) {
    selected = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
  }

  async function guardar(user: any, rutinaSave: (d: any) => Promise<void>, addRutinaCreada?: (uid: string, id: string) => Promise<void>) {
    if (form.invalid) return;
    if (!user) { toasts.push({ color: 'danger' }); return; }
    const v = form.value;
    const dias = (v.diasSemana || []).slice().sort((a: string, b: string) => DIAS.indexOf(a) - DIAS.indexOf(b));

    const data: any = isEditing && item
      ? { ...item, nombre: (v.nombre || '').trim(), descripcion: (v.descripcion || '').trim(), ejerciciosIds: selected, diasSemana: dias }
      : { id: 'rut-' + Date.now(), nombre: (v.nombre || '').trim(), descripcion: (v.descripcion || '').trim(), ejerciciosIds: selected, diasSemana: dias, creadorId: user.uid, asignadoIds: [] };

    await rutinaSave(data);
    if (!isEditing && addRutinaCreada) {
      await addRutinaCreada(user.uid, data.id);
      addedRutinaCreadaCalls.push([user.uid, data.id]);
    }
    saved++;
  }

  return {
    form, DIAS, isEditing: () => isEditing, selected: () => selected, selectedCount: () => selected.length,
    getOwnEjercicios, loadForEdit, toggle, guardar, toasts, savedCount: () => saved, addedRutinaCreadaCalls,
  };
}

describe('RutinaModal (computed own ejercicios, dias sorting, create/edit + add only on create)', () => {
  it('getOwnEjercicios returns only those by uid or in profile ids (no foreign)', () => {
    const m = makeRutinaLogic();
    const all = [
      { id: 'e1', creadorId: 'u1', nombre: 'Press' },
      { id: 'e2', creadorId: 'other' },
      { id: 'e3', nombre: 'Legacy' },
    ];
    const own = m.getOwnEjercicios(all, 'u1', { ejerciciosCreadosIds: ['e3'] });
    expect(own.map(o => o.id)).toEqual(expect.arrayContaining(['e1', 'e3']));
    expect(own.find(o => o.id === 'e2')).toBeUndefined();
  });

  it('loadForEdit sorts dias Lunes..Domingo and loads selectedIds', () => {
    const m = makeRutinaLogic();
    m.loadForEdit({ nombre: 'X', diasSemana: ['Viernes', 'Lunes'], ejerciciosIds: ['e1'] });
    expect(m.isEditing()).toBe(true);
    expect(m.form.get('diasSemana')?.value).toEqual(['Lunes', 'Viernes']);
    expect(m.selected()).toEqual(['e1']);
  });

  it('toggle adds and removes', () => {
    const m = makeRutinaLogic();
    m.toggle('a'); m.toggle('b'); m.toggle('a');
    expect(m.selectedCount()).toBe(1);
    expect(m.selected()).toContain('b');
  });

  it('create path sorts days and calls addRutinaCreada', async () => {
    const m = makeRutinaLogic();
    m.form.patchValue({ nombre: 'Mi Rut', diasSemana: ['Miércoles', 'Lunes'] });
    m.toggle('e1');
    const save = vi.fn().mockResolvedValue(undefined);
    const add = vi.fn().mockResolvedValue(undefined);
    await m.guardar({ uid: 'u1' }, save, add);
    expect(save).toHaveBeenCalled();
    const data = save.mock.calls[0][0];
    expect(data.diasSemana).toEqual(['Lunes', 'Miércoles']);
    expect(add).toHaveBeenCalled();
  });

  it('edit does not call addRutinaCreada', async () => {
    const m = makeRutinaLogic();
    m.loadForEdit({ id: 'r-1', nombre: 'Old' });
    m.form.patchValue({ nombre: 'New' });
    const save = vi.fn().mockResolvedValue(undefined);
    const add = vi.fn();
    await m.guardar({ uid: 'u1' }, save, add);
    expect(save).toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });
});
