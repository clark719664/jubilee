/**
 * Countdown Doors — a little door to open every sleep before every tier-1 holiday (Christmas keeps its 24
 * advent doors). The board is skinned per holiday (boards.ts); the rules live in logic.ts and the memory of
 * opened doors in memory.ts. Opened doors stay open, missed days just wait, future doors wiggle "Not yet!",
 * and during and just after the holiday every door is open. Nothing is saved while pretending a date.
 *
 * Keyboard: arrows move between doors (by position on the board), Home/End jump, Enter/Space open,
 * Esc closes an open card (focus returns to its door). `doorStrip(env)` is the two-door teaser for the
 * holiday page.
 */
import type { AppContext } from '../../app/context';
import { hasColorPage, sceneDataFor } from '../../art/index';
import type { HolidayContent, HolidayMeta } from '../../content/types';
import { toDayNumber } from '../../dates/civil';
import { nextOccurrence, previousOccurrence } from '../../dates/occurrences';
import { mulberry32 } from '../../effects/rng';
import { h, trapFocus } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { mascot, mascotState, spin, type MascotState } from '../../ui/mascot';
import type { Activity, ActivityInstance, PlayEnv } from '../types';
import { skinArt } from './boards';
import { doorCard } from './card';
import { COPY, fill, notYetText } from './copy';
import { makeDoor, paintDoor, sparkleBurst, wiggle } from './door';
import {
  boardDoors, boardOrder, boardYear, canOpen, doorView, featured, moonFill, phaseOf, skinFor, unlockedCount,
  type BoardDoor, type DoorView, type Phase, type Skin,
} from './logic';
import { doorMemory, type DoorMemory } from './memory';
import './doors.css';

export { boardDoors, phaseOf, doorView, featured, skinFor } from './logic';
export { doorMemory, DOORS_KEY } from './memory';

// ───────── the model both the board and the strip read ─────────

interface Model {
  readonly doors: readonly BoardDoor[];
  readonly skin: Skin;
  readonly phase: Phase;
  readonly memory: DoorMemory;
  view(door: BoardDoor): DoorView;
}

function buildModel(ctx: AppContext, meta: HolidayMeta, content: HolidayContent): Model {
  const today = ctx.clock.today();
  const doors = boardDoors(meta, content);
  const firstOpensAt = doors.reduce((m, d) => Math.max(m, d.opensAt), 0);
  const metas = ctx.metas.some((m) => m.id === meta.id) ? ctx.metas : [...ctx.metas, meta];
  const next = nextOccurrence(metas, meta.id, today, ctx.region);
  const prev = previousOccurrence(metas, meta.id, today, ctx.region);
  const phase = phaseOf(next, prev, today, firstOpensAt);
  const memory = doorMemory(ctx, meta.id, (content.advent?.length ?? 0) > 0);
  const year = boardYear(phase);
  const lastYear = phase.kind === 'far' || phase.kind === 'beyond' ? phase.prevYear : undefined;
  return {
    doors, skin: skinFor(meta), phase, memory,
    view: (door) => doorView(door, phase,
      (n) => year !== null && memory.has(year, n),
      (n) => lastYear !== undefined && memory.has(lastYear, n)),
  };
}

/** Set by the holiday-page strip so the board opens that door as soon as it mounts. */
let pendingOpen: { readonly id: string; readonly n: number } | null = null;

const playHash = (id: string, activity: string): string => `#/h/${id}/play/${activity}`;

// ───────── headline copy ─────────

function headline(phase: Phase, meta: HolidayMeta): { readonly big: Node; readonly sub: string } {
  switch (phase.kind) {
    case 'countdown':
      return {
        big: phase.sleeps === 1
          ? h('span', {}, fill(COPY.countdownOne, { name: meta.name }))
          : h('span', { class: 'dr-headrow' }, h('span', { class: 'dr-big' }, String(phase.sleeps)), ' ',
            h('span', { class: 'dr-headtext' }, fill(COPY.countdown, { n: '', name: meta.name }).trim())),
        sub: '',
      };
    case 'celebrating': return { big: h('span', {}, fill(COPY.celebrating, { name: meta.name })), sub: '' };
    case 'after': return { big: h('span', {}, fill(COPY.after, { name: meta.name })), sub: '' };
    case 'far':
      return {
        big: h('span', {}, phase.firstIn === 1 ? COPY.farTitleOne : fill(COPY.farTitle, { n: phase.firstIn })),
        sub: fill(COPY.farSub, { name: meta.name, m: phase.sleeps }),
      };
    case 'beyond': return { big: h('span', {}, COPY.beyond), sub: '' };
  }
}

