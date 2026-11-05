export type ThemeId =
  | 'christmas' | 'hanukkah' | 'diwali' | 'eid' | 'lunar' | 'halloween' | 'harvest' | 'easter' | 'holi' | 'muertos'
  | 'kwanzaa' | 'juneteenth' | 'nowruz' | 'midautumn' | 'stpatricks' | 'valentine' | 'mothers' | 'fathers' | 'usa'
  | 'canada' | 'france' | 'earth' | 'pi' | 'newyear' | 'passover' | 'roshhashanah' | 'purim' | 'ramadan' | 'dawn'
  | 'mlk' | 'snowday' | 'carnival' | 'splash' | 'koinobori' | 'river' | 'summer' | 'bonfire' | 'threekings' | 'leap'
  | 'silly' | 'birthday';

export type Pattern = 'none' | 'dots' | 'stars' | 'stars8' | 'stripes' | 'kente' | 'chalk' | 'waves' | 'rangoli';

export interface Theme {
  readonly id: ThemeId;
  readonly mood: 'day' | 'night';
  /** Sky gradient stops. */
  readonly bg1: string;
  readonly bg2: string;
  /** Text on the sky (≥ 4.5:1 vs bg1 AND bg2). */
  readonly ink: string;
  /** Pills/buttons on the sky (accent ≥ 3:1 vs bg1/bg2; accentInk ≥ 4.5:1 vs accent). */
  readonly accent: string;
  readonly accentInk: string;
  /** Effect colours. */
  readonly accent2: string;
  readonly glow: string;
  readonly pattern: Pattern;
}

function t(id: ThemeId, bg1: string, bg2: string, ink: string, accent: string, accentInk: string, accent2: string, glow: string, pattern: Pattern, mood: 'day' | 'night'): Theme {
  return { id, mood, bg1, bg2, ink, accent, accentInk, accent2, glow, pattern };
}

