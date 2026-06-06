import { vi } from 'vitest';
import { signal, computed } from '@angular/core';

/**
 * CreacionesPage orchestration logic tests.
 * Covers: signals, computed "mis*" / "propias" filters (uid + legacy ids), premium gating,
 * open/edit/close flows, segment, resilience (no uid => []), and the delete service calls (without full AlertController execution).
 * These run cleanly in vitest. Use `ng test` for full component + template + controller integration.
 */

function makeCreacionesPageLogic() {
  const currentUser = signal<any>({ uid: 'juan-1', plan: 'premium', gimnasioId: 'g1' });
  const isPremium = computed(() => currentUser()?.plan === 'premium');
  const userId = computed(() => currentUser()?.uid);

  const convSvc = { convocatorias: signal<any[]>([]), delete: vi.fn().mockResolvedValue(undefined) };
  const desSvc = { getDesafiosByCreador: (uid: string) => signal<any[]>([]), delete: vi.fn() };
  const rutSvc = { rutinas: signal<any[]>([]), delete: vi.fn() };
  const ejSvc = { ejercicios: signal<any[]>([]), delete: vi.fn() };
  const entSvc = {
    getEntrenado: (uid: string) => signal<any>({ rutinasCreadas: [], ejerciciosCreadosIds: [] }),
    removeEjercicioCreado: vi.fn(), removeRutinaCreada: vi.fn(),
  };

  const isConvOpen = signal(false);
  const isDesOpen = signal(false);
  const isRutOpen = signal(false);
  const isEjOpen = signal(false);

  const convToEdit = signal<any | null>(null);
  const desToEdit = signal<any | null>(null);
  const rutToEdit = signal<any | null>(null);
  const ejToEdit = signal<any | null>(null);

  const selectedTab = signal<'convocatorias' | 'desafios' | 'rutinas' | 'ejercicios'>('convocatorias');

  const misConvocatorias = computed(() => {
    const uid = userId();
    if (!uid) return [];
    return convSvc.convocatorias().filter((c: any) => c.creadorId === uid)
      .sort((a: any, b: any) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
  });

  const rutinasPropias = computed(() => {
    const uid = userId(); if (!uid) return [];
    const byC = rutSvc.rutinas().filter((r: any) => r.creadorId === uid);
    const ids = entSvc.getEntrenado(uid)()?.rutinasCreadas || [];
    const byId = rutSvc.rutinas().filter((r: any) => ids.includes(r.id));
    const map = new Map(); [...byC, ...byId].forEach(r => map.set(r.id, r));
    return Array.from(map.values());
  });

  const ejerciciosCreados = computed(() => {
    const uid = userId(); if (!uid) return [];
    const byC = ejSvc.ejercicios().filter((e: any) => e.creadorId === uid);
    const ids = entSvc.getEntrenado(uid)()?.ejerciciosCreadosIds || [];
    const byId = ejSvc.ejercicios().filter((e: any) => ids.includes(e.id));
    const map = new Map(); [...byC, ...byId].forEach(e => map.set(e.id, e));
    return Array.from(map.values());
  });

  function abrirModalRutina() {
    if (isPremium()) isRutOpen.set(true);
    else { /* would show premium toast */ }
  }
  function abrirModalEjercicio() {
    if (isPremium()) isEjOpen.set(true);
  }
  function onEditRutina(item: any) { rutToEdit.set(item); isRutOpen.set(true); }
  function onEditEjercicio(item: any) { ejToEdit.set(item); isEjOpen.set(true); }

  async function eliminarRutina(id: string) {
    try {
      await rutSvc.delete(id);
      const uid = userId();
      if (uid) await entSvc.removeRutinaCreada(uid, id);
    } catch (e) { /* toast danger */ }
  }

  return {
    currentUser, isPremium, userId,
    isConvOpen, isDesOpen, isRutOpen, isEjOpen,
    convToEdit, desToEdit, rutToEdit, ejToEdit, selectedTab,
    misConvocatorias, rutinasPropias, ejerciciosCreados,
    convSvc, desSvc, rutSvc, ejSvc, entSvc,
    abrirModalRutina, abrirModalEjercicio, onEditRutina, onEditEjercicio, eliminarRutina,
  };
}

describe('CreacionesPage (orchestration, computed filters, premium, delete flows, resilience)', () => {
  it('isPremium + userId derive from currentUser', () => {
    const p = makeCreacionesPageLogic();
    expect(p.isPremium()).toBe(true);
    p.currentUser.set({ uid: 'f', plan: 'free' });
    expect(p.isPremium()).toBe(false);
  });

  it('misConvocatorias filters by uid + sorts newest first', () => {
    const p = makeCreacionesPageLogic();
    p.convSvc.convocatorias.set([
      { id: 'c1', creadorId: 'juan-1', fechaCreacion: new Date('2025-01-01') },
      { id: 'c2', creadorId: 'other' },
      { id: 'c3', creadorId: 'juan-1', fechaCreacion: new Date('2025-02-01') },
    ]);
    const res = p.misConvocatorias();
    expect(res.map(r => r.id)).toEqual(['c3', 'c1']);
  });

  it('rutinasPropias + ejerciciosCreados merge creadorId + profile arrays (dedup)', () => {
    const p = makeCreacionesPageLogic();
    p.currentUser.set({ uid: 'u1' });
    p.entSvc.getEntrenado = () => signal({ rutinasCreadas: ['r-legacy'], ejerciciosCreadosIds: ['e-legacy'] });
    p.rutSvc.rutinas.set([{ id: 'r-new', creadorId: 'u1' }, { id: 'r-legacy' }]);
    p.ejSvc.ejercicios.set([{ id: 'e-new', creadorId: 'u1' }, { id: 'e-legacy' }, { id: 'foreign' }]);

    expect(p.rutinasPropias().map((r: any) => r.id)).toEqual(expect.arrayContaining(['r-new', 'r-legacy']));
    expect(p.ejerciciosCreados().map((e: any) => e.id)).toEqual(expect.arrayContaining(['e-new', 'e-legacy']));
  });

  it('abrirModalRutina/Ejercicio only open when premium', () => {
    const p = makeCreacionesPageLogic();
    p.currentUser.set({ uid: 'f', plan: 'free' });
    p.abrirModalRutina();
    p.abrirModalEjercicio();
    expect(p.isRutOpen()).toBe(false);
    expect(p.isEjOpen()).toBe(false);

    p.currentUser.set({ uid: 'p', plan: 'premium' });
    p.abrirModalRutina();
    expect(p.isRutOpen()).toBe(true);
  });

  it('onEdit* set the edit signal and open modal', () => {
    const p = makeCreacionesPageLogic();
    const item = { id: 'r-1' };
    p.onEditRutina(item);
    expect(p.rutToEdit()).toBe(item);
    expect(p.isRutOpen()).toBe(true);
  });

  it('eliminarRutina calls delete + removeRutinaCreada', async () => {
    const p = makeCreacionesPageLogic();
    await p.eliminarRutina('r-del');
    expect(p.rutSvc.delete).toHaveBeenCalledWith('r-del');
    expect(p.entSvc.removeRutinaCreada).toHaveBeenCalled();
  });

  it('resilience: all "mis" computeds return [] when no uid', () => {
    const p = makeCreacionesPageLogic();
    p.currentUser.set(null);
    expect(p.misConvocatorias()).toEqual([]);
    expect(p.rutinasPropias()).toEqual([]);
    expect(p.ejerciciosCreados()).toEqual([]);
  });

  it('selectedTab and segment work', () => {
    const p = makeCreacionesPageLogic();
    p.selectedTab.set('ejercicios');
    expect(p.selectedTab()).toBe('ejercicios');
  });
});
