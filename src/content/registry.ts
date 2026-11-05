import { FRIDAY, MONDAY, SUNDAY, THURSDAY, type Weekday } from '../dates/civil';
import type { DateRule, Region } from '../dates/rules';
import type { TableId } from '../dates/tables/types';
import type { HolidayId, HolidayMeta, Tag, Tradition } from './types';

// ───────── rule builders (keep every entry short enough to read as a table row) ─────────
const fixed = (month: number, day: number): DateRule => ({ kind: 'fixed', month, day });
const nth = (month: number, weekday: Weekday, n: 1 | 2 | 3 | 4): DateRule => ({ kind: 'nthWeekday', month, weekday, n });
const last = (month: number, weekday: Weekday): DateRule => ({ kind: 'lastWeekday', month, weekday });
const easter = (offset: number, calendar: 'gregorian' | 'julian' = 'gregorian'): DateRule => ({ kind: 'easter', offset, calendar });
const table = (id: TableId): DateRule => ({ kind: 'table', table: id });
const relative = (to: HolidayId, offset: number): DateRule => ({ kind: 'relative', to, offset });
const byRegion = (variants: Partial<Record<Region, DateRule>>, fallback: DateRule): DateRule => ({ kind: 'byRegion', variants, fallback });

/** 'Day 2' … 'Day 8' runs, so long dayNames lists stay readable. */
function run(prefix: string, from: number, to: number): string[] {
  const out: string[] = [];
  for (let i = from; i <= to; i++) out.push(`${prefix} ${i}`);
  return out;
}

/** Same-day tie-break (§5.7): faith/national win, then family; silly days sink to the bottom. */
export function priorityFor(tags: readonly Tag[]): number {
  if (tags.includes('faith') || tags.includes('national')) return 10;
  if (tags.includes('family')) return 5;
  if (tags.includes('silly')) return -10;
  return 0;
}

/** A meta without the two fields that are always derived: `priority` (from tags) and `sticker.id` (`<id>-sticker`). */
type Draft = Omit<HolidayMeta, 'priority' | 'sticker'> & { readonly sticker: readonly [emoji: string, label: string] };

function def(d: Draft): HolidayMeta {
  const { sticker: [emoji, label], ...rest } = d;
  return { ...rest, priority: priorityFor(d.tags), sticker: { id: `${d.id}-sticker`, emoji, label } };
}

/** Tier-3 silly days all share: tags ['silly'], theme 'silly', confetti with glyphs, one day, no region. */
function sillyDay(id: HolidayId, name: string, tagline: string, rule: DateRule, glyphs: readonly [string, ...string[]]): HolidayMeta {
  return def({
    id, name, emoji: glyphs[0], tagline, tier: 3, tags: ['silly'], traditions: ['secular'], rule,
    theme: 'silly', effect: 'confetti', effectParams: { glyphs }, sticker: [glyphs[0], name],
  });
}

