/**
 * view.ts — the "Where in the World?" screen: a start card (this holiday's questions or the
 * Everything mix), five questions, and a "What a trip!" card with passport stamps of the places
 * visited. Nothing is scored: a wrong tap turns the globe to the right place and lights it up, and
 * the progress stars fill the same way whatever was picked.
 *
 * Layout: phone stacks the question, the globe and a bottom bar, with the answer card sliding up
 * over the bottom of the globe; from 900 px wide the question and answer sit in a column beside it.
 */
import { loadContent } from '../../content/loader';
import type { HolidayContent, HolidayMeta } from '../../content/types';
import { mulberry32 } from '../../effects/rng';
import { plural } from '../../i18n/index';
import { applyTheme } from '../../theme/apply';
import { THEMES } from '../../theme/themes';
import { h, trapFocus } from '../../ui/dom';
import { icon } from '../../ui/icons';
import { mascot } from '../../ui/mascot';
import { globePalette } from '../../world/palette';
import { formatClock } from '../../world/zones';
import type { ActivityInstance, PlayEnv } from '../types';
import { factCard, greetCard } from './cards';
import { COPY, fill } from './copy';
import { listPanel, shapeIcon, type ListPanel } from './list';
import { countryLabel } from './places';
import {
  EVERYTHING, ROUND_LENGTH, answerLine, buildRound, hasHolidayRound, isRight, mixHolidays, shuffle,
  type FactQuestion, type GreetQuestion, type Question, type Scope,
} from './questions';
import { sparkle } from './sparkle';
import { QuizStage } from './stage';

/** Keys from the last few rounds this session, so the next round reaches for fresh questions. */
const recent: string[] = [];
const RECENT_MAX = 24;
let rounds = 0;