/** Jubi's mood follows the board: dozing far away, peeking during the countdown, partying on the day. */
function jubiMood(phase: Phase): MascotState {
  switch (phase.kind) {
    case 'countdown': return mascotState(phase.sleeps);
    case 'celebrating': case 'after': return 'party';
    case 'far': return mascotState(phase.sleeps);
    case 'beyond': return 'sleepy';
  }
}

// ───────── keyboard: move between doors by where they sit ─────────

function neighbor(doors: readonly HTMLElement[], from: HTMLElement, key: string): HTMLElement | null {
  const i = doors.indexOf(from);
  if (key === 'Home') return doors[0] ?? null;
  if (key === 'End') return doors[doors.length - 1] ?? null;
  if (key === 'ArrowRight') return doors[i + 1] ?? null;
  if (key === 'ArrowLeft') return doors[i - 1] ?? null;
  const r = from.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const down = key === 'ArrowDown';
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const d of doors) {
    if (d === from) continue;
    const b = d.getBoundingClientRect();
    const dy = down ? b.top - r.top : r.top - b.top;
    if (dy < r.height * 0.4) continue;
    const score = dy * 3 + Math.abs(b.left + b.width / 2 - cx);
    if (score < bestScore) { bestScore = score; best = d; }
  }
  return best;
}

// ───────── the board ─────────