// ───────── Tier 1 (22): full content, bespoke effect ─────────
const TIER1: readonly HolidayMeta[] = [
  def({
    id: 'christmas', name: 'Christmas', emoji: '🎄', tagline: 'Twinkly lights, presents and songs on a winter night',
    tier: 1, tags: ['lights', 'faith', 'sweets'], traditions: ['christian'],
    rule: fixed(12, 25), observedShift: 'us-federal',
    startOffset: -1, days: 2, mainDayOffset: 1, dayNames: ['Christmas Eve', 'Christmas Day'],
    theme: 'christmas', effect: 'snow', sticker: ['🎄', 'Merry & Bright'],
  }),
  def({
    id: 'hanukkah', name: 'Hanukkah', alsoCalled: ['Chanukah', 'Festival of Lights'], emoji: '🕎',
    tagline: 'Eight nights of candles, latkes and spinning dreidels',
    tier: 1, tags: ['lights', 'faith'], traditions: ['jewish'],
    rule: table('hanukkah'), beginsAtSundown: true, days: 8, mainDayOffset: 0,
    dayNames: ['First candle tonight!', ...run('Night', 2, 8), 'Last day of Hanukkah'],
    theme: 'hanukkah', effect: 'menorah', sticker: ['🕎', 'Eight Nights'],
  }),
  def({
    id: 'diwali', name: 'Diwali', alsoCalled: ['Deepavali', 'Festival of Lights'], emoji: '🪔',
    tagline: 'Rows of little lamps light up the darkest night',
    tier: 1, tags: ['lights', 'faith', 'sweets'], traditions: ['hindu', 'sikh'],
    rule: table('diwali'), startOffset: -2, days: 5, mainDayOffset: 2,
    dayNames: ['Dhanteras', 'Naraka Chaturdashi (Choti Diwali)', 'Lakshmi Puja — Diwali!', 'Govardhan Puja', 'Bhai Dooj'],
    theme: 'diwali', effect: 'diyas', sticker: ['🪔', 'Festival of Lights'],
  }),
  def({
    id: 'eid-al-fitr', name: 'Eid al-Fitr', alsoCalled: ['Eid ul-Fitr', 'Sweet Eid'], emoji: '🌙',
    tagline: 'A sweet feast when the Ramadan fast is over',
    tier: 1, tags: ['faith', 'sweets'], traditions: ['muslim'],
    rule: table('eid-al-fitr'), days: 3, mainDayOffset: 0,
    theme: 'eid', effect: 'crescent', sticker: ['🌙', 'Eid Mubarak'],
  }),
  def({
    id: 'lunar-new-year', name: 'Lunar New Year', alsoCalled: ['Chinese New Year', 'Spring Festival', 'Tết', 'Seollal'], emoji: '🧧',
    tagline: 'Red lanterns, lucky envelopes and a brand-new year',
    tier: 1, tags: ['new-year', 'lights', 'world'], traditions: ['east-asian'],
    rule: table('lunar-new-year'), days: 15, mainDayOffset: 0,
    theme: 'lunar', effect: 'lanterns', effectParams: { variant: 'hanging' }, sticker: ['🧧', 'Year of the {animal}'],
  }),
  def({
    id: 'halloween', name: 'Halloween', alsoCalled: ["All Hallows' Eve"], emoji: '🎃',
    tagline: 'Pumpkins, costumes and a friendly kind of spooky',
    tier: 1, tags: ['spooky', 'sweets'], traditions: ['secular'],
    rule: fixed(10, 31), theme: 'halloween', effect: 'bats', sticker: ['🎃', 'Boo!'],
  }),
  def({
    id: 'thanksgiving', name: 'Thanksgiving', emoji: '🦃', tagline: 'A big thank-you dinner with the people you love',
    tier: 1, tags: ['family', 'harvest'], traditions: ['secular'], regions: ['US', 'CA'],
    rule: byRegion({ CA: nth(10, MONDAY, 2) }, nth(11, THURSDAY, 4)),
    theme: 'harvest', effect: 'leaves', sticker: ['🦃', 'Thankful'],
  }),
  def({
    id: 'easter', name: 'Easter', emoji: '🐣', tagline: 'Eggs, bunnies and spring bursting into life',
    tier: 1, tags: ['spring', 'faith', 'sweets'], traditions: ['christian'],
    rule: easter(0), theme: 'easter', effect: 'eggs', sticker: ['🐣', 'Hoppy Easter'],
  }),
  def({
    id: 'holi', name: 'Holi', alsoCalled: ['Festival of Colours', 'Dhulandi'], emoji: '🎨',
    tagline: 'Throw colour powder and welcome the spring!',
    tier: 1, tags: ['spring', 'faith', 'world'], traditions: ['hindu'],
    rule: table('holi'), startOffset: -1, days: 2, mainDayOffset: 1,
    dayNames: ['Holika Dahan (bonfire night)', 'Rangwali Holi — colour day!'],
    theme: 'holi', effect: 'holi', sticker: ['🎨', 'Colour Thrower'],
  }),
  def({
    id: 'day-of-the-dead', name: 'Day of the Dead', alsoCalled: ['Día de los Muertos'], emoji: '💀',
    tagline: 'Remembering family with marigolds, music and sugar skulls',
    tier: 1, tags: ['spooky', 'family', 'world'], traditions: ['mexican'],
    rule: fixed(11, 1), days: 2, mainDayOffset: 1, dayNames: ['Día de los Angelitos', 'Día de los Muertos'],
    theme: 'muertos', effect: 'petals', effectParams: { variant: 'marigold' }, sticker: ['💀', 'Remembering'],
  }),
  def({
    id: 'kwanzaa', name: 'Kwanzaa', emoji: '🕯️', tagline: 'Seven nights, seven candles, seven big ideas',
    tier: 1, tags: ['lights', 'family'], traditions: ['african-american'], regions: ['US'],
    rule: fixed(12, 26), days: 7, mainDayOffset: 0,
    dayNames: ['Umoja (Unity)', 'Kujichagulia (Self-Determination)', 'Ujima (Working Together)', 'Ujamaa (Sharing What We Have)',
      'Nia (Purpose)', 'Kuumba (Creativity)', 'Imani (Faith)'],
    theme: 'kwanzaa', effect: 'kinara', sticker: ['🕯️', 'Seven Principles'],
  }),
  def({
    id: 'juneteenth', name: 'Juneteenth', alsoCalled: ['Freedom Day', 'Emancipation Day'], emoji: '⭐',
    tagline: 'Celebrating the day freedom finally reached everyone',
    tier: 1, tags: ['national'], traditions: ['african-american'], regions: ['US'],
    rule: fixed(6, 19), observedShift: 'us-federal',
    theme: 'juneteenth', effect: 'fireworks', effectParams: { palette: ['#ff4d5e', '#7cc4ff', '#ffffff'], variant: 'star' },
    sticker: ['⭐', 'Freedom Day'],
  }),
  def({
    id: 'nowruz', name: 'Nowruz', alsoCalled: ['Persian New Year', 'Norooz'], emoji: '🐟',
    tagline: 'Spring cleaning, a sprouting plate and a new year',
    tier: 1, tags: ['spring', 'new-year', 'world'], traditions: ['persian'],
    rule: table('nowruz'), days: 13, mainDayOffset: 0,
    dayNames: ['Nowruz!', ...run('Day', 2, 12), 'Sizdah Bedar — picnic day!'],
    theme: 'nowruz', effect: 'sabzeh', sticker: ['🐟', 'New Day'],
  }),
  def({
    id: 'mid-autumn-festival', name: 'Mid-Autumn Festival', alsoCalled: ['Moon Festival', 'Zhongqiu', 'Tết Trung Thu'], emoji: '🥮',
    tagline: 'The roundest, brightest moon and sweet mooncakes',
    tier: 1, tags: ['lights', 'family', 'world'], traditions: ['east-asian'],
    rule: table('mid-autumn'), theme: 'midautumn', effect: 'moon', sticker: ['🥮', 'Moon Watcher'],
  }),
  def({
    id: 'st-patricks-day', name: "St Patrick's Day", alsoCalled: ['Lá Fhéile Pádraig'], emoji: '☘️',
    tagline: 'Shamrocks, rainbows and a sea of green',
    tier: 1, tags: ['silly', 'world'], traditions: ['irish'],
    rule: fixed(3, 17), theme: 'stpatricks', effect: 'shamrocks', sticker: ['☘️', 'Lucky'],
  }),
  def({
    id: 'valentines-day', name: "Valentine's Day", emoji: '💝', tagline: 'Hearts, cards and telling people you love them',
    tier: 1, tags: ['sweets', 'family'], traditions: ['secular'],
    rule: fixed(2, 14), theme: 'valentine', effect: 'hearts', sticker: ['💝', 'Big Heart'],
  }),
  def({
    id: 'mothers-day', name: "Mother's Day", alsoCalled: ['Mothering Sunday'], emoji: '💐',
    tagline: 'A day to spoil the mum, gran or grown-up who cares for you',
    tier: 1, tags: ['family'], traditions: ['secular'],
    rule: byRegion({ GB: easter(-21), MX: fixed(5, 10), FR: { kind: 'custom', id: 'mothers-day-fr' } }, nth(5, SUNDAY, 2)),
    theme: 'mothers', effect: 'petals', effectParams: { variant: 'bloom' }, sticker: ['💐', 'Best Helper'],
  }),
  def({
    id: 'fathers-day', name: "Father's Day", emoji: '✈️', tagline: 'A day for dads, grandads and the grown-ups who show up',
    tier: 1, tags: ['family'], traditions: ['secular'],
    rule: byRegion({ AU: nth(9, SUNDAY, 1) }, nth(6, SUNDAY, 3)),
    theme: 'fathers', effect: 'planes', sticker: ['✈️', 'Co-pilot'],
  }),
  def({
    id: 'independence-day-us', name: 'Independence Day', alsoCalled: ['Fourth of July'], emoji: '🎆',
    tagline: 'Fireworks, flags and a birthday party for a country',
    tier: 1, tags: ['national'], traditions: ['civic'], regions: ['US'],
    rule: fixed(7, 4), observedShift: 'us-federal',
    theme: 'usa', effect: 'fireworks', effectParams: { palette: ['#ff4d5e', '#ffffff', '#7cc4ff'] }, sticker: ['🎆', 'Sparkler'],
  }),
  def({
    id: 'earth-day', name: 'Earth Day', emoji: '🌍', tagline: 'A day to look after our big blue-and-green home',
    tier: 1, tags: ['spring', 'world'], traditions: ['secular'],
    rule: fixed(4, 22), theme: 'earth', effect: 'bubbles', effectParams: { variant: 'earth' }, sticker: ['🌍', 'Earth Helper'],
  }),
  def({
    id: 'pi-day', name: 'Pi Day', emoji: '🥧', tagline: '3.14… a maths party with actual pie',
    tier: 1, tags: ['silly', 'sweets'], traditions: ['secular'],
    rule: fixed(3, 14), theme: 'pi', effect: 'glyph-rain',
    effectParams: { glyphs: ['π', '3', '1', '4', '1', '5', '9'], variant: 'chalk' }, sticker: ['🥧', '3.14159'],
  }),
  def({
    id: 'new-years-eve', name: "New Year's Eve", alsoCalled: ['Hogmanay', 'Silvester'], emoji: '🎉',
    tagline: 'Count down to midnight and shout Happy New Year!',
    tier: 1, tags: ['new-year'], traditions: ['secular'],
    rule: fixed(12, 31), theme: 'newyear', effect: 'confetti', effectParams: { variant: 'cannon' }, sticker: ['🎉', 'Countdown Kid'],
  }),
];

