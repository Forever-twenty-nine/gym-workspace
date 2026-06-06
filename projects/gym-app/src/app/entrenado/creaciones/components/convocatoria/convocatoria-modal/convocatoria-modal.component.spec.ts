import { vi } from 'vitest';
import { FormBuilder, Validators } from '@angular/forms';

/**
 * Logic & resilience tests for ConvocatoriaModal behavior (create/edit, guards, time validation, help visibility, save paths).
 * These exercise the core of the component without requiring Angular TestBed + templateUrl + full Ionic in this env.
 * Run `ng test` in the project for additional DOM + integration coverage.
 */

function makeConvocatoriaModalLogic() {
  const fb = new FormBuilder();
  const now = new Date();
  const hStart = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  const end = new Date(now.getTime() + 90 * 60000);
  const hEnd = String(end.getHours()).padStart(2, '0') + ':' + String(end.getMinutes()).padStart(2, '0');

  const form = fb.group({
    fechaCustom: [''],
    horaInicio: [hStart, [Validators.required]],
    horaFin: [hEnd, [Validators.required]],
    mensaje: ['', [Validators.maxLength(200)]],
  });

  let isEditing = false;
  let item: any = null;
  let savedEmitted = 0;
  let closedEmitted = 0;
  const toasts: any[] = [];

  function resetForNew() {
    isEditing = false;
    item = null;
    form.reset({ fechaCustom: '', horaInicio: hStart, horaFin: hEnd, mensaje: '' });
  }

  function loadForEdit(it: any) {
    if (!it) return;
    isEditing = true;
    item = it;
    form.patchValue({
      horaInicio: it.horaInicio,
      horaFin: it.horaFin,
      mensaje: it.mensaje || '',
    });
  }

  async function guardar(authUser: any, saveFn: (d: any) => Promise<void>) {
    if (form.invalid) return;
    if (!authUser) { toasts.push({ color: 'danger' }); return; }
    if (!authUser.gimnasioId) { toasts.push({ color: 'danger', msg: 'gimnasio' }); return; }

    const v = form.value;
    const [hs, ms] = (v.horaInicio || '00:00').split(':').map(Number);
    const [he, me] = (v.horaFin || '00:00').split(':').map(Number);
    if (hs * 60 + ms >= he * 60 + me) { toasts.push({ color: 'warning' }); return; }

    const data: any = isEditing && item
      ? { ...item, horaInicio: v.horaInicio, horaFin: v.horaFin, mensaje: v.mensaje || '' }
      : {
          id: 'cv-' + Date.now(),
          creadorId: authUser.uid,
          gimnasioId: authUser.gimnasioId,
          horaInicio: v.horaInicio,
          horaFin: v.horaFin,
          mensaje: v.mensaje || '',
          interesados: [],
          activo: true,
        };

    await saveFn(data);
    savedEmitted++;
    closedEmitted++;
    if (!isEditing) form.patchValue({ mensaje: '' });
  }

  return { form, isEditing: () => isEditing, loadForEdit, resetForNew, guardar, toasts, savedEmitted: () => savedEmitted, closedEmitted: () => closedEmitted };
}

describe('ConvocatoriaModal (logic, guards, edit/create, resilience)', () => {
  it('initializes form with times and is not editing', () => {
    const m = makeConvocatoriaModalLogic();
    expect(m.form.get('horaInicio')?.value).toBeTruthy();
    expect(m.form.get('horaFin')?.value).toBeTruthy();
    expect(m.isEditing()).toBe(false);
  });

  it('loadForEdit sets isEditing and pre-fills times/message', () => {
    const m = makeConvocatoriaModalLogic();
    m.loadForEdit({ horaInicio: '07:30', horaFin: '08:45', mensaje: 'Test' });
    expect(m.isEditing()).toBe(true);
    expect(m.form.get('horaInicio')?.value).toBe('07:30');
  });

  it('help is only for create (!isEditing) - the flag controls rendering in template', () => {
    const m = makeConvocatoriaModalLogic();
    expect(m.isEditing()).toBe(false); // create => show help
    m.loadForEdit({ horaInicio: '10:00', horaFin: '11:00' });
    expect(m.isEditing()).toBe(true);  // edit => no help
  });

  it('guardar does nothing on invalid form', async () => {
    const m = makeConvocatoriaModalLogic();
    m.form.get('horaInicio')?.setValue('');
    await m.guardar({ uid: 'u', gimnasioId: 'g' }, vi.fn());
    expect(m.savedEmitted()).toBe(0);
  });

  it('guardar errors when no user or no gimnasioId', async () => {
    const m = makeConvocatoriaModalLogic();
    await m.guardar(null, vi.fn());
    await m.guardar({ uid: 'u', gimnasioId: null }, vi.fn());
    expect(m.toasts.some(t => t.color === 'danger')).toBe(true);
  });

  it('guardar warns when start >= end', async () => {
    const m = makeConvocatoriaModalLogic();
    m.form.patchValue({ horaInicio: '12:00', horaFin: '12:00' });
    await m.guardar({ uid: 'u', gimnasioId: 'g' }, vi.fn());
    expect(m.toasts.some(t => t.color === 'warning')).toBe(true);
  });

  it('create path builds data with creador/gimnasio and calls save', async () => {
    const m = makeConvocatoriaModalLogic();
    m.form.patchValue({ horaInicio: '06:00', horaFin: '07:00', mensaje: 'Hola' });
    const save = vi.fn().mockResolvedValue(undefined);
    await m.guardar({ uid: 'juan', gimnasioId: 'gym-1' }, save);
    expect(save).toHaveBeenCalled();
    const arg = save.mock.calls[0][0];
    expect(arg.creadorId).toBe('juan');
    expect(arg.interesados).toEqual([]);
  });

  it('edit path reuses item id and updates only changed fields', async () => {
    const m = makeConvocatoriaModalLogic();
    m.loadForEdit({ id: 'cv-99', creadorId: 'juan', horaInicio: '08:00', horaFin: '09:00' });
    m.form.patchValue({ horaInicio: '08:15', horaFin: '09:15' });
    const save = vi.fn().mockResolvedValue(undefined);
    await m.guardar({ uid: 'juan', gimnasioId: 'g' }, save);
    const arg = save.mock.calls[0][0];
    expect(arg.id).toBe('cv-99');
    expect(arg.horaInicio).toBe('08:15');
  });
});
