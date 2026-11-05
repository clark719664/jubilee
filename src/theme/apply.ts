/**
 * Applies a holiday theme to the app root as `--h-*` custom properties via the
 * CSSOM (`style.setProperty`, so no inline-style CSP exception is needed) and
 * keeps `<meta name="theme-color">` and the shell color scheme in step.
 *
 * `:root` already defines every `--h-*` token as the shell sky, so removing the
 * inline overrides (theme = null) fades the page back to the shell gradient.
 */
import type { Theme } from './themes';

export const THEME_VARS = [
  ['--h-bg1', 'bg1'], ['--h-bg2', 'bg2'], ['--h-ink', 'ink'], ['--h-accent', 'accent'],
  ['--h-accent-ink', 'accentInk'], ['--h-accent2', 'accent2'], ['--h-glow', 'glow'],
] as const satisfies readonly (readonly [string, keyof Theme])[];

/** Shell sky colors (mirrors `--sky-1` in styles.css) for the meta tag when no holiday theme is active. */
export const SHELL_SKY = { light: '#fff8ec', dark: '#1c1b4b' } as const;

export function applyTheme(el: HTMLElement, theme: Theme | null): void {
  if (theme) {
    for (const [prop, key] of THEME_VARS) el.style.setProperty(prop, theme[key]);
    el.setAttribute('data-pattern', theme.pattern);
    el.setAttribute('data-mood', theme.mood);
    el.setAttribute('data-theme-id', theme.id);
  } else {
    for (const [prop] of THEME_VARS) el.style.removeProperty(prop);
    el.removeAttribute('data-pattern');
    el.removeAttribute('data-mood');
    el.removeAttribute('data-theme-id');
  }
}

export function setMetaThemeColor(hex: string): void {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = hex;
}

/** Grown-ups override of the OS color scheme: `data-theme` on <html>; undefined follows the OS. */
export function applyScheme(scheme: 'light' | 'dark' | undefined): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  if (scheme) html.setAttribute('data-theme', scheme);
  else html.removeAttribute('data-theme');
}

/** The scheme actually in effect: override, else the OS preference. */
export function effectiveScheme(prefersDark: boolean): 'light' | 'dark' {
  if (typeof document !== 'undefined') {
    const forced = document.documentElement.getAttribute('data-theme');
    if (forced === 'light' || forced === 'dark') return forced;
  }
  return prefersDark ? 'dark' : 'light';
}