// ───────── Tier 2 (30): shorter content, shared effects ─────────
const TIER2: readonly HolidayMeta[] = [
  def({
    id: 'new-years-day', name: "New Year's Day", emoji: '🎊', tagline: 'The first page of a brand-new year',
    tier: 2, tags: ['new-year'], traditions: ['secular'],
    rule: fixed(1, 1), observedShift: 'us-federal', theme: 'newyear', effect: 'confetti', sticker: ['🎊', 'Fresh Start'],
  }),
  def({
    id: 'three-kings-day', name: 'Three Kings Day', alsoCalled: ['Epiphany', 'Día de los Reyes', 'Fête des Rois'], emoji: '👑',
    tagline: 'Three travellers, a star and a cake with a surprise inside',
    tier: 2, tags: ['faith', 'sweets', 'world'], traditions: ['christian'],
    rule: fixed(1, 6), theme: 'threekings', effect: 'glyph-rain', effectParams: { glyphs: ['⭐', '👑'] }, sticker: ['👑', 'Crown Finder'],
  }),
  def({
    id: 'mlk-day', name: 'Martin Luther King Jr. Day', alsoCalled: ['MLK Day'], emoji: '🕊️',
    tagline: 'Remembering a man who dreamed of fairness for all',
    tier: 2, tags: ['national'], traditions: ['civic'], regions: ['US'],
    rule: nth(1, MONDAY, 3), theme: 'mlk', effect: 'glyph-rain', effectParams: { glyphs: ['🕊️', '❤️', '✊'] }, sticker: ['🕊️', 'Dream Big'],
  }),
  def({
    id: 'groundhog-day', name: 'Groundhog Day', emoji: '🦫', tagline: 'Will the groundhog see its shadow today?',
    tier: 2, tags: ['silly'], traditions: ['secular'], regions: ['US', 'CA'],
    rule: fixed(2, 2), theme: 'snowday', effect: 'snow', effectParams: { variant: 'shadow' }, sticker: ['🦫', 'Shadow Spotter'],
  }),
  def({
    id: 'lantern-festival', name: 'Lantern Festival', alsoCalled: ['Yuanxiao', 'Shangyuan Festival'], emoji: '🏮',
    tagline: 'Glowing lanterns end the Lunar New Year',
    tier: 2, tags: ['lights', 'world'], traditions: ['east-asian'],
    rule: relative('lunar-new-year', 14), theme: 'lunar', effect: 'lanterns', effectParams: { variant: 'rising' },
    sticker: ['🏮', 'Lantern Lifter'],
  }),
  def({
    id: 'pancake-day', name: 'Pancake Day', alsoCalled: ['Shrove Tuesday', 'Mardi Gras', 'Fat Tuesday'], emoji: '🥞',
    tagline: 'Flip, flip, flip — a pancake feast before Lent',
    tier: 2, tags: ['sweets', 'silly'], traditions: ['christian'], regions: ['GB', 'US', 'FR'],
    rule: easter(-47), theme: 'carnival', effect: 'confetti', effectParams: { glyphs: ['🥞', '🎭'], variant: 'banner' },
    sticker: ['🥞', 'Pancake Flipper'],
  }),
  def({
    id: 'leap-day', name: 'Leap Day', emoji: '🐸', tagline: 'A bonus day that only comes every four years',
    tier: 2, tags: ['silly'], traditions: ['secular'],
    rule: fixed(2, 29), theme: 'leap', effect: 'glyph-rain', effectParams: { glyphs: ['🐸'], variant: 'hop' }, sticker: ['🐸', 'Rare Hopper'],
  }),
  def({
    id: 'purim', name: 'Purim', emoji: '🎭', tagline: "Costumes, noisemakers and a brave queen's story",
    tier: 2, tags: ['faith', 'sweets'], traditions: ['jewish'],
    rule: table('purim'), beginsAtSundown: true, days: 1, mainDayOffset: 1, dayNames: ['Megillah reading tonight', 'Purim day!'],
    theme: 'purim', effect: 'confetti', effectParams: { glyphs: ['🎭', '🍪'] }, sticker: ['🎭', 'Noisemaker'],
  }),
  def({
    id: 'passover', name: 'Passover', alsoCalled: ['Pesach'], emoji: '🍷', tagline: 'A special meal that tells a story of freedom',
    tier: 2, tags: ['faith', 'spring'], traditions: ['jewish'],
    rule: table('passover'), beginsAtSundown: true, days: 8, mainDayOffset: 0,
    dayNames: ['First seder tonight!', 'Day 1 (second seder tonight)', ...run('Day', 2, 8)],
    theme: 'passover', effect: 'petals', effectParams: { variant: 'spring', palette: ['#9be7d3', '#2a7f4f', '#ffffff'] },
    sticker: ['🍷', 'Four Questions'],
  }),
  def({
    id: 'ramadan', name: 'Ramadan', emoji: '🌙', tagline: 'A month of fasting, kindness and moonlit meals',
    tier: 2, tags: ['faith'], traditions: ['muslim'],
    rule: table('ramadan-start'), days: { untilTable: 'eid-al-fitr' }, mainDayOffset: 0,
    theme: 'ramadan', effect: 'crescent', sticker: ['🌙', 'Crescent Spotter'],
  }),
  def({
    id: 'orthodox-easter', name: 'Orthodox Easter', alsoCalled: ['Pascha', 'Greek Easter'], emoji: '🥚',
    tagline: 'Red eggs and candlelight for Easter on another calendar',
    tier: 2, tags: ['faith', 'spring'], traditions: ['orthodox'],
    rule: easter(0, 'julian'), theme: 'dawn', effect: 'eggs', effectParams: { palette: ['#c8102e', '#b3121b', '#ffd166'] },
    sticker: ['🥚', 'Red Egg'],
  }),
  def({
    id: 'april-fools-day', name: "April Fools' Day", emoji: '🤡', tagline: "Pranks, giggles and 'just kidding!'",
    tier: 2, tags: ['silly'], traditions: ['secular'],
    rule: fixed(4, 1), theme: 'carnival', effect: 'confetti', effectParams: { variant: 'fools' }, sticker: ['🤡', 'Just Kidding'],
  }),
  def({
    id: 'songkran', name: 'Songkran', alsoCalled: ['Thai New Year'], emoji: '💦', tagline: "Thailand's new year is one giant water fight",
    tier: 2, tags: ['spring', 'world', 'new-year'], traditions: ['buddhist'],
    rule: fixed(4, 13), days: 3, mainDayOffset: 0,
    theme: 'splash', effect: 'bubbles', effectParams: { variant: 'water' }, sticker: ['💦', 'Splash Master'],
  }),
  def({
    id: 'cinco-de-mayo', name: 'Cinco de Mayo', emoji: '🪅', tagline: 'Music, dancing and a famous Mexican victory',
    tier: 2, tags: ['national', 'world'], traditions: ['mexican'], regions: ['US', 'MX'],
    rule: fixed(5, 5), theme: 'carnival', effect: 'confetti', effectParams: { variant: 'banner' }, sticker: ['🪅', 'Fiesta'],
  }),
  def({
    id: 'childrens-day-japan', name: "Children's Day (Japan)", alsoCalled: ['Kodomo no Hi'], emoji: '🎏',
    tagline: 'Carp streamers fly for strong, happy children',
    tier: 2, tags: ['family', 'world'], traditions: ['secular'],
    rule: fixed(5, 5), theme: 'koinobori', effect: 'balloons', effectParams: { variant: 'koinobori' }, sticker: ['🎏', 'Carp Streamer'],
  }),
  def({
    id: 'eid-al-adha', name: 'Eid al-Adha', alsoCalled: ['Eid ul-Adha', 'Bakrid', 'Kurban Bayramı'], emoji: '🐑',
    tagline: 'A feast about sharing with family and neighbours',
    tier: 2, tags: ['faith'], traditions: ['muslim'],
    rule: table('eid-al-adha'), days: 4, mainDayOffset: 0,
    theme: 'eid', effect: 'crescent', effectParams: { variant: 'lanterns' }, sticker: ['🐑', 'Sharing Heart'],
  }),
  def({
    id: 'dragon-boat-festival', name: 'Dragon Boat Festival', alsoCalled: ['Duanwu', 'Tuen Ng'], emoji: '🐉',
    tagline: 'Drums, paddles and sticky rice parcels',
    tier: 2, tags: ['world', 'family'], traditions: ['east-asian'],
    rule: table('dragon-boat'), theme: 'river', effect: 'bubbles', effectParams: { variant: 'waves' }, sticker: ['🐉', 'Paddler'],
  }),
  def({
    id: 'memorial-day', name: 'Memorial Day', emoji: '🌺', tagline: 'Poppies and a quiet thank-you to brave soldiers',
    tier: 2, tags: ['national'], traditions: ['civic'], regions: ['US'],
    rule: last(5, MONDAY), theme: 'usa', effect: 'petals', effectParams: { variant: 'poppies' }, sticker: ['🌺', 'Poppy'],
  }),
  def({
    id: 'canada-day', name: 'Canada Day', alsoCalled: ['Fête du Canada'], emoji: '🍁',
    tagline: "Maple leaves and fireworks for Canada's birthday",
    tier: 2, tags: ['national'], traditions: ['civic'], regions: ['CA'],
    rule: fixed(7, 1), observedShift: 'next-monday',
    theme: 'canada', effect: 'fireworks', effectParams: { palette: ['#ff4d5e', '#ffffff'] }, sticker: ['🍁', 'Maple Leaf'],
  }),
  def({
    id: 'bastille-day', name: 'Bastille Day', alsoCalled: ['Fête nationale', 'Le 14 juillet'], emoji: '🇫🇷',
    tagline: "France's big day of parades and fireworks",
    tier: 2, tags: ['national'], traditions: ['civic'], regions: ['FR'],
    rule: fixed(7, 14), theme: 'france', effect: 'fireworks', effectParams: { palette: ['#7cc4ff', '#ffffff', '#ff4d5e'] },
    sticker: ['🇫🇷', 'Allons-y!'],
  }),
  def({
    id: 'independence-day-india', name: 'Independence Day (India)', emoji: '🪁', tagline: "Kites fill the sky for India's freedom day",
    tier: 2, tags: ['national'], traditions: ['civic'], regions: ['IN'],
    rule: fixed(8, 15), theme: 'summer', effect: 'fireworks',
    effectParams: { palette: ['#ff9933', '#ffffff', '#138808'], glyphs: ['🪁'] }, sticker: ['🪁', 'Kite Flyer'],
  }),
  def({
    id: 'labor-day', name: 'Labor Day', emoji: '🛠️', tagline: 'A rest day to cheer for people who work hard',
    tier: 2, tags: ['national', 'family'], traditions: ['civic'], regions: ['US'],
    rule: nth(9, MONDAY, 1), theme: 'summer', effect: 'confetti', effectParams: { glyphs: ['🍉', '🛠️'] }, sticker: ['🛠️', 'Hard Worker'],
  }),
  def({
    id: 'grandparents-day', name: 'Grandparents Day', emoji: '👵', tagline: 'Hugs and stories for grandmas and grandpas',
    tier: 2, tags: ['family'], traditions: ['secular'], regions: ['US'],
    rule: relative('labor-day', 6), theme: 'mothers', effect: 'hearts', effectParams: { palette: ['#ffb703', '#ff8fb8', '#c8442e'] },
    sticker: ['👵', 'Big Hug'],
  }),
  def({
    id: 'independence-day-mexico', name: 'Mexican Independence Day', alsoCalled: ['El Grito', 'Día de la Independencia'], emoji: '🇲🇽',
    tagline: 'A midnight shout of ¡Viva México!',
    tier: 2, tags: ['national'], traditions: ['mexican'], regions: ['MX'],
    rule: fixed(9, 16), theme: 'carnival', effect: 'fireworks', effectParams: { palette: ['#4cd964', '#ffffff', '#ff4d5e'] },
    sticker: ['🇲🇽', '¡Viva!'],
  }),
  def({
    id: 'chuseok', name: 'Chuseok', alsoCalled: ['Hangawi', 'Korean Thanksgiving'], emoji: '🍡',
    tagline: "Korea's harvest moon, family and rice cakes",
    tier: 2, tags: ['family', 'harvest', 'world'], traditions: ['east-asian'],
    rule: table('mid-autumn'), startOffset: -1, days: 3, mainDayOffset: 1, dayNames: ['Chuseok Eve', 'Chuseok!', 'Day after Chuseok'],
    theme: 'midautumn', effect: 'moon', sticker: ['🍡', 'Harvest Moon'],
  }),
  def({
    id: 'rosh-hashanah', name: 'Rosh Hashanah', alsoCalled: ['Jewish New Year'], emoji: '🍎',
    tagline: 'Apples dipped in honey for a sweet new year',
    tier: 2, tags: ['faith', 'new-year', 'sweets'], traditions: ['jewish'],
    rule: table('rosh-hashanah'), beginsAtSundown: true, days: 2, mainDayOffset: 0,
    dayNames: ['Erev Rosh Hashanah — tonight!', 'Day 1', 'Day 2'],
    theme: 'roshhashanah', effect: 'glyph-rain', effectParams: { glyphs: ['🍎', '🍯'] }, sticker: ['🍎', 'Sweet New Year'],
  }),
  def({
    id: 'indigenous-peoples-day', name: "Indigenous Peoples' Day", emoji: '🌽', tagline: 'Honouring the first peoples of this land',
    tier: 2, tags: ['national'], traditions: ['civic'], regions: ['US'],
    rule: nth(10, MONDAY, 2), theme: 'harvest', effect: 'leaves',
    effectParams: { palette: ['#c8102e', '#ff8c1a', '#ffd166', '#7a3e13'] }, sticker: ['🌽', 'First Peoples'],
  }),
  def({
    id: 'bonfire-night', name: 'Bonfire Night', alsoCalled: ['Guy Fawkes Night', 'Fireworks Night'], emoji: '🔥',
    tagline: 'Bonfires and fireworks on a chilly November night',
    tier: 2, tags: ['lights', 'national'], traditions: ['civic'], regions: ['GB'],
    rule: fixed(11, 5), theme: 'bonfire', effect: 'fireworks', effectParams: { palette: ['#ff7a00', '#ffd166'] }, sticker: ['🔥', 'Bonfire Buddy'],
  }),
  def({
    id: 'st-nicholas-day', name: 'St Nicholas Day', alsoCalled: ['Sinterklaas', 'Nikolaustag'], emoji: '🥾',
    tagline: 'Shoes by the door and a visit from a kind bishop',
    tier: 2, tags: ['faith', 'sweets'], traditions: ['christian'], regions: ['FR', 'OTHER'],
    rule: fixed(12, 6), theme: 'christmas', effect: 'snow', sticker: ['🥾', 'Shiny Boots'],
  }),
  def({
    id: 'boxing-day', name: 'Boxing Day', emoji: '🎁', tagline: 'A cosy, slow day after Christmas',
    tier: 2, tags: ['family'], traditions: ['secular'], regions: ['GB', 'CA', 'AU'],
    rule: fixed(12, 26), theme: 'christmas', effect: 'snow', sticker: ['🎁', 'Cosy Day'],
  }),
];

