import { vi } from 'vitest';
import { FormBuilder, Validators } from '@angular/forms';

function makeEjercicioLogic() {
  const fb = new FormBuilder();
  const form = fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
    series: [3, [Validators.required, Validators.min(1)]],
    repeticiones: [12, [Validators.required, Validators.min(1)]],
    peso: [0],
  });

  let isEditing = false;
  let item: any = null;
  let saved = 0;
  let addedCalls: any[] = [];
  const toasts: any[] = [];

  function loadForEdit(it: any) {
    if (!it) return;
    isEditing = true;
    item = it;
    form.patchValue({
      nombre: it.nombre || '',
      descripcion: it.descripcion || '',
      series: it.series || 3,
      repeticiones: it.repeticiones || 12,
      peso: it.peso || 0,
    });
  }

  async function guardar(user: any, saveFn: (d: any) => Promise<void>, addFn?: (uid: string, id: string) => Promise<void>) {
    if (form.invalid) return;
    if (!user) { toasts.push({ color: 'danger' }); return; }
    const v = form.value;
    const data: any = isEditing && item
      ? { ...item, nombre: (v.nombre || '').trim(), descripcion: (v.descripcion || '').trim(), series: Number(v.series) || 3, repeticiones: Number(v.repeticiones) || 12, peso: Number(v.peso) || 0 }
      : { id: 'ej-' + Date.now(), nombre: (v.nombre || '').trim(), descripcion: (v.descripcion || '').trim(), series: Number(v.series) || 3, repeticiones: Number(v.repeticiones) || 12, peso: Number(v.peso) || 0, creadorId: user.uid, descansoSegundos: 60 };

    await saveFn(data);
    if (!isEditing && addFn) {
      await addFn(user.uid, data.id);
      addedCalls.push([user.uid, data.id]);
    }
    saved++;
  }

  return { form, isEditing: () => isEditing, loadForEdit, guardar, toasts, savedCount: () => saved, addedCalls };
}

describe('EjercicioModal (logic + create vs edit + add only on create)', () => {
  it('defaults series/rep and validates minLength on nombre', () => {
    const m = makeEjercicioLogic();
    expect(m.form.get('series')?.value).toBe(3);
    expect(m.form.get('repeticiones')?.value).toBe(12);
  });

  it('loadForEdit pre-fills and marks editing', () => {
    const m = makeEjercicioLogic();
    m.loadForEdit({ nombre: 'Remo', series: 4, repeticiones: 8, peso: 55 });
    expect(m.isEditing()).toBe(true);
    expect(m.form.get('series')?.value).toBe(4);
  });

  it('create calls save + addEjercicioCreado', async () => {
    const m = makeEjercicioLogic();
    m.form.patchValue({ nombre: 'Zancadas', series: 3, repeticiones: 10 });
    const save = vi.fn().mockResolvedValue(undefined);
    const add = vi.fn().mockResolvedValue(undefined);
    await m.guardar({ uid: 'u' }, save, add);
    expect(save).toHaveBeenCalled();
    expect(add).toHaveBeenCalled();
  });

  it('edit reuses id and skips add', async () => {
    const m = makeEjercicioLogic();
    m.loadForEdit({ id: 'ej-77', nombre: 'Old' });
    m.form.patchValue({ nombre: 'Nuevo' });
    const save = vi.fn().mockResolvedValue(undefined);
    const add = vi.fn();
    await m.guardar({ uid: 'u' }, save, add);
    expect(save.mock.calls[0][0].id).toBe('ej-77');
    expect(add).not.toHaveBeenCalled();
  });
});
