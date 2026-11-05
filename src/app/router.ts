import { parseIso, type CivilDate } from '../dates/civil';
import { REGIONS, type Region } from '../dates/rules';
import { TAGS, type HolidayId, type Tag } from '../content/types';
import { announce as domAnnounce, focusHeading } from '../ui/dom';
import { VIEW_NAMES } from '../ui/copy';
import { ACTIVITY_IDS, type ActivityId } from '../play/types';

export type Section = 'story' | 'make' | 'craft' | 'facts' | 'say' | 'dates' | 'sticker';
export type ParadeSort = 'soon' | 'az' | 'month';

export type Route =
  | { readonly view: 'home' }
  | { readonly view: 'parade'; readonly tag?: Tag | 'mine'; readonly sort?: ParadeSort }
  | { readonly view: 'holiday'; readonly id: HolidayId; readonly section?: Section }
  | { readonly view: 'recipe'; readonly id: HolidayId; readonly recipeId: string }
  | { readonly view: 'year'; readonly year?: number }
  | { readonly view: 'stickers' }
  | { readonly view: 'grownups' }
  | { readonly view: 'world'; readonly id?: HolidayId }
  | { readonly view: 'play'; readonly id: HolidayId; readonly activity: ActivityId };

export interface QueryFlags {
  readonly today?: CivilDate;
  readonly region?: Region;
  readonly motion?: 'on' | 'off';
}

/*
 * ───────────────────────────────────────────────────────────── hash routes
 *
 *   #/                         home
 *   #/holidays?tag=x&sort=y    parade
 *   #/h/:id?s=section          holiday world
 *   #/h/:id/make/:recipeId     recipe step mode
 *   #/h/:id/play/:activity     an activity (doors, seek, colour, card, wish, memory, catch…) for that holiday
 *   #/year  #/year/:year       year view
 *   #/stickers  #/grownups
 *   #/world  #/world/:id       the globe (optionally focused on one holiday)
 *
 * Anything else is home. The global `?today= ?region= ?motion=` flags live in
 * `location.search`, before the hash, so they survive every navigation.
 */

export const SECTIONS: readonly Section[] = ['story', 'make', 'craft', 'facts', 'say', 'dates', 'sticker'];
export const PARADE_SORTS: readonly ParadeSort[] = ['soon', 'az', 'month'];
/** Years the lookup tables cover; `?today=` outside this window is ignored. */
export const YEAR_MIN = 2024;
export const YEAR_MAX = 2035;

const ID_RE = /^[A-Za-z0-9][\w-]*$/;
const HOME: Route = { view: 'home' };

function decode(part: string): string {
  try { return decodeURIComponent(part); } catch { return part; }
}

export function parseHash(hash: string): Route {
  let s = hash.startsWith('#') ? hash.slice(1) : hash;
  let query = '';
  const q = s.indexOf('?');
  if (q >= 0) { query = s.slice(q + 1); s = s.slice(0, q); }
  const parts = s.split('/').filter((p) => p.length > 0).map(decode);
  const params = new URLSearchParams(query);
  const [head, a, b, c] = parts;
  if (!head) return HOME;
  switch (head) {
    case 'holidays': {
      if (parts.length > 1) return HOME;
      const tag = params.get('tag');
      const sort = params.get('sort');
      return {
        view: 'parade',
        ...(tag && (tag === 'mine' || (TAGS as readonly string[]).includes(tag)) ? { tag: tag as Tag | 'mine' } : {}),
        ...(sort && (PARADE_SORTS as readonly string[]).includes(sort) ? { sort: sort as ParadeSort } : {}),
      };
    }
    case 'h': {
      if (!a || !ID_RE.test(a)) return HOME;
      if (parts.length === 2) {
        const s2 = params.get('s');
        return { view: 'holiday', id: a, ...(s2 && (SECTIONS as readonly string[]).includes(s2) ? { section: s2 as Section } : {}) };
      }
      if (parts.length === 4 && b === 'make' && c && ID_RE.test(c)) return { view: 'recipe', id: a, recipeId: c };
      if (parts.length === 4 && b === 'play' && c && (ACTIVITY_IDS as readonly string[]).includes(c)) return { view: 'play', id: a, activity: c as ActivityId };
      return HOME;
    }
    case 'year': {
      if (parts.length === 1) return { view: 'year' };
      if (parts.length === 2 && a && /^\d{4}$/.test(a)) return { view: 'year', year: Number(a) };
      return { view: 'year' };
    }
    case 'world': {
      // A junk id still lands on the globe: the view simply has nothing to focus on.
      if (parts.length === 2 && a && ID_RE.test(a)) return { view: 'world', id: a };
      return { view: 'world' };
    }
    case 'stickers': return parts.length === 1 ? { view: 'stickers' } : HOME;
    case 'grownups': return parts.length === 1 ? { view: 'grownups' } : HOME;
    default: return HOME;
  }
}

export function formatRoute(route: Route): string {
  switch (route.view) {
    case 'home': return '#/';
    case 'parade': {
      const params = new URLSearchParams();
      if (route.tag) params.set('tag', route.tag);
      if (route.sort) params.set('sort', route.sort);
      const qs = params.toString();
      return qs ? `#/holidays?${qs}` : '#/holidays';
    }
    case 'holiday': return `#/h/${encodeURIComponent(route.id)}${route.section ? `?s=${route.section}` : ''}`;
    case 'recipe': return `#/h/${encodeURIComponent(route.id)}/make/${encodeURIComponent(route.recipeId)}`;
    case 'year': return route.year === undefined ? '#/year' : `#/year/${route.year}`;
    case 'stickers': return '#/stickers';
    case 'grownups': return '#/grownups';
    case 'world': return route.id === undefined ? '#/world' : `#/world/${encodeURIComponent(route.id)}`;
    case 'play': return `#/h/${encodeURIComponent(route.id)}/play/${route.activity}`;
  }
}