// ───────── Tier 3 (24): silly days — Today ribbon and the "Silly" chip only, never the hero ─────────
const TIER3: readonly HolidayMeta[] = [
  sillyDay('squirrel-day', 'Squirrel Appreciation Day', 'Cheer for the bushy-tailed acrobats', fixed(1, 21), ['🐿️', '🌰']),
  sillyDay('puzzle-day', 'National Puzzle Day', 'Jigsaws, riddles and brain teasers', fixed(1, 29), ['🧩']),
  sillyDay('pizza-day', 'Pizza Day', "A slice of the world's favourite food", fixed(2, 9), ['🍕']),
  sillyDay('kind-acts-day', 'Random Acts of Kindness Day', 'Do something nice, just because', fixed(2, 17), ['💛']),
  sillyDay('tooth-fairy-day', 'Tooth Fairy Day', 'For the tiny visitor who collects teeth', fixed(2, 28), ['🦷', '🧚']),
  sillyDay('wildlife-day', 'World Wildlife Day', 'A cheer for wild animals everywhere', fixed(3, 3), ['🦁', '🐘', '🦋']),
  sillyDay('happiness-day', 'International Day of Happiness', 'Feeling good counts, all over the world', fixed(3, 20), ['😄']),
  sillyDay('book-day', 'World Book Day', 'Get lost in a story', fixed(4, 23), ['📚']),
  sillyDay('star-wars-day', 'Star Wars Day', 'May the Fourth be with you', fixed(5, 4), ['⭐', '🚀']),
  sillyDay('bee-day', 'World Bee Day', 'Thank a bee for your fruit', fixed(5, 20), ['🐝', '🌻']),
  sillyDay('childrens-day', "International Children's Day", 'A party for kids around the world', fixed(6, 1), ['🎈']),
  sillyDay('donut-day', 'National Donut Day', 'Rings of sweet fried dough', nth(6, FRIDAY, 1), ['🍩']),
  sillyDay('oceans-day', 'World Oceans Day', 'For the big blue that covers our planet', fixed(6, 8), ['🌊', '🐠']),
  sillyDay('emoji-day', 'World Emoji Day', 'Say it with tiny pictures', fixed(7, 17), ['😀', '🎉']),
  sillyDay('ice-cream-day', 'National Ice Cream Day', 'A scoop, a cone or a sundae', nth(7, SUNDAY, 3), ['🍦']),
  sillyDay('pi-approximation-day', 'Pi Approximation Day', '22 ÷ 7 is almost pi', fixed(7, 22), ['🥧']),
  sillyDay('friendship-day', 'International Friendship Day', "Tell your friends why they're great", fixed(7, 30), ['🤝']),
  sillyDay('left-handers-day', 'Left-Handers Day', 'High-five with your left hand', fixed(8, 13), ['🖐️']),
  sillyDay('dot-day', 'International Dot Day', 'Make your mark, then see where it takes you', fixed(9, 15), ['🔵', '🟠']),
  sillyDay('pirate-day', 'Talk Like a Pirate Day', 'Arr! Ahoy! Shiver me timbers!', fixed(9, 19), ['🏴‍☠️', '🦜']),
  sillyDay('smile-day', 'World Smile Day', 'Share a smile and one kind thing', nth(10, FRIDAY, 1), ['🙂']),
  sillyDay('animal-day', 'World Animal Day', 'For every creature, big and small', fixed(10, 4), ['🐾']),
  sillyDay('kindness-day', 'World Kindness Day', 'Kind words, kind deeds, kind thoughts', fixed(11, 13), ['💗']),
  sillyDay('hello-day', 'World Hello Day', 'Say hello to ten people today', fixed(11, 21), ['👋']),
];

