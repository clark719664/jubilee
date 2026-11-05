/**
 * drawer.ts — the slot rail (six big round tabs) and the drawer of items for the chosen slot.
 *
 * Keyboard path (the brief: "Tab slots, arrows items, Enter wear"):
 *   Tab / Shift+Tab   move between the six slot tabs; focusing a tab opens its drawer
 *   ← → ↑ ↓ on a tab  step into the drawer, starting next to what Jubi is wearing
 *   ← → ↑ ↓ in drawer move between items (↑ ↓ jump a row in the grid), Home/End first/last
 *   Enter / Space     put the item on (again: take it off)
 *   Tab in drawer     on to the next slot tab; Shift+Tab back to this slot's tab
 * Every button is at least 56 px; in-season items sparkle and come first.
 */
import { h, svg } from '../../ui/dom';
import { BODY, INK, starD, twinkleD } from './art-kit';
import { itemById, SLOTS, type Item, type Slot } from './catalog';
import { COPY, fill } from './copy';
import { drawGlow, drawItem, drawPattern } from './dress';
import type { Outfit, SeasonHoliday } from './outfit';
import { seasonScore, sortForSeason } from './outfit';

export interface DrawerOptions {
  readonly season: readonly (SeasonHoliday & { name: string })[];
  readonly onWear: (id: string) => void;
  readonly onSlot: (slot: Slot) => void;
}

export interface Drawer {
  readonly rail: HTMLElement;
  readonly panel: HTMLElement;
  readonly slot: Slot;
  select(slot: Slot): void;
  sync(outfit: Outfit): void;
  focusTab(slot: Slot): void;
}

/** Representative items for empty slot tabs. */
const SLOT_ICON: Record<Slot, string> = {
  hat: 'party-hat', glasses: 'star-glasses', neck: 'bow-tie', held: 'balloon', glow: 'glow-sunny', pattern: 'dots',
};

const STAR = starD(50, 54, 40, 17);

/** A thumbnail SVG of an item, fitted to its own drawing once it is in the page. */
export function thumb(id: string): SVGSVGElement {
  const it = itemById(id);
  const out = svg('svg', { class: 'dz-thumb', 'aria-hidden': 'true', viewBox: '0 0 100 100' });
  if (!it) return out;
  if (it.slot === 'glow') {
    out.setAttribute('viewBox', '-4 0 108 108');
    const glow = drawGlow(id);
    if (glow) out.append(glow);
    out.append(svg('path', { d: STAR, fill: BODY, stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }));
    return out;
  }
  if (it.slot === 'pattern') {
    out.setAttribute('viewBox', '6 10 88 88');
    out.append(svg('path', { d: STAR, fill: BODY }));
    const pat = drawPattern(id, STAR);
    if (pat) out.append(pat);
    return out;
  }
  const wrap = svg('g', { class: 'dz-thumb-fit' });
  const art = drawItem(id);
  if (art) wrap.append(art);
  out.append(wrap);
  out.setAttribute('data-fit', '1');
  return out;
}

