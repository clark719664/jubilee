import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { colorPages } from '../src/art/index';
import { HOLIDAYS } from '../src/content/registry';
import { crayonBox, crayonDrawers, paintFor } from '../src/play/color/crayons';
import { cleanFills } from '../src/play/color/store';
import { THEMES } from '../src/theme/themes';
import { countWords, inAppBrowser, platformOf } from '../src/landing/install';
import { spanFill } from '../src/ui/year';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-A366B) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36';

describe('install help', () => {
  it('picks the right instructions', () => {
    expect(platformOf(IPHONE)).toBe('ios');
    expect(platformOf(IPAD, 5)).toBe('ios');
    expect(platformOf(IPAD, 0)).toBe('desktop');
    expect(platformOf(ANDROID)).toBe('android');
  });
  it('spots the Facebook browser, which cannot install', () => {
    expect(inAppBrowser(`${ANDROID} [FB_IAB/FB4A;FBAV/480.0]`)).toBe(true);
    expect(inAppBrowser(`${IPHONE} [FBAN/FBIOS;FBAV/480.0]`)).toBe(true);
    expect(inAppBrowser(ANDROID)).toBe(false);
  });
});

describe('landing page words', () => {
  it('reads properly on every day', () => {
    expect(countWords(3, 'Diwali')).toEqual({ big: '3', small: 'sleeps until Diwali' });
    expect(countWords(1, 'Diwali')).toEqual({ big: '1', small: 'sleep until Diwali' });
    expect(countWords(0, 'Diwali')).toEqual({ big: 'Today', small: 'is Diwali!' });
  });
  it('states the real number of holidays', () => {
    const html = readFileSync('index.html', 'utf8');
    expect(html).toContain(`counts down to ${HOLIDAYS.length} celebrations`);
    expect(html).toContain(`Show all ${HOLIDAYS.length} holidays`);
  });
});

describe('web app manifest', () => {
  const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as {
    start_url: string; scope: string; display: string; icons: { src: string; sizes: string; purpose?: string }[];
  };
  it('opens the app full screen', () => {
    expect(manifest.start_url).toBe('app/');
    expect(manifest.scope).toBe('app/');
    expect(manifest.display).toBe('standalone');
  });
  it('has every icon an installer asks for, and they exist', () => {
    expect(manifest.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) expect(existsSync(`public/${icon.src}`), icon.src).toBe(true);
  });
});

describe('calendar fill for several-day holidays', () => {
  it('tints one holiday and splits overlaps instead of drawing lines', () => {
    expect(spanFill(['#123456'])).toBe('color-mix(in oklch, #123456 30%, var(--card))');
    const two = spanFill(['#111111', '#222222']);
    expect(two).toMatch(/^linear-gradient\(135deg/);
    expect(two).toContain('0% 50%');
    expect(two).toContain('50% 100%');
  });
});

describe('coloring pages for every holiday', () => {
  it('gives every holiday pages, and popular holidays the most', () => {
    for (const m of HOLIDAYS) expect(colorPages(m.id).length, m.id).toBeGreaterThanOrEqual(2);
    const count = (id: string): number => colorPages(id).length;
    expect(count('christmas')).toBeGreaterThanOrEqual(10);
    expect(count('christmas')).toBeGreaterThan(count('earth-day'));
    expect(count('earth-day')).toBeGreaterThanOrEqual(count('leap-day'));
  });
  it('keeps more crayons than a phone can show in sorted drawers', () => {
    const box = crayonBox(THEMES.christmas, 'Christmas');
    expect(box.length).toBeGreaterThanOrEqual(130);
    expect(new Set(box.map((c) => c.id)).size).toBe(box.length);
    const drawers = crayonDrawers(box);
    expect(drawers.flatMap((d) => d.crayons).length).toBe(box.length);
    expect(paintFor('g-gold', box, 'p')).toBe('url(#p-g-gold)');
    expect(cleanFills({ a: 'g-rosegold', b: 'x-cottoncandyswirl', c: 'nope' })).toEqual({ a: 'g-rosegold', b: 'x-cottoncandyswirl' });
  });
});
