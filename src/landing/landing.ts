/**
 * The page parents land on. It works as plain HTML; this adds the live countdown over the next
 * holiday's real scene, the holiday wall and the install help.
 */
import { currentLang, initLang, LANGUAGES, setLang } from '../i18n/index';
import './landing.css';
import { detectRegion } from '../app/settings';
import { sceneFor, stickerUrl } from '../art/index';
import { HOLIDAYS } from '../content/registry';
import { todayLocal } from '../dates/civil';
import { sleeps } from '../dates/countdown';
import { nextUp } from '../dates/occurrences';
import { registerOffline } from '../sw/template';
import { THEMES } from '../theme/themes';
import { h } from '../ui/dom';
import { countWords, inAppBrowser, platformOf } from './install';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>;
}

const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

function showNextHoliday(): void {
  const today = todayLocal(new Date());
  const up = nextUp(HOLIDAYS, [], today, detectRegion(navigator.language), false)
    .find((u) => sceneFor(u.occ.holidayId) !== null);
  const meta = up && HOLIDAYS.find((m) => m.id === up.occ.holidayId);
  if (!up || !meta) return;
  const theme = THEMES[meta.theme];
  const hero = byId('hero');
  hero.style.setProperty('--bg1', theme.bg1);
  hero.style.setProperty('--bg2', theme.bg2);
  hero.style.setProperty('--hero-ink', theme.ink);
  for (const layer of sceneFor(meta.id) ?? []) byId('hero-art').append(h('img', { src: layer.url, alt: '', decoding: 'async' }));
  const words = countWords(sleeps(up.occ.main, today), meta.name);
  const count = byId('count');
  count.append(h('b', {}, words.big), h('span', {}, words.small));
  count.hidden = false;
}

function showHolidays(): void {
  const list = byId('stickers');
  const withArt = [...HOLIDAYS].sort((a, b) => Number(stickerUrl(a.id) === null) - Number(stickerUrl(b.id) === null));
  for (const meta of withArt) {
    const url = stickerUrl(meta.id);
    const art = url
      ? h('img', { src: url, alt: '', loading: 'lazy', decoding: 'async', width: 88, height: 88 })
      : h('span', { class: 'emo', 'aria-hidden': 'true' }, meta.emoji);
    list.append(h('li', {}, art, h('span', {}, meta.name)));
  }
  const more = byId('more');
  more.hidden = false;
  more.addEventListener('click', () => {
    list.classList.add('is-all');
    more.hidden = true;
  });
}

function setUpInstall(): void {
  const ua = navigator.userAgent;
  const platform = platformOf(ua, navigator.maxTouchPoints);
  document.querySelector(`[data-platform="${platform}"]`)?.classList.add('is-yours');

  if (inAppBrowser(ua)) {
    byId('fb-note').hidden = false;
    const copy = byId<HTMLButtonElement>('copy');
    copy.addEventListener('click', () => {
      void navigator.clipboard?.writeText(location.href.split('#')[0] ?? location.href).then(() => { copy.textContent = 'Link copied'; });
    });
  }

  const button = byId<HTMLButtonElement>('install-now');
  const installed = byId('installed');
  let prompt: InstallPrompt | null = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    prompt = e as InstallPrompt;
    button.hidden = false;
  });
  button.addEventListener('click', () => {
    if (!prompt) return;
    void prompt.prompt();
    void prompt.userChoice.then(() => {
      prompt = null;
      button.hidden = true;
    });
  });
  window.addEventListener('appinstalled', () => {
    button.hidden = true;
    installed.hidden = false;
  });
}

// Links from before the app moved to app/ still reach the page they meant.
if (location.hash.startsWith('#/')) location.replace(`app/${location.hash}`);

function setUpLanguage(): void {
  const select = byId<HTMLSelectElement>('language');
  select.append(...LANGUAGES.map((l) => h('option', { value: l.code }, l.name)));
  select.value = currentLang();
  select.addEventListener('change', () => setLang(select.value));
}

showNextHoliday();
showHolidays();
setUpInstall();
setUpLanguage();
void initLang();
registerOffline(import.meta.env.PROD);