function mount(env: PlayEnv): ActivityInstance {
  const { ctx, meta, content } = env;
  const root = h('section', { class: 'dr-root sky', 'aria-labeledby': 'dr-h1' });
  const disposers: (() => void)[] = [];
  // Esc anywhere on the board goes back to the holiday page (an open door's card handles its own Esc first).
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    env.close();
  });
  let cardOpen: { close(): void } | null = null;
  let renderedDay = toDayNumber(ctx.clock.today());

  const motion = (): 'full' | 'calm' | 'still' => (ctx.motion === 'full' ? 'full' : ctx.motion === 'reduced' ? 'calm' : 'still');

  const render = (): void => {
    cardOpen?.close();
    const m = buildModel(ctx, meta, content);
    const order = boardOrder(m.doors, m.skin, mulberry32(meta.id.length * 977 + 25));
    root.dataset.skin = m.skin;
    root.dataset.phase = m.phase.kind;
    root.dataset.count = String(m.doors.length);

    // Header.
    // Jubi sits at the end of the header: a tap gives a spin, and Jubi cheers when a door opens for the first time.
    const jubi = h('button', { type: 'button', class: 'dr-jubi', 'aria-label': COPY.jubi }, mascot(jubiMood(m.phase), 72));
    const cheer = (): void => { if (motion() === 'full') spin(jubi.firstElementChild!); };
    jubi.addEventListener('click', cheer);
    const back = h('button', { type: 'button', class: 'btn btn-secondary btn-icon dr-back', 'aria-label': fill(COPY.back, { name: meta.name }) }, icon('back', 24));
    back.addEventListener('click', () => env.close());
    const head = headline(m.phase, meta);
    const sub = h('p', { class: 'dr-sub' });
    const header = h('header', { class: 'dr-top' },
      back,
      h('div', { class: 'dr-titles' },
        h('p', { class: 'dr-kicker' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, meta.emoji), ' ', meta.name),
        h('h1', { class: 'h1 dr-h1', id: 'dr-h1' }, COPY.title)),
      jubi,
    );
    const hello = h('div', { class: 'dr-hello' }, h('p', { class: 'dr-headline' }, head.big), sub);

    // Progress garland: one bulb per door, lit once peeked inside. Never a streak.
    const bulbs = m.doors.map(() => h('li', { class: 'dr-bulb' }));
    const garlandText = h('p', { class: 'dr-garland-text' });
    const garland = h('div', { class: 'dr-garland' }, h('ul', {
      class: 'dr-bulbs', 'aria-hidden': 'true',
      style: `--per-row: ${Math.min(12, Math.max(1, Math.ceil(bulbs.length / Math.ceil(bulbs.length / 12))))}; --per-row-wide: ${Math.max(1, bulbs.length)}`,
    }, ...bulbs), garlandText);

    // Doors.
    const art = skinArt(m.skin, moonFill(unlockedCount(m.doors, m.phase), m.doors.length));
    const buttons = new Map<BoardDoor, HTMLButtonElement>();
    order.forEach((door, i) => buttons.set(door, makeDoor(door, m.skin, i)));
    const ordered = order.map((d) => buttons.get(d)!);
    const grids: HTMLElement[] = [];
    const label = fill(COPY.boardLabel, { name: meta.name });
    if (m.skin === 'house' && ordered.length > 8) {
      grids.push(h('div', { class: 'dr-grid dr-floor-up', role: 'group', 'aria-label': label }, ...ordered.slice(0, 8)));
      grids.push(h('div', { class: 'dr-grid dr-floor-down', role: 'group', 'aria-label': label }, ...ordered.slice(8)));
    } else {
      grids.push(h('div', { class: 'dr-grid', role: 'group', 'aria-label': label }, ...ordered));
    }
    const bubble = h('p', { class: 'dr-bubble', role: 'status', 'aria-live': 'polite', hidden: true });
    const board = h('div', { class: 'dr-board' },
      h('div', { class: 'dr-board-top' }, ...art.top),
      h('div', { class: 'dr-board-body' }, ...grids),
      h('div', { class: 'dr-board-bottom' }, ...art.bottom),
      bubble);
    const overlay = h('div', { class: 'dr-overlay', hidden: true });

    const year = boardYear(m.phase);
    const paintAll = (): void => {
      let peeked = 0;
      let todayOpened = false;
      let todayExists = false;
      let waiting = false;
      for (const [door, btn] of buttons) {
        const v = m.view(door);
        paintDoor(btn, door, v);
        if (v.state === 'opened') peeked++;
        if (v.state === 'today') { todayExists = true; }
        if (v.state === 'ready') waiting = true;
        if (m.phase.kind === 'countdown' && door.opensAt === m.phase.sleeps) { todayExists = true; todayOpened = v.state === 'opened'; }
      }
      // Bulbs light in board order from the left, so the garland visibly fills.
      bulbs.forEach((b, i) => b.classList.toggle('is-lit', i < peeked));
      garlandText.textContent = peeked === 0 ? fill(COPY.garlandNone, { t: m.doors.length }) : fill(COPY.garland, { k: peeked, t: m.doors.length });
      let s = head.sub;
      if (m.phase.kind === 'countdown') s = todayExists ? (todayOpened ? (waiting ? COPY.missedReady : COPY.todayOpened) : COPY.todayReady) : (waiting ? COPY.missedReady : '');
      if ((m.phase.kind === 'far' || m.phase.kind === 'beyond') && [...buttons.keys()].some((d) => m.view(d).fromLastTime)) s = `${s} ${COPY.farLastTime}`.trim();
      sub.textContent = s;
      sub.hidden = s === '';
    };
    paintAll();

    // Roving tabindex: today's door (or the first one that can open) takes Tab.
    const f = featured(m.doors, m.phase);
    const start = (f.today && buttons.get(f.today)) ?? ordered.find((_b, i) => canOpen(m.view(order[i]!))) ?? ordered[0];
    for (const b of ordered) b.tabIndex = b === start ? 0 : -1;

    let bubbleTimer = 0;
    const say = (btn: HTMLElement, text: string): void => {
      bubble.textContent = text;
      bubble.hidden = false;
      const bb = board.getBoundingClientRect();
      const r = btn.getBoundingClientRect();
      const x = Math.min(Math.max(r.left - bb.left + r.width / 2, 110), bb.width - 110);
      bubble.style.left = `${x.toFixed(0)}px`;
      bubble.style.top = `${(r.top - bb.top).toFixed(0)}px`;
      bubble.classList.remove('is-in');
      void bubble.offsetWidth;
      bubble.classList.add('is-in');
      window.clearTimeout(bubbleTimer);
      bubbleTimer = window.setTimeout(() => { bubble.hidden = true; }, 2600);
    };
    disposers.push(() => window.clearTimeout(bubbleTimer));

    const showCard = (door: BoardDoor, btn: HTMLButtonElement): void => {
      const card = doorCard(door, meta, {
        canSeek: sceneDataFor(meta.id).findables.length > 0,
        canColor: hasColorPage(meta.id),
        go: (activity) => { close(); env.close(); location.hash = playHash(meta.id, activity); },
        close: () => close(),
        announce: (t) => ctx.announce(t),
      }, `dr-card-h-${door.n}`);
      overlay.replaceChildren(card.el);
      overlay.hidden = false;
      const mode = motion();
      if (mode === 'full') {
        card.el.classList.add('is-popping');
      } else if (mode === 'calm' && typeof card.el.animate === 'function') {
        card.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      }
      const release = trapFocus(overlay);
      const onKey = (e: KeyboardEvent): void => {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        e.stopPropagation();
        close();
      };
      overlay.addEventListener('keydown', onKey);
      card.focus.focus();
      let closed = false;
      function close(): void {
        if (closed) return;
        closed = true;
        card.dispose();
        release();
        overlay.removeEventListener('keydown', onKey);
        overlay.hidden = true;
        overlay.replaceChildren();
        cardOpen = null;
        btn.focus();
      }
      cardOpen = { close };
    };

    const open = (door: BoardDoor, btn: HTMLButtonElement): void => {
      const v = m.view(door);
      if (!canOpen(v)) {
        wiggle(btn, motion() === 'full');
        const text = v.wait > 0 ? notYetText(v.wait) : COPY.shut;
        say(btn, text);
        ctx.announce(text);
        return;
      }
      const firstPeek = v.state === 'today' || v.state === 'ready';
      if (firstPeek && year !== null) m.memory.open(year, door.n);
      bubble.hidden = true;
      const mode = motion();
      const leaf = btn.querySelector<HTMLElement>('.dr-leaf');
      if (mode === 'calm' && leaf && typeof leaf.animate === 'function' && !btn.classList.contains('is-ajar')) {
        leaf.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-out' });
      }
      btn.classList.add('is-ajar');
      if (firstPeek) {
        paintAll();
        if (mode === 'full') { sparkleBurst(board, btn); cheer(); }
      }
      const delay = mode === 'full' ? 460 : mode === 'calm' ? 240 : 0;
      window.setTimeout(() => { if (root.isConnected || delay === 0) showCard(door, btn); }, delay);
    };

    for (const [door, btn] of buttons) {
      if (m.view(door).state === 'opened') btn.classList.add('is-ajar');
      btn.addEventListener('click', () => open(door, btn));
      btn.addEventListener('keydown', (e) => {
        const to = neighbor(ordered, btn, e.key);
        if (!to || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        btn.tabIndex = -1;
        to.tabIndex = 0;
        to.focus();
      });
    }

    root.replaceChildren(header, hello, garland, board, overlay);

    const pend = pendingOpen;
    if (pend && pend.id === meta.id) {
      pendingOpen = null;
      const door = m.doors.find((d) => d.n === pend.n);
      const btn = door && buttons.get(door);
      if (door && btn) window.setTimeout(() => { btn.focus(); open(door, btn); }, motion() === 'full' ? 320 : 0);
    }
  };

  render();

  // A board left open overnight moves on at midnight (and when the tab wakes up).
  const recheck = (): void => {
    const day = toDayNumber(ctx.clock.today());
    if (day === renderedDay) return;
    renderedDay = day;
    render();
  };
  const timer = window.setInterval(recheck, 60_000);
  document.addEventListener('visibilitychange', recheck);
  disposers.push(() => { window.clearInterval(timer); document.removeEventListener('visibilitychange', recheck); });
  disposers.push(ctx.onMotionChange(() => { root.dataset.motion = ctx.motion; }));
  root.dataset.motion = ctx.motion;

  return {
    el: root,
    destroy() {
      cardOpen?.close();
      for (const d of disposers) d();
    },
  };
}