/** All 76 holiday metas (22 tier-1, 30 tier-2, 24 tier-3), eager. */
export const HOLIDAYS: readonly HolidayMeta[] = [...TIER1, ...TIER2, ...TIER3];
export const HOLIDAY_IDS: readonly HolidayId[] = HOLIDAYS.map((m) => m.id);

const INDEX = new Map<HolidayId, HolidayMeta>();
for (const m of HOLIDAYS) INDEX.set(m.id, m);

export function byId(id: HolidayId): HolidayMeta | undefined {
  return INDEX.get(id);
}

export const tier1 = (): readonly HolidayMeta[] => HOLIDAYS.filter((m) => m.tier === 1);
export const tier2 = (): readonly HolidayMeta[] => HOLIDAYS.filter((m) => m.tier === 2);
/** The tier-3 silly days. */
export const silly = (): readonly HolidayMeta[] => HOLIDAYS.filter((m) => m.tier === 3);

/** Span length in civil days (the eve counts when `beginsAtSundown`), or 'untilTable' when it ends at another table's next row. */
export function spanLength(meta: HolidayMeta): number | 'untilTable' {
  const days = meta.days ?? 1;
  if (typeof days !== 'number') return 'untilTable';
  return days + (meta.beginsAtSundown ? 1 : 0);
}
export const SPAN_LENGTH = spanLength;

