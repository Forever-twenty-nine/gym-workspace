import { vi } from 'vitest';
import { FormBuilder, Validators } from '@angular/forms';

function makeDesafioLogic() {
  const fb = new FormBuilder();
  const d = new Date(); d.setDate(d.getDate() + 7);
  const defaultV = d.toISOString().split('T')[0];

  const form = fb.group({
    titulo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(180)]],
    logroRelacionado: ['', [Validators.maxLength(120)]],
    fechaVencimiento: [defaultV, Validators.required],
  });

  let isEditing = false;
  let item: any = null;
  let saved = 0;
  const toasts: any[] = [];

  function loadForEdit(it: any) {
    if (!it) return;
    isEditing = true;
    item = it;
    const yyyy = new Date(it.fechaVencimiento).getFullYear();
    const mm = String(new Date(it.fechaVencimiento).getMonth() + 1).padStart(2, '0');
    const dd = String(new Date(it.fechaVencimiento).getDate()).padStart(2, '0');
    form.patchValue({ titulo: it.titulo || '', logroRelacionado: it.logroRelacionado || '', fechaVencimiento: `${yyyy}-${mm}-${dd}` });
  }

  async function guardar(user: any, saveFn: (d: any) => Promise<void>) {
    if (form.invalid) return;
    if (!user || !user.gimnasioId) { toasts.push({ color: 'danger' }); return; }
    const v = form.value;
    const [y, m, dd] = (v.fechaVencimiento || '').split('-').map(Number);
    const fv = new Date(y, m - 1, dd, 23, 59, 59);
    if (fv <= new Date()) { toasts.push({ color: 'warning' }); return; }

    const data: any = isEditing && item
      ? { ...item, titulo: (v.titulo || '').trim(), logroRelacionado: v.logroRelacionado?.trim() || undefined, fechaVencimiento: fv }
      : { id: '', creadorId: user.uid, gimnasioId: user.gimnasioId, titulo: (v.titulo || '').trim(), fechaVencimiento: fv, activo: true };

    await saveFn(data);
    saved++;
  }

  return { form, isEditing: () => isEditing, loadForEdit, guardar, toasts, savedCount: () => saved };
}

describe('DesafioModal (logic + date guards + create/edit)', () => {
  it('has default future date and required titulo minLength', () => {
    const m = makeDesafioLogic();
    expect(m.form.get('fechaVencimiento')?.value).toBeTruthy();
  });

  it('loadForEdit sets editing + prefill', () => {
    const m = makeDesafioLogic();
    m.loadForEdit({ titulo: 'Este es un desafío largo suficiente', fechaVencimiento: new Date('2030-12-31') });
    expect(m.isEditing()).toBe(true);
    expect(m.form.get('titulo')?.value).toContain('Este es');
  });

  it('help only on create (isEditing flag)', () => {
    const m = makeDesafioLogic();
    expect(m.isEditing()).toBe(false);
  });

  it('blocks invalid form early and past dates', async () => {
    const m = makeDesafioLogic();
    // short titulo -> invalid, early return, no save
    m.form.patchValue({ titulo: 'corto', fechaVencimiento: '2020-01-01' });
    await m.guardar({ uid: 'u', gimnasioId: 'g' }, vi.fn());
    expect(m.savedCount()).toBe(0);

    // valid length but past date -> warning toast
    m.form.patchValue({ titulo: 'Este desafío es suficientemente largo' });
    await m.guardar({ uid: 'u', gimnasioId: 'g' }, vi.fn());
    expect(m.toasts.some(t => t.color === 'warning')).toBe(true);
  });

  it('blocks when no gym', async () => {
    const m = makeDesafioLogic();
    m.form.patchValue({ titulo: 'Este desafío es suficientemente largo', fechaVencimiento: '2030-01-01' });
    await m.guardar({ uid: 'u', gimnasioId: null }, vi.fn());
    expect(m.toasts.some(t => t.color === 'danger')).toBe(true);
  });

  it('create builds with creador + calls save', async () => {
    const m = makeDesafioLogic();
    m.form.patchValue({ titulo: 'Este desafío tiene más de diez caracteres', fechaVencimiento: '2035-01-01' });
    const save = vi.fn().mockResolvedValue(undefined);
    await m.guardar({ uid: 'u1', gimnasioId: 'g1' }, save);
    expect(save).toHaveBeenCalled();
    expect(save.mock.calls[0][0].creadorId).toBe('u1');
  });

  it('edit reuses id, does not add extra fields', async () => {
    const m = makeDesafioLogic();
    m.loadForEdit({ id: 'd-55', creadorId: 'u1', titulo: 'Viejo título suficientemente largo' });
    m.form.patchValue({ titulo: 'Nuevo título suficientemente largo' });
    const save = vi.fn().mockResolvedValue(undefined);
    await m.guardar({ uid: 'u1', gimnasioId: 'g' }, save);
    expect(save.mock.calls[0][0].id).toBe('d-55');
  });
});
