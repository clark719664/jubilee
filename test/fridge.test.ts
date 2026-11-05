import { describe, expect, it } from 'vitest';
import { FRIDGE_CAP, FRIDGE_KEY, Fridge, type FridgeStorage } from '../src/play/fridge';

function memory(): FridgeStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

const item = { kind: 'card' as const, holidayId: 'diwali', made: '2026-11-08', title: 'Card for Nani', data: { greeting: 0 } };

describe('Fridge', () => {
  it('keeps what the child made across reloads', () => {
    const s = memory();
    const a = new Fridge({ storage: s });
    const res = a.add(item);
    expect(res.ok).toBe(true);
    const b = new Fridge({ storage: s });
    expect(b.list()).toHaveLength(1);
    expect(b.list('card')[0]!.title).toBe('Card for Nani');
    expect(JSON.parse(s.data.get(FRIDGE_KEY)!).version).toBe(1);
  });

  it('refuses when full instead of deleting anything', () => {
    const f = new Fridge({ storage: memory() });
    for (let i = 0; i < FRIDGE_CAP; i++) expect(f.add({ ...item, title: `#${i}` }).ok).toBe(true);
    expect(f.add(item)).toEqual({ ok: false, reason: 'full' });
    expect(f.list()).toHaveLength(FRIDGE_CAP);
  });

  it('writes nothing while pretending a date', () => {
    const s = memory();
    const f = new Fridge({ storage: s, pretending: true });
    expect(f.add(item)).toEqual({ ok: false, reason: 'pretending' });
    expect(s.data.size).toBe(0);
  });

  it('updates, removes and survives garbage or missing storage', () => {
    const s = memory();
    s.setItem(FRIDGE_KEY, '{not json');
    const f = new Fridge({ storage: s });
    expect(f.list()).toEqual([]);
    const r = f.add(item);
    if (!r.ok) throw new Error('add failed');
    expect(f.update(r.item.id, { greeting: 2 }, 'Card for Dada')).toBe(true);
    expect(f.get(r.item.id)!.title).toBe('Card for Dada');
    f.remove(r.item.id);
    expect(f.list()).toEqual([]);
    const none = new Fridge({ storage: null });
    expect(none.storageOk).toBe(false);
    expect(none.add(item).ok).toBe(true);
  });
});