/** `?today=YYYY-MM-DD` (real date within 2024–2035), `?region=`, `?motion=on|off`; invalid values are ignored. */
export function parseQuery(search: string): QueryFlags {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const flags: { today?: CivilDate; region?: Region; motion?: 'on' | 'off' } = {};
  const today = params.get('today');
  if (today) {
    const civil = parseIso(today.trim());
    if (civil && civil.y >= YEAR_MIN && civil.y <= YEAR_MAX) flags.today = civil;
  }
  const region = params.get('region')?.trim().toUpperCase();
  if (region && (REGIONS as readonly string[]).includes(region)) flags.region = region as Region;
  const motion = params.get('motion')?.trim().toLowerCase();
  if (motion === 'on' || motion === 'off') flags.motion = motion;
  return flags;
}

/*
 * ───────────────────────────────────────────────────────────── Router
 *
 * Wraps `hashchange`. Forward navigation scrolls to the top; browser Back is
 * detected by comparing the new hash with the previous stack entry and
 * restores the scroll position recorded for it. After every change the view's
 * h1 receives focus and the view name is announced politely.
 */

export interface RouterHost {
  getHash(): string;
  /** Sets the hash so a hashchange fires (pushes a history entry). */
  push(hash: string): void;
  /** Replaces the current entry without firing hashchange. */
  replace(hash: string): void;
  listen(cb: () => void): () => void;
  scrollY(): number;
  scrollTo(y: number): void;
  /** Focus the view's h1 and announce the view name. */
  settle(route: Route): void;
}

export interface NavInfo {
  readonly back: boolean;
  readonly initial: boolean;
}

export type RouteListener = (route: Route, nav: NavInfo) => void;

/**
 * The real browser host. `viewRoot` is where the h1 lives (the shell's #view);
 * `announcer` is the shell's polite live region, so the page has exactly one.
 */
export function browserHost(
  viewRoot: () => HTMLElement | null = () => document.getElementById('view'),
  announcer: (text: string) => void = domAnnounce,
): RouterHost {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  return {
    getHash: () => location.hash,
    push: (hash) => { location.hash = hash; },
    replace: (hash) => history.replaceState(history.state, '', hash),
    listen: (cb) => {
      window.addEventListener('hashchange', cb);
      return () => window.removeEventListener('hashchange', cb);
    },
    scrollY: () => window.scrollY,
    scrollTo: (y) => window.scrollTo({ top: y, left: 0 }),
    settle: (route) => {
      const root = viewRoot();
      if (root) focusHeading(root);
      announcer(VIEW_NAMES[route.view]);
    },
  };
}

export class Router {
  private readonly host: RouterHost;
  private readonly listeners = new Set<RouteListener>();
  private readonly scrollMap = new Map<string, number>();
  private readonly stack: string[] = [];
  private route: Route = HOME;
  private hash = '';
  private stop: (() => void) | null = null;

  constructor(host: RouterHost = browserHost()) {
    this.host = host;
  }

  get current(): Route {
    return this.route;
  }

  onChange(cb: RouteListener): () => void {
    this.listeners.add(cb);
    return () => { this.listeners.delete(cb); };
  }

  /** Reads the current hash, emits it as the initial route and starts listening. */
  start(): void {
    if (this.stop) return;
    this.hash = this.normalise(this.host.getHash());
    this.route = parseHash(this.hash);
    this.stack.push(this.hash);
    this.emit({ back: false, initial: true });
    this.stop = this.host.listen(() => this.handleChange());
  }

  destroy(): void {
    this.stop?.();
    this.stop = null;
  }

  navigate(route: Route, opts: { replace?: boolean } = {}): void {
    const hash = formatRoute(route);
    if (hash === this.hash) { this.host.scrollTo(0); return; }
    if (opts.replace) {
      this.host.replace(hash);
      this.scrollMap.set(this.hash, this.host.scrollY());
      this.stack[this.stack.length - 1] = hash;
      this.apply(hash, { back: false, initial: false });
      return;
    }
    this.host.push(hash); // hashchange → handleChange
  }

  private handleChange(): void {
    const next = this.normalise(this.host.getHash());
    if (next === this.hash) return;
    const prev = this.stack.length >= 2 ? this.stack[this.stack.length - 2] : undefined;
    const back = prev === next;
    this.scrollMap.set(this.hash, this.host.scrollY());
    if (back) this.stack.pop();
    else this.stack.push(next);
    this.apply(next, { back, initial: false });
  }

  private apply(hash: string, nav: NavInfo): void {
    this.hash = hash;
    this.route = parseHash(hash);
    this.emit(nav);
    this.host.scrollTo(nav.back ? this.scrollMap.get(hash) ?? 0 : 0);
    this.host.settle(this.route);
  }

  private emit(nav: NavInfo): void {
    for (const cb of this.listeners) cb(this.route, nav);
  }

  /** Unknown hashes are rewritten to `#/` so the address bar matches the view. */
  private normalise(hash: string): string {
    const route = parseHash(hash);
    if (route.view === 'home' && hash !== '#/' && hash !== '' && hash !== '#') {
      this.host.replace('#/');
      return '#/';
    }
    return hash === '' || hash === '#' ? '#/' : hash;
  }
}