export function mountQuiz(env: PlayEnv): ActivityInstance {
  const { ctx, meta, theme } = env;
  const metas = ctx.metas;
  const byId = new Map(metas.map((m) => [m.id, m] as const));
  const contents = new Map<string, HolidayContent>([[meta.id, env.content]]);
  const ownRound = hasHolidayRound(meta);
  let scope: Scope = ownRound ? meta.id : EVERYTHING;
  let round: Question[] = [];
  let index = 0;
  let answered = false;
  let stamps: string[] = [];
  let list: ListPanel | null = null;
  let untrapDone: (() => void) | null = null;
  let disposed = false;
  const cleanups: (() => void)[] = [];

  // ── content for the Everything mix: a few holidays' facts and greetings, fetched from the local
  //    build in the background as soon as the quiz opens (never from the network).
  const preload = shuffle(mixHolidays(metas).filter((m) => m.id !== meta.id), mulberry32((Date.now() >>> 0) ^ 0x5bd1e995)).slice(0, 4);
  const ready = Promise.allSettled(preload.map((m) => loadContent(m.id).then((c) => { contents.set(m.id, c); })));

  // ── chrome
  const title = h('h1', { class: 'quiz-h1', id: 'quiz-h1' }, COPY.title);
  const sub = h('p', { class: 'quiz-sub' });
  const dots = h('ol', { class: 'quiz-dots', 'aria-hidden': 'true' }, ...Array.from({ length: ROUND_LENGTH }, () => h('li', { class: 'quiz-dot' })));
  const progress = h('div', { class: 'quiz-progress', hidden: true }, dots, h('span', { class: 'sr-only quiz-progress-text' }));
  const header = h('header', { class: 'quiz-head' },
    h('button', { type: 'button', class: 'btn btn-secondary btn-icon quiz-close', 'aria-label': fill(COPY.close, { holiday: meta.name }), onclick: () => env.close() }, icon('close', 22)),
    h('div', { class: 'quiz-titles' }, title, sub),
    progress);
  const body = h('div', { class: 'quiz-body' });
  const root = h('section', { class: 'quiz sky', 'aria-labeledby': 'quiz-h1', 'data-mood': theme.mood }, header, body);
  applyTheme(root, theme);

  // ── play area (built once; the stage keeps its Globe for the whole visit)
  const chip = h('span', { class: 'quiz-chip' });
  const prompt = h('h2', { class: 'quiz-prompt', id: 'quiz-prompt', tabindex: -1 });
  const ask = h('div', { class: 'quiz-ask' }, chip, prompt);
  const answerLineEl = h('p', { class: 'quiz-answer-line' });
  const answerReveal = h('p', { class: 'quiz-answer-reveal' });
  const nextBtn = h('button', { type: 'button', class: 'btn btn-lg quiz-next', onclick: () => next() }, COPY.next, icon('arrowRight', 22));
  const answer = h('div', { class: 'quiz-answer', role: 'status', hidden: true },
    h('div', { class: 'quiz-answer-body' }, answerLineEl, answerReveal), nextBtn);
  const listBtn = h('button', { type: 'button', class: 'btn btn-secondary quiz-list-btn', onclick: () => openList() },
    icon('all', 22), COPY.list);
  const bar = h('div', { class: 'quiz-bar' }, listBtn);
  const panel = h('div', { class: 'quiz-panel' }, ask, answer, bar);
  const stage = new QuizStage({
    motion: ctx.motion,
    onPick: (iso, at) => onPick(iso, at),
    onMiss: (where) => onMiss(where),
    onMiddle: (text) => ctx.announce(text),
  });
  const cardHost = h('div', { class: 'quiz-cards', hidden: true });
  const stageWrap = h('div', { class: 'quiz-stage' }, stage.el, cardHost);
  const play = h('div', { class: 'quiz-play' }, panel, stageWrap);

  const offMotion = ctx.onMotionChange((m) => { stage.setMotion(m); root.classList.toggle('quiz-calm', m !== 'full'); });
  root.classList.toggle('quiz-calm', ctx.motion !== 'full');

  // ───────────────────────────────────────────── screens

  function showStart(focus: boolean): void {
    closeDone();
    stage.stop();
    progress.hidden = true;
    sub.textContent = COPY.pick;
    const options: HTMLElement[] = [];
    if (ownRound) {
      options.push(h('button', { type: 'button', class: 'quiz-scope', onclick: () => begin(meta.id) },
        h('span', { class: 'quiz-scope-art' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, meta.emoji)),
        h('span', { class: 'quiz-scope-text' },
          h('span', { class: 'quiz-scope-name' }, fill(COPY.scopeHoliday, { holiday: meta.name })),
          h('span', { class: 'quiz-scope-sub' }, fill(COPY.scopeHolidaySub, { holiday: meta.name })))));
    }
    options.push(h('button', { type: 'button', class: 'quiz-scope quiz-scope-all', onclick: () => begin(EVERYTHING) },
      h('span', { class: 'quiz-scope-art' }, h('span', { class: 'emoji', 'aria-hidden': 'true' }, '🌍')),
      h('span', { class: 'quiz-scope-text' },
        h('span', { class: 'quiz-scope-name' }, COPY.scopeAll),
        h('span', { class: 'quiz-scope-sub' }, COPY.scopeAllSub))));
    const start = h('div', { class: 'quiz-start' },
      h('div', { class: 'quiz-start-jubi' }, mascot('excited', 110)),
      h('div', { class: 'quiz-scopes' }, ...options));
    body.replaceChildren(start);
    if (focus) options[0]?.focus({ preventScroll: true });
  }

  async function begin(s: Scope): Promise<void> {
    scope = s;
    if (s === EVERYTHING) {
      sub.textContent = COPY.loading;
      await ready;
      if (disposed) return;
    }
    const seed = (Date.now() ^ Math.imul(++rounds, 0x9e3779b1)) >>> 0;
    round = buildRound({ scope: s, metas, contents, now: ctx.clock.now(), rand: mulberry32(seed), avoid: new Set(recent) });
    for (const q of round) recent.push(q.key);
    recent.splice(0, Math.max(0, recent.length - RECENT_MAX));
    index = 0;
    stamps = [];
    sub.textContent = s === EVERYTHING ? COPY.scopeAll : fill(COPY.scopeHoliday, { holiday: meta.name });
    progress.hidden = false;
    body.replaceChildren(play);
    stage.start();
    showQuestion();
  }

  function holidayOf(id: string): HolidayMeta | undefined {
    return id ? byId.get(id) : undefined;
  }

  function showQuestion(): void {
    const q = round[index];
    if (!q) { finish(); return; }
    answered = false;
    closeList();
    answer.hidden = true;
    play.classList.remove('is-answered');
    updateDots();
    const hm = holidayOf(q.holiday);
    chip.replaceChildren(
      h('span', { class: 'emoji', 'aria-hidden': 'true' }, q.kind === 'map' && q.view === 'map' ? (q.place === 'new-year' ? '🎆' : '🌙') : hm?.emoji ?? '🌍'),
      q.kind === 'map' && q.view === 'map' ? (q.place === 'new-year' ? 'New Year' : 'Day and night') : hm?.name ?? 'Around the world');
    stageWrap.classList.toggle('is-cards', q.kind !== 'map');
    if (q.kind === 'map') {
      prompt.textContent = q.prompt;
      cardHost.hidden = true;
      stage.el.hidden = false;
      bar.hidden = false;
      const palette = globePalette(hm ? THEMES[hm.theme] : theme);
      stage.ask(q, palette);
    } else {
      stage.el.hidden = true;
      bar.hidden = true;
      cardHost.hidden = false;
      prompt.textContent = q.kind === 'fact' ? COPY.factAsk : COPY.greetAsk;
      showCard(q);
    }
    ctx.announce(fill(COPY.sayQuestion, { n: index + 1, total: round.length, prompt: q.kind === 'map' ? q.prompt : prompt.textContent ?? '' }));
    // Keyboard players land on the globe, so the arrow keys work straight away.
    if (q.kind === 'map') stage.focus();
  }

  function showCard(q: FactQuestion | GreetQuestion): void {
    if (q.kind === 'fact') {
      const hm = holidayOf(q.holiday);
      const card = factCard(q, q.truth && hm ? { name: hm.name, emoji: hm.emoji } : null, ({ saidTrue }) => {
        const verdict = q.truth ? (saidTrue ? COPY.factTrueYes : COPY.factTrueNo) : (saidTrue ? COPY.factSillyNo : COPY.factSillyYes);
        if (q.truth) {
          ctx.store.bumpFacts();
          ctx.checkBadges();
        }
        if (saidTrue === q.truth) burstOn(card.el.querySelector('.quiz-fact-card'));
        // A joke's real answer is already on the back of the flipped card: say it, don't print it twice.
        if (q.truth) reveal(verdict, fill(COPY.factFrom, { holiday: hm?.name ?? '' }));
        else reveal(verdict, '', q.back);
      });
      cardHost.replaceChildren(card.el);
      card.first.focus({ preventScroll: true });
    } else {
      const hm = holidayOf(q.holiday);
      const card = greetCard(q, (id, button) => {
        const right = id === q.holiday;
        const name = hm?.name ?? '';
        if (right) burstOn(button);
        else burstOn(card.el.querySelector('.quiz-option.is-right'));
        reveal(right ? fill(COPY.greetYes, { cheer: cheer(), holiday: name }) : fill(COPY.greetShow, { holiday: name }),
          meansLine(q.greeting.meaning));
      });
      cardHost.replaceChildren(card.el);
      card.first.focus({ preventScroll: true });
    }
  }

  /** "It means “Joyful Christmas”." Bracketed asides (literal translations) are left for older readers. */
  function meansLine(meaning: string): string {
    const plain = meaning.replace(/\s*\([^)]*\)/g, '').trim();
    return fill(COPY.greetMeans, { meaning: plain || meaning }).replace(/([.!?])”\.$/, '$1”');
  }

  function burstOn(el: Element | null): void {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const o = root.getBoundingClientRect();
    cleanups.push(sparkle(root, r.left - o.left + r.width / 2, r.top - o.top + r.height / 2, [theme.glow, '#ffffff', theme.accent2], ctx.motion));
  }

  function cheer(): string {
    return COPY.cheers[(index + rounds) % COPY.cheers.length]!;
  }

  function onPick(iso: string, at: { x: number; y: number } | null): void {
    const q = round[index];
    if (!q || q.kind !== 'map' || answered) return;
    if (q.view === 'map' && !q.pins.some((p) => p.iso === iso)) {
      const [a, b] = q.pins;
      const text = fill(COPY.pinsOnly, { a: a?.label ?? '', b: b?.label ?? '' });
      stage.say(text);
      ctx.announce(text);
      return;
    }
    answered = true;
    closeList();
    const hm = holidayOf(q.holiday);
    const emoji = hm?.emoji ?? (q.place === 'new-year' ? '🎆' : '🌙');
    const right = isRight(q, iso);
    const now = ctx.clock.now();
    if (right) {
      stage.showRight(iso, emoji, at, q.place === 'doing' && !q.any ? q.answers : [iso]);
      if (q.place === 'night') stage.showNight(now);
    } else {
      stage.showAnswer(q, iso, emoji, now);
    }
    stamps.push(right ? iso : q.primary);
    let revealText = q.reveal;
    if (q.place === 'night') {
      const nightPin = q.pins.find((p) => p.iso === q.primary);
      const dayPin = q.pins.find((p) => p.iso !== q.primary);
      revealText = fill(revealText, {
        nightTime: nightPin ? formatClock(nightPin.tz, now, ctx.locale) : '',
        dayTime: dayPin ? formatClock(dayPin.tz, now, ctx.locale) : '',
      });
    }
    reveal(answerLine(q, iso, cheer()), revealText);
  }

  /** The child tapped the sea or empty space; on the flat map only the two pins count. */
  function onMiss(where: 'sea' | 'space'): void {
    const q = round[index];
    if (answered || !q || q.kind !== 'map') return;
    let text: string = COPY.sea;
    if (q.view === 'map') {
      const [a, b] = q.pins;
      text = fill(COPY.pinsOnly, { a: a?.label ?? '', b: b?.label ?? '' });
    } else if (where !== 'sea') return;
    stage.say(text);
    ctx.announce(text);
  }

  function reveal(line: string, more: string, sayAlso = more): void {
    answered = true;
    answerLineEl.textContent = line;
    answerReveal.textContent = more;
    answerReveal.hidden = more === '';
    nextBtn.replaceChildren(index + 1 >= round.length ? COPY.finish : COPY.next, icon('arrowRight', 22));
    answer.hidden = false;
    play.classList.add('is-answered');
    updateDots(true);
    ctx.announce(sayAlso ? `${line} ${sayAlso}` : line);
    // Let the sparkle and the spin start before moving focus to Next (no scroll jump on phones).
    window.setTimeout(() => { if (!disposed && !answer.hidden) nextBtn.focus({ preventScroll: true }); }, 60);
  }

  function next(): void {
    if (!answered) return;
    index++;
    showQuestion();
  }

  function updateDots(done = false): void {
    Array.from(dots.children).forEach((d, i) => {
      d.classList.toggle('is-done', i < index || (done && i === index));
      d.classList.toggle('is-now', i === index && !done);
    });
    const text = progress.querySelector('.quiz-progress-text');
    if (text) text.textContent = fill(COPY.progress, { n: Math.min(index + 1, round.length), total: round.length });
  }

  // ───────────────────────────────────────────── list fallback

  function openList(): void {
    const q = round[index];
    if (!q || q.kind !== 'map' || answered || list) return;
    list = listPanel(q.choices, (iso) => {
      closeList();
      stage.focusCountry(iso);
      onPick(iso, null);
    }, () => { closeList(); listBtn.focus({ preventScroll: true }); });
    stageWrap.append(list.el);
  }

  function closeList(): void {
    list?.destroy();
    list = null;
  }

  // ───────────────────────────────────────────── the end

  let donePanel: HTMLElement | null = null;

  function finish(): void {
    stage.stop();
    updateDots(true);
    const name = ctx.store.progress.name;
    const places = stamps.filter((iso, i, a) => a.indexOf(iso) === i);
    const subText = places.length === 0 ? COPY.doneSub0 : plural(places.length, { one: 'You visited {n} place around the world.', other: 'You visited {n} places around the world.' });
    const again = h('button', { type: 'button', class: 'btn btn-lg quiz-again', onclick: () => { closeDone(); void begin(scope); } }, icon('shuffle', 22), COPY.again);
    const switchTo: Scope | null = scope === EVERYTHING ? (ownRound ? meta.id : null) : EVERYTHING;
    const panelEl = h('div', { class: 'quiz-done', role: 'dialog', 'aria-modal': 'true', 'aria-labeledby': 'quiz-done-title' },
      h('div', { class: 'quiz-done-card' },
        h('div', { class: 'quiz-done-jubi' }, mascot('party', 104)),
        h('h2', { class: 'quiz-done-title', id: 'quiz-done-title' }, name ? fill(COPY.doneName, { name }) : COPY.doneTitle),
        h('p', { class: 'quiz-done-sub' }, subText),
        places.length > 0 ? h('p', { class: 'quiz-stamps-title' }, COPY.stamps) : null,
        places.length > 0 ? h('ul', { class: 'quiz-stamps' }, ...places.map((iso, k) => h('li', { class: 'quiz-stamp', style: `--k:${k}` },
          shapeIcon(iso, 52, 'quiz-stamp-shape'), h('span', { class: 'quiz-stamp-name' }, countryLabel(iso))))) : null,
        h('div', { class: 'quiz-done-actions' },
          again,
          switchTo ? h('button', { type: 'button', class: 'btn btn-secondary', onclick: () => { closeDone(); void begin(switchTo); } },
            switchTo === EVERYTHING ? `🌍 ${COPY.scopeAll}` : `${meta.emoji} ${fill(COPY.scopeHoliday, { holiday: meta.name })}`) : null,
          h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => env.close() }, icon('arrowLeft', 20), fill(COPY.close, { holiday: meta.name })))));
    donePanel = panelEl;
    root.append(panelEl);
    untrapDone = trapFocus(panelEl);
    again.focus({ preventScroll: true });
    if (ctx.motion === 'full') burstOn(panelEl.querySelector('.quiz-done-jubi'));
    ctx.announce(`${name ? fill(COPY.doneName, { name }) : COPY.doneTitle} ${subText}`);
  }

  function closeDone(): void {
    untrapDone?.();
    untrapDone = null;
    donePanel?.remove();
    donePanel = null;
  }

  // ───────────────────────────────────────────── keys

  const onRootKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    e.preventDefault();
    if (list) { closeList(); listBtn.focus({ preventScroll: true }); return; }
    env.close();
  };
  root.addEventListener('keydown', onRootKey);

  showStart(false);

  return {
    el: root,
    destroy() {
      disposed = true;
      offMotion();
      closeList();
      closeDone();
      for (const c of cleanups) c();
      root.removeEventListener('keydown', onRootKey);
      stage.destroy();
    },
  };
}