/** Sticker label for a given occurrence year: Lunar New Year's label carries a `{animal}` placeholder. */
export function stickerLabel(meta: HolidayMeta, year: number): string {
  return meta.sticker.label.replace('{animal}', zodiacFor(year));
}

export const TAG_LABELS: Record<Tag, string> = {
  lights: 'Lights', sweets: 'Sweets', spooky: 'Spooky', spring: 'Spring', silly: 'Silly', family: 'Family',
  national: 'National', faith: 'Faith', harvest: 'Harvest', 'new-year': 'New Year', world: 'Around the world',
};

export const TRADITION_LABELS: Record<Tradition, string> = {
  christian: 'Christian', orthodox: 'Orthodox Christian', jewish: 'Jewish', muslim: 'Muslim', hindu: 'Hindu', sikh: 'Sikh',
  buddhist: 'Buddhist', 'east-asian': 'East Asian', persian: 'Persian', mexican: 'Mexican', 'african-american': 'African American',
  irish: 'Irish', secular: 'Everyone', civic: 'National',
};

const ZODIAC = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'] as const;

/** Chinese zodiac animal for the lunar year that begins in Gregorian `year`. 2020 = Rat. */
export function zodiacFor(year: number): string {
  return ZODIAC[(((year - 2020) % 12) + 12) % 12]!;
}