/** Fits every unfitted thumbnail's viewBox to its drawing (needs layout, so runs after insertion). */
export function fitThumbs(root: ParentNode): void {
  for (const s of root.querySelectorAll<SVGSVGElement>('svg[data-fit="1"]')) {
    const g = s.querySelector<SVGGraphicsElement>('.dz-thumb-fit');
    if (!g || typeof g.getBBox !== 'function') continue;
    let b: DOMRect;
    try { b = g.getBBox(); } catch { continue; }
    if (b.width === 0 || b.height === 0) continue;
    const size = Math.max(b.width, b.height) * 1.14;
    const x = b.x + b.width / 2 - size / 2;
    const y = b.y + b.height / 2 - size / 2;
    s.setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${size.toFixed(1)} ${size.toFixed(1)}`);
    s.removeAttribute('data-fit');
  }
}

/** The in-season sparkle on an item's corner. */
function badge(): SVGSVGElement {
  const s = svg('svg', { viewBox: '-11 -11 22 22', class: 'dz-season-star' });
  s.append(svg('path', { d: twinkleD(0, 0, 9.5), fill: '#ffd23f', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round' }));
  return s;
}

export function createDrawer(opts: DrawerOptions): Drawer {
  let current: Slot = 'hat';
  let outfit: Outfit = {};
  const tabs = new Map<Slot, { btn: HTMLButtonElement; icon: HTMLElement; dot: HTMLElement }>();
  const rail = h('div', { class: 'dz-rail', role: 'tablist', 'aria-label': COPY.title });
  for (const slot of SLOTS) {
    const icon = h('span', { class: 'dz-tab-icon' });
    const dot = h('span', { class: 'dz-tab-dot', 'aria-hidden': 'true' });
    const btn = h('button', {
      type: 'button', class: 'dz-tab', role: 'tab', id: `dz-tab-${slot}`, 'aria-controls': 'dz-panel', 'aria-selected': 'false',
      'data-slot': slot,
    }, icon, h('span', { class: 'dz-tab-name' }, COPY.slots[slot]), dot);
    btn.addEventListener('focus', () => select(slot));
    btn.addEventListener('click', () => select(slot));
    btn.addEventListener('keydown', (e) => onTabKey(e, slot));
    tabs.set(slot, { btn, icon, dot });
    rail.append(btn);
  }
  const grid = h('div', { class: 'dz-items', role: 'group' });
  const panel = h('div', { class: 'dz-panel', id: 'dz-panel', role: 'tabpanel' }, grid);
  grid.addEventListener('keydown', onItemKey);

  let buttons: HTMLButtonElement[] = [];

  function seasonOf(it: Item): string | null {
    let best: { name: string; score: number } | null = null;
    for (const h0 of opts.season) {
      const s = seasonScore(it, h0);
      if (s > 0 && (!best || s > best.score)) best = { name: h0.name, score: s };
    }
    return best?.name ?? null;
  }

  function render(): void {
    const ranked = sortForSeason(current, opts.season);
    buttons = ranked.map(({ item, score }) => {
      const holiday = score > 0 ? seasonOf(item) : null;
      const b = h('button', {
        type: 'button', class: `dz-item${holiday ? ' is-season' : ''}`, 'data-id': item.id, tabindex: '-1',
        'aria-pressed': outfit[item.slot] === item.id ? 'true' : 'false',
        'aria-label': holiday ? fill(COPY.itemSeason, { name: item.name, holiday }) : item.name,
        title: item.name,
        onclick: () => { opts.onWear(item.id); },
      }, h('span', { class: 'dz-disc' }, thumb(item.id)),
      holiday ? h('span', { class: 'dz-season', 'aria-hidden': 'true' }, badge()) : null,
      h('span', { class: 'dz-item-name', 'aria-hidden': 'true' }, item.name));
      return b;
    });
    grid.replaceChildren(...buttons);
    grid.setAttribute('aria-label', fill(COPY.drawer, { slot: COPY.slots[current] }));
    panel.setAttribute('aria-labeledby', `dz-tab-${current}`);
    const worn = buttons.findIndex((b) => b.getAttribute('aria-pressed') === 'true');
    (buttons[worn >= 0 ? worn : 0])?.setAttribute('tabindex', '0');
    grid.scrollLeft = 0;
    grid.scrollTop = 0;
    requestAnimationFrame(() => fitThumbs(grid));
  }

  function select(slot: Slot): void {
    if (slot === current && buttons.length > 0) return;
    current = slot;
    for (const [s, t] of tabs) t.btn.setAttribute('aria-selected', s === slot ? 'true' : 'false');
    render();
    opts.onSlot(slot);
  }

  function focusItem(i: number): void {
    const n = buttons.length;
    if (n === 0) return;
    const k = ((i % n) + n) % n;
    buttons.forEach((b, j) => b.setAttribute('tabindex', j === k ? '0' : '-1'));
    const b = buttons[k]!;
    b.focus({ preventScroll: true });
    b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function wornIndex(): number {
    return buttons.findIndex((b) => b.getAttribute('aria-pressed') === 'true');
  }

  function onTabKey(e: KeyboardEvent, slot: Slot): void {
    if (slot !== current) select(slot);
    const w = wornIndex();
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); focusItem(w >= 0 ? w + 1 : 0); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); focusItem(w >= 0 ? w - 1 : buttons.length - 1); }
    else if (e.key === 'Home') { e.preventDefault(); focusItem(0); }
    else if (e.key === 'End') { e.preventDefault(); focusItem(buttons.length - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focusItem(w >= 0 ? w : 0); }
  }

  /** Items per row in the current layout (1 row on phones, a grid on wide screens). */
  function cols(): number {
    const top = buttons[0]?.offsetTop ?? 0;
    let n = 0;
    for (const b of buttons) { if (b.offsetTop !== top) break; n++; }
    return Math.max(1, n);
  }

  function onItemKey(e: KeyboardEvent): void {
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const c = cols();
    const rowwise = c < buttons.length;
    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); focusItem(i + 1); break;
      case 'ArrowLeft': e.preventDefault(); focusItem(i - 1); break;
      case 'ArrowDown': e.preventDefault(); focusItem(rowwise ? Math.min(buttons.length - 1, i + c) : i + 1); break;
      case 'ArrowUp': e.preventDefault(); focusItem(rowwise ? Math.max(0, i - c) : i - 1); break;
      case 'Home': e.preventDefault(); focusItem(0); break;
      case 'End': e.preventDefault(); focusItem(buttons.length - 1); break;
      case 'Tab': {
        const k = SLOTS.indexOf(current);
        if (e.shiftKey) { e.preventDefault(); tabs.get(current)?.btn.focus(); }
        else if (k < SLOTS.length - 1) { e.preventDefault(); tabs.get(SLOTS[k + 1]!)?.btn.focus(); }
        break;
      }
      default: break;
    }
  }

  function sync(next: Outfit): void {
    outfit = next;
    for (const b of buttons) {
      const id = b.getAttribute('data-id') ?? '';
      b.setAttribute('aria-pressed', outfit[current] === id ? 'true' : 'false');
    }
    for (const [slot, t] of tabs) {
      const worn = itemById(outfit[slot]);
      t.icon.replaceChildren(thumb(worn?.id ?? SLOT_ICON[slot]));
      t.btn.classList.toggle('is-worn', Boolean(worn));
      t.btn.setAttribute('aria-label', fill(COPY.slotLabel, { slot: COPY.slots[slot], worn: worn?.name ?? COPY.nothing }));
    }
    requestAnimationFrame(() => fitThumbs(rail));
  }

  return {
    rail,
    panel,
    get slot() { return current; },
    select,
    sync,
    focusTab(slot) { tabs.get(slot)?.btn.focus(); },
  };
}