export const THEMES: Record<ThemeId, Theme> = {
  christmas: t('christmas', '#0f3d2e', '#1b5e45', '#ffffff', '#ffd166', '#1f1a0a', '#ff4d5e', '#ffd166', 'stars', 'night'),
  hanukkah: t('hanukkah', '#0b2a6f', '#1e3fa8', '#ffffff', '#ffd166', '#1f1a0a', '#cfd8ff', '#ffe9a3', 'stars', 'night'),
  diwali: t('diwali', '#4a0f5c', '#8c1d5e', '#ffffff', '#ffb703', '#2a1a00', '#ff4d9d', '#ffb703', 'rangoli', 'night'),
  eid: t('eid', '#0e5b55', '#156b62', '#ffffff', '#ffd166', '#1f1a0a', '#9be7d3', '#ffd166', 'stars8', 'night'),
  lunar: t('lunar', '#8f0f17', '#c8102e', '#ffffff', '#ffd166', '#3a0a0a', '#ffe9a3', '#ffd166', 'dots', 'night'),
  halloween: t('halloween', '#1a0b2e', '#3b1a5a', '#ffffff', '#ff8c1a', '#1a0b2e', '#a8ff5e', '#ff8c1a', 'none', 'night'),
  harvest: t('harvest', '#7a3e13', '#a84f1a', '#fff4e6', '#ffd166', '#3a2005', '#c8102e', '#ffb703', 'none', 'night'),
  easter: t('easter', '#dff7ec', '#e9ddff', '#2b1a4d', '#6b3fd9', '#ffffff', '#ff8fb8', '#ffffff', 'dots', 'day'),
  holi: t('holi', '#fffdf7', '#fff1e0', '#2a1a3a', '#d61a8c', '#ffffff', '#00a3c4', '#ffb703', 'none', 'day'),
  muertos: t('muertos', '#2d0b3a', '#5a1a4a', '#ffffff', '#ff9f1c', '#2a1a00', '#00b4d8', '#ff9f1c', 'dots', 'night'),
  kwanzaa: t('kwanzaa', '#111111', '#2a1a0a', '#ffffff', '#2a9d8f', '#04221f', '#d62828', '#ffd166', 'kente', 'night'),
  juneteenth: t('juneteenth', '#0b1e4a', '#5c1a2b', '#ffffff', '#ffd166', '#1f1a0a', '#ff4d5e', '#ffffff', 'stars', 'night'),
  nowruz: t('nowruz', '#e3f7e8', '#cdeef2', '#0f3b2e', '#d65a12', '#1a0a02', '#2a9d8f', '#ffd166', 'none', 'day'),
  midautumn: t('midautumn', '#0a1f44', '#142a5e', '#fff4c2', '#ffd166', '#1f1a0a', '#ff8fb8', '#fff4c2', 'stars', 'night'),
  stpatricks: t('stpatricks', '#0b6e4f', '#0d7a53', '#ffffff', '#ffd166', '#1f1a0a', '#9be7d3', '#ffd166', 'none', 'night'),
  valentine: t('valentine', '#ffd6e0', '#ffb3c6', '#4a0d22', '#c2185b', '#ffffff', '#ffffff', '#ff4d9d', 'dots', 'day'),
  mothers: t('mothers', '#ffe3d6', '#ffd0c2', '#4a1f12', '#c8442e', '#ffffff', '#ffb703', '#ff8fb8', 'none', 'day'),
  fathers: t('fathers', '#cfe8ff', '#a9d3ff', '#0f2a4a', '#1f5fbf', '#ffffff', '#ffffff', '#ffd166', 'none', 'day'),
  usa: t('usa', '#0b1e4a', '#1f3b8a', '#ffffff', '#ff4d5e', '#1a0a0c', '#ffffff', '#ffd166', 'stars', 'night'),
  canada: t('canada', '#b3121b', '#d62828', '#ffffff', '#ffffff', '#b3121b', '#ffd166', '#ffffff', 'none', 'night'),
  france: t('france', '#0b1e4a', '#26408b', '#ffffff', '#ffffff', '#0b1e4a', '#e63946', '#ffd166', 'none', 'night'),
  earth: t('earth', '#006399', '#1f7a4f', '#ffffff', '#ffd166', '#1f1a0a', '#9be7d3', '#ffffff', 'none', 'night'),
  pi: t('pi', '#1e3a3a', '#244a46', '#f2f2e9', '#ffd166', '#1f1a0a', '#9be7d3', '#f2f2e9', 'chalk', 'night'),
  newyear: t('newyear', '#0a0a12', '#1b1b2f', '#ffffff', '#ffd166', '#1f1a0a', '#ff8fb8', '#ffd166', 'stars', 'night'),
  passover: t('passover', '#e8f5e1', '#cfe9c4', '#1f3d1f', '#2a7f4f', '#ffffff', '#c8442e', '#ffd166', 'none', 'day'),
  roshhashanah: t('roshhashanah', '#8b1a1a', '#9c4f14', '#ffffff', '#ffd166', '#1f1a0a', '#ffe9a3', '#ffd166', 'none', 'night'),
  purim: t('purim', '#4a2bd6', '#6a4cf0', '#ffffff', '#ffd166', '#1f1a0a', '#ff8fb8', '#ffd166', 'dots', 'night'),
  ramadan: t('ramadan', '#06283d', '#0e4a5e', '#ffffff', '#ffd166', '#1f1a0a', '#9be7d3', '#ffd166', 'stars8', 'night'),
  dawn: t('dawn', '#f6d5c2', '#e6c3d9', '#3a1a2a', '#8b1a2b', '#ffffff', '#ffb703', '#ffffff', 'none', 'day'),
  mlk: t('mlk', '#2b2b3a', '#3d3d55', '#ffffff', '#ffd166', '#1f1a0a', '#ff8fb8', '#ffffff', 'none', 'night'),
  snowday: t('snowday', '#e9f1f7', '#d5e3ee', '#1f2a3a', '#6b4a2b', '#ffffff', '#1f5fbf', '#ffffff', 'none', 'day'),
  carnival: t('carnival', '#4a1a6b', '#6b2a8b', '#ffffff', '#ffd166', '#1f1a0a', '#2a9d8f', '#ff8fb8', 'dots', 'night'),
  splash: t('splash', '#d6f5ff', '#b8ecff', '#0a3a4a', '#0077b6', '#ffffff', '#ffb703', '#ffffff', 'waves', 'day'),
  koinobori: t('koinobori', '#bde0fe', '#e0f0ff', '#1a2a4a', '#c81d3c', '#ffffff', '#1f5fbf', '#ffffff', 'none', 'day'),
  river: t('river', '#0a4a6b', '#0e6b8a', '#ffffff', '#ffd166', '#1f1a0a', '#9be7d3', '#ffffff', 'waves', 'night'),
  summer: t('summer', '#ffe8a3', '#ffd166', '#3a2a05', '#b5231f', '#ffffff', '#2a9d8f', '#ffffff', 'none', 'day'),
  bonfire: t('bonfire', '#1a0b2e', '#3b1a0a', '#ffffff', '#ff7a00', '#1a0b2e', '#ffd166', '#ff7a00', 'none', 'night'),
  threekings: t('threekings', '#0b1e4a', '#3b1a5a', '#ffffff', '#ffd166', '#1f1a0a', '#ff8fb8', '#ffd166', 'stars', 'night'),
  leap: t('leap', '#1f6b3a', '#277a42', '#ffffff', '#ffd166', '#1f1a0a', '#9be7d3', '#ffffff', 'dots', 'night'),
  silly: t('silly', '#fff3b0', '#ffd6e0', '#2a1a3a', '#5b3df5', '#ffffff', '#2a9d8f', '#ffffff', 'dots', 'day'),
  birthday: t('birthday', '#ffe5f0', '#e0f0ff', '#2a1a3a', '#d6336c', '#ffffff', '#5b3df5', '#ffd166', 'dots', 'day'),
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
