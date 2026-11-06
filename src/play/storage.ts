/**
 * storage.ts — every localStorage key the activities use, in one place, so the grown-ups page can list
 * exactly what is kept on this device and "Reset everything" really clears everything.
 */
export interface PlayStoreKey { readonly key: string; readonly label: string }

export const PLAY_STORAGE: readonly PlayStoreKey[] = [
  { key: 'jubilee.fridge.v1', label: 'Things your child made (cards, pages, letters)' },
  { key: 'jubilee.doors.v1', label: 'Countdown doors opened' },
  { key: 'jubilee.seek.v1', label: 'Seek & Find progress' },
  { key: 'jubilee.color.v1', label: 'Coloring pages in progress' },
  { key: 'jubilee.jubi.v1', label: "Jubi's outfit" },
  { key: 'jubilee.arcade.v1', label: 'Best scores in Catch & Stack' },
  { key: 'jubilee.postcards.v1', label: 'Postcards collected' },
  { key: 'jubilee.santa.v1', label: 'Treats left out for Santa' },
  { key: 'jubilee.path.v1', label: "Jubi's Path puzzles solved" },
];

interface KeyValueStore { getItem(key: string): string | null; removeItem(key: string): void }

function defaultStorage(): KeyValueStore | null {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

/** Count list-like entries in a stored JSON value, for a friendly "3 saved" line. */
function countOf(raw: string): number | null {
  try {
    const v: unknown = JSON.parse(raw);
    if (Array.isArray(v)) return v.length;
    if (v && typeof v === 'object') {
      for (const k of ['items', 'opened', 'cards', 'pages']) {
        const x = (v as Record<string, unknown>)[k];
        if (Array.isArray(x)) return x.length;
      }
      const scenes = (v as Record<string, unknown>).scenes;
      if (scenes && typeof scenes === 'object') return Object.keys(scenes).length;
    }
  } catch { /* not JSON: still counts as saved */ }
  return null;
}

/** "Label: N saved" lines for the keys that hold something. */
export function playStorageLines(storage: KeyValueStore | null = defaultStorage()): string[] {
  if (!storage) return [];
  const out: string[] = [];
  for (const { key, label } of PLAY_STORAGE) {
    let raw: string | null = null;
    try { raw = storage.getItem(key); } catch { raw = null; }
    if (raw === null) continue;
    const n = countOf(raw);
    out.push(`${label}: ${n === null ? 'saved' : `${n} saved`}`);
  }
  return out;
}

/** Remove every activity key (part of "Reset everything"). */
export function clearPlayStorage(storage: KeyValueStore | null = defaultStorage()): void {
  if (!storage) return;
  for (const { key } of PLAY_STORAGE) {
    try { storage.removeItem(key); } catch { /* nothing to clear */ }
  }
}