// ───────── the strip for the holiday page ─────────

/**
 * Today's door and the next one, for the holiday page. Tapping today's door opens the board straight onto it;
 * tapping a door that is not ready wiggles and says "Not yet! N more sleeps". Holds no timers or listeners
 * outside itself, so the holiday page can drop it without a destroy call.
 */
export function doorStrip(env: PlayEnv): HTMLElement {
  const { ctx, meta, content } = env;
  const m = buildModel(ctx, meta, content);
  const f = featured(m.doors, m.phase);
  const note = h('p', { class: 'dr-strip-note', role: 'status', 'aria-live': 'polite' });
  const toBoard = (n?: number): void => {
    pendingOpen = n === undefined ? null : { id: meta.id, n };
    location.hash = playHash(meta.id, 'doors');
  };
  const mini = (door: BoardDoor, caption: string): HTMLElement => {
    const btn = makeDoor(door, m.skin, door.n);
    btn.classList.add('dr-mini');
    const v = m.view(door);
    paintDoor(btn, door, v);
    if (v.state === 'opened') btn.classList.add('is-ajar');
    btn.addEventListener('click', () => {
      const now = m.view(door);
      if (canOpen(now)) { toBoard(door.n); return; }
      wiggle(btn, ctx.motion === 'full');
      const text = now.wait > 0 ? notYetText(now.wait) : COPY.shut;
      note.textContent = text;
    });
    return h('figure', { class: 'dr-strip-door' }, btn, h('figcaption', { class: 'dr-strip-cap' }, caption));
  };

  const row: HTMLElement[] = [];
  let lead = '';
  if (m.phase.kind === 'countdown') {
    lead = m.phase.sleeps === 1 ? fill(COPY.countdownOne, { name: meta.name }) : fill(COPY.countdown, { n: m.phase.sleeps, name: meta.name });
    if (f.today) row.push(mini(f.today, COPY.stripToday));
    if (f.next) {
      const wait = m.view(f.next).wait;
      row.push(mini(f.next, wait === 1 ? COPY.stripTomorrow : fill(COPY.stripInN, { n: wait })));
    }
  } else if (m.phase.kind === 'far') {
    lead = m.phase.firstIn === 1 ? COPY.farTitleOne : fill(COPY.stripFirst, { n: m.phase.firstIn });
    if (f.next) row.push(mini(f.next, m.phase.firstIn === 1 ? COPY.stripTomorrow : fill(COPY.stripInN, { n: m.phase.firstIn })));
  } else if (m.phase.kind === 'beyond') {
    lead = COPY.beyond;
  } else {
    lead = COPY.stripAllOpen;
  }

  const all = h('a', { class: 'btn btn-sky dr-strip-all', href: playHash(meta.id, 'doors') }, COPY.stripOpenAll, icon('arrowRight', 20));
  all.addEventListener('click', (e) => { e.preventDefault(); toBoard(); });
  return h('div', { class: 'dr-strip sky', 'data-skin': m.skin, 'data-phase': m.phase.kind },
    h('div', { class: 'dr-strip-text' },
      h('p', { class: 'dr-strip-title' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, '🚪'), ' ', COPY.stripTitle),
      lead ? h('p', { class: 'dr-strip-lead' }, lead) : null,
      note,
      all),
    row.length > 0 ? h('div', { class: 'dr-strip-row' }, ...row) : null,
  );
}

export const doorsActivity: Activity = {
  id: 'doors',
  title: COPY.title,
  emoji: '🚪',
  blurb: COPY.blurb,
  available: (meta, content) => boardDoors(meta, content).length > 0,
  mount,
};
