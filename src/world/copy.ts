/**
 * Microcopy for the World view and its trackers. Kid-level, present tense, no URLs. Shared
 * world keys (title, Santa, New Year, Globe/Flat map) live in src/ui/copy.ts; the
 * rest are here, keyed the same way so a Spanish UI can come later.
 */
export const WORLD_COPY = {
  where: 'Where is it celebrated?',
  todayChip: 'Today',
  todayList: '{list}',
  peek: 'Peek inside {name}',
  inSleeps: 'in {sleeps}',
  isToday: 'today!',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  canvasHelp: 'Arrow keys spin it, plus and minus zoom, and Enter tells you what is in the middle.',
  hostLabel: 'Interactive globe',
  globeAria: 'Globe centered on {place}',
  mapAria: 'Flat map of the world',
  ariaHighlight: 'showing the {n} countries where {name} is celebrated',
  ariaToday: 'showing the countries celebrating something today',
  ariaNight: 'with the night side shaded',
  ariaSanta: 'Santa is {where}',
  ariaWave: '{n} of {total} places have reached {year}',
  ocean: 'Splash! That is the ocean. Most of our planet is water.',
  space: 'That is outer space. Tap the planet instead!',
  countryHolidays: 'Holidays celebrated here. Tap one to light it up:',
  countryNone: 'None of our big holidays started here, but people in {name} celebrate birthdays and New Year like everyone!',
  close: 'Close',
  happening: 'happening now',
  oceanTitle: 'The ocean',
  spaceTitle: 'Outer space',
  theSea: 'the sea',
  sunHere: 'Right here the sun is straight overhead, so it is lunchtime and shadows are tiny!',
  legendSun: 'Sun overhead',
  // ── day & night ──
  sunTitle: 'Day and night',
  sunStatus: '{n} of {total} cities are having daytime',
  sunRising: 'The sun is rising in {city}',
  sunSetting: 'and setting in {city}.',
  nightToggle: 'Night side',
  // ── moon ──
  moonTitle: 'Moon tonight',
  moonStatus: '{phase}',
  moonFullTonight: 'It’s a full moon tonight!',
  moonNewTonight: 'It’s a new moon tonight, so the sky is extra dark.',
  moonNextFull: 'Next full moon in {sleeps}',
  moonNextNew: 'New moon in {sleeps}',
  moonHintFull: '{emoji} {name} is {when}, and it is always on a full moon!',
  moonHintNew: '{emoji} {name} is {when}. It starts at a new moon, when the sky is darkest.',
  moonHintCrescent: '{emoji} {name} is {when}. It begins when the first thin crescent moon is seen.',
  moonHintMoon: '{emoji} {name} is {when}. Its date follows the moon, too.',
  // ── New Year wave ──
  waveStatus: '{n} of {total} places are already in {year}!',
  waveStartsIn: 'The New Year wave starts in {time}, in {city}.',
  waveAll: 'Everyone is in {year}! The wave went all the way round.',
  waveYourTurn: 'Your turn in {time}',
  waveYourTurnName: '{name}’s turn in {time}',
  waveYourDone: 'It’s already {year} where you are! 🎉',
  waveNext: 'Next to reach midnight',
  waveJustNow: 'Happy New Year, {city}!',
  waveShow: 'Watch the New Year arrive',
  waveShowStop: 'Stop the show',
  waveMidnight: 'Midnight',
  // ── Santa ──
  santaCountdown: 'Santa is at the North Pole. {sleeps} to go!',
  santaEve: 'Santa takes off from the North Pole in {time}!',
  santaOffSeason: 'Santa is busy in the workshop. The tracker opens on December 1.',
  santaOver: 'Now over {place}',
  santaJustLeft: 'Just left {city}',
  santaWaiting: 'Santa is here!',
  santaLeaving: 'Leaving the North Pole',
  santaHeadingHome: 'Heading home to the North Pole',
  santaNext: 'Next stop: {city} in {time}',
  santaPresents: '{n} presents delivered',
  santaYourHouse: 'Santa reaches your house at midnight, in {time}. Be asleep!',
  santaYourHouseName: 'Santa reaches {name}’s house at midnight, in {time}. Be asleep!',
  santaBeenHere: 'Santa has already been to your house! 🎁',
  santaDone: 'Santa is back at the North Pole, fast asleep. 💤',
  santaNextShort: 'Next: {city}',
  santaHomeShort: 'Home time!',
  santaReplay: 'Watch a practice flight',
  santaReplayStop: 'Stop the practice flight',
  hudStop: 'Stop',
  // ── right now ──
  nowTitle: 'Right now around the world',
  nowAlready: 'It’s already {holiday} in {city}!',
  nowStill: 'It’s still {holiday} in {city}!',
  nowTomorrow: 'tomorrow',
  nowYesterday: 'yesterday',
  nowNothing: 'An ordinary day',
  cityNow: 'It’s {time} on {day}, {date}',
  // ── durations ──
  durDays: '{d} days',
  durDayHours: '1 day {h} h',
  durHours: '{h} h {m} min',
  durHoursOnly: '{h} h',
  durMinutes: '{m} min {s} s',
  durMinutesOnly: '{m} min',
  durSeconds: '{s} s',
} as const;

export type WorldCopyKey = keyof typeof WORLD_COPY;

/** Fills {placeholders}; unknown ones stay visible so a typo is easy to spot. */
export function wfmt(key: WorldCopyKey, vars: Record<string, string | number> = {}): string {
  return WORLD_COPY[key].replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** "3 days", "1 day 4 h", "5 h 12 min", "12 min 5 s", "45 s" — kid-sized countdown words. */
export function durationWords(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d >= 2) return wfmt('durDays', { d });
  if (d === 1) return wfmt('durDayHours', { h });
  if (h > 0) return wfmt(m === 0 ? 'durHoursOnly' : 'durHours', { h, m });
  if (m > 0) return wfmt(sec === 0 || m >= 10 ? 'durMinutesOnly' : 'durMinutes', { m, s: sec });
  return wfmt('durSeconds', { s: sec });
}

/** "26:04:09" style clock countdown (hours may exceed 24). */
export function durationClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`;
}
