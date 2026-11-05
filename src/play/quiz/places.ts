/**
 * places.ts — the hand-checked geography the quiz asks about, kept apart from the generator so a
 * reviewer can read it as a table. Every answer must be an outlined country (COUNTRY_NAMES) that
 * CELEBRATED lists for that holiday; test/play-quiz.test.ts enforces both, so a question can never
 * point a child at the wrong place. Facts here are the well-documented, kid-level kind (carp
 * streamers in Japan, twelve grapes in Spain); anything contested, such as which country has the
 * most Jewish families, is simply not asked.
 */
import { COUNTRY_NAMES } from '../../world/data/countries';

export type PlaceKind =
  /** "Spin to the country where Day of the Dead began." */
  | 'began'
  /** "Which country has the most people celebrating Diwali?" */
  | 'most'
  /** "In Nepal, Diwali is called Tihar… Can you find Nepal?" (the name is in the question). */
  | 'find'
  /** "Tap a country where people celebrate Songkran with water fights." */
  | 'doing';

export interface PlaceQuestion {
  readonly holiday: string;
  readonly kind: PlaceKind;
  readonly prompt: string;
  /** Any of these is right; the first is where the globe turns to show the answer. */
  readonly answers: readonly string[];
  /** One kid-level sentence after the answer (the CELEBRATED note is used when absent). */
  readonly reveal?: string;
}

const q = (holiday: string, kind: PlaceKind, prompt: string, answers: readonly string[], reveal?: string): PlaceQuestion =>
  (reveal === undefined ? { holiday, kind, prompt, answers } : { holiday, kind, prompt, answers, reveal });

/**
 * The curated questions. 'doing' entries narrow the answer set (Songkran's water fights belong to
 * four of its eight countries); a holiday without one still gets the plain "Tap a country where
 * people celebrate …" question generated from CELEBRATED.
 */
export const PLACES: readonly PlaceQuestion[] = [
  // ── Tier 1
  q('christmas', 'find', 'Christmas comes in summer in Australia! Can you find Australia?', ['AU'],
    'Lots of Australian families have Christmas lunch outside, and some go to the beach.'),
  q('christmas', 'most', 'Which country has the most people celebrating Christmas?', ['US'],
    'More people celebrate Christmas in the USA than in any other country.'),
  q('hanukkah', 'doing', 'Tap a country where Jewish families light the menorah for Hanukkah.', []),
  q('hanukkah', 'find', 'In Israel, families eat jam doughnuts called sufganiyot at Hanukkah. Can you find Israel?', ['IL'],
    'Foods fried in oil remind families of the Hanukkah story of a little oil that burned for eight nights.'),
  q('diwali', 'most', 'Which country has the most people celebrating Diwali?', ['IN'],
    'Millions of little clay lamps called diyas light up homes all over India.'),
  q('diwali', 'find', 'In Nepal, Diwali is called Tihar, and one day is for thanking dogs! Can you find Nepal?', ['NP'],
    'On that day, dogs get flower garlands and lots of treats.'),
  q('diwali', 'doing', 'Tap a country where families light lamps for Diwali.', []),
  q('eid-al-fitr', 'find', 'In Indonesia, so many people travel home for Eid that the trip has its own name: mudik! Can you find Indonesia?', ['ID'],
    'Indonesia is made of thousands of islands, so people go home by boat, train, bus and motorbike.'),
  q('eid-al-fitr', 'find', 'In Turkey, Eid al-Fitr is called the Sugar Feast. Can you find Turkey?', ['TR'],
    'Children visit grown-ups in the family and are given sweets.'),
  q('lunar-new-year', 'most', 'Which country has the most people celebrating Lunar New Year?', ['CN'],
    'It is the biggest holiday of the year in China, with lanterns, dumplings and fireworks.'),
  q('lunar-new-year', 'find', 'In Vietnam, Lunar New Year is called Tết. Can you find Vietnam?', ['VN']),
  q('lunar-new-year', 'find', 'In Korea, Lunar New Year is called Seollal. Can you find South Korea?', ['KR']),
  q('halloween', 'began', 'Halloween began long ago in Ireland and Scotland. Can you find one of them?', ['IE', 'GB'],
    'Scotland is part of the United Kingdom. Long ago, children there carved turnips, not pumpkins!'),
  q('halloween', 'doing', 'Tap a country where children go trick-or-treating.', []),
  q('thanksgiving', 'find', 'Canada has Thanksgiving in October, more than a month before the USA. Can you find Canada?', ['CA']),
  q('easter', 'doing', 'Tap a country where families celebrate Easter.', []),
  q('holi', 'most', 'Which country has the most people celebrating Holi, the festival of colors?', ['IN'],
    'People throw bright colored powder and water at each other, and everyone ends up rainbow-colored.'),
  q('holi', 'find', 'Holi is a holiday in Guyana, in South America, too! Can you find Guyana?', ['GY']),
  q('day-of-the-dead', 'began', 'Spin the globe to the country where Day of the Dead began.', ['MX'],
    'Families in Mexico build colorful altars called ofrendas, with marigolds, photos and favorite foods.'),
  q('day-of-the-dead', 'doing', 'Tap a country where families remember loved ones on Day of the Dead.', []),
  q('kwanzaa', 'began', 'Kwanzaa began in 1966. Spin the globe to the country where it started!', ['US'],
    'Kwanzaa started in the USA. Families light one more candle on the kinara every night for seven nights.'),
  q('juneteenth', 'find', 'Juneteenth is a national holiday in one country. Can you find the USA?', ['US']),
  q('nowruz', 'most', 'Which country has the most people celebrating Nowruz, the Persian New Year?', ['IR'],
    'In Iran, families set a table with seven special things whose Persian names start with the letter S.'),
  q('nowruz', 'doing', 'Tap a country where families celebrate Nowruz on the first day of spring.', []),
  q('mid-autumn-festival', 'most', 'Which country has the most people sharing mooncakes at the Mid-Autumn Festival?', ['CN']),
  q('mid-autumn-festival', 'find', 'In Vietnam, children carry star-shaped lanterns at the Mid-Autumn Festival. Can you find Vietnam?', ['VN']),
  q('st-patricks-day', 'began', 'Spin the globe to the country where St Patrick\'s Day began.', ['IE'],
    'Ireland! Now there are parades all over the world, and Chicago even turns its river green.'),
  q('valentines-day', 'find', 'In Japan, people give chocolate on Valentine\'s Day. Can you find Japan?', ['JP']),
  q('valentines-day', 'doing', 'Tap a country where people send Valentine\'s cards.', []),
  q('mothers-day', 'doing', 'Tap a country that has a Mother\'s Day.', []),
  q('fathers-day', 'doing', 'Tap a country that has a Father\'s Day.', []),
  q('independence-day-us', 'find', 'It is the USA\'s birthday! Can you find the USA?', ['US'],
    'There are fireworks in all 50 states on the Fourth of July.'),
  q('earth-day', 'doing', 'Earth Day is for the whole planet. Tap any country at all!', []),
  q('new-years-eve', 'find', 'In Spain, people eat twelve grapes at midnight, one for every chime of the clock. Can you find Spain?', ['ES']),
  q('new-years-eve', 'find', 'In Japan, temple bells ring 108 times on New Year\'s Eve. Can you find Japan?', ['JP']),
  // ── Tier 2
  q('three-kings-day', 'find', 'Children in Spain get presents from the Three Kings on 6 January. Can you find Spain?', ['ES']),
  q('three-kings-day', 'find', 'In Mexico, families share a ring-shaped cake called rosca de reyes. Can you find Mexico?', ['MX']),
  q('mlk-day', 'find', 'Martin Luther King Jr. Day is a holiday in the USA. Can you find the USA?', ['US']),
  q('groundhog-day', 'doing', 'Tap a country where a groundhog gets to forecast the weather!', ['US', 'CA']),
  q('lantern-festival', 'most', 'Which country has the most people lighting lanterns at the Lantern Festival?', ['CN']),
  q('pancake-day', 'find', 'In France, Pancake Day is called Mardi Gras. Can you find France?', ['FR']),
  q('pancake-day', 'find', 'Brazil\'s giant Carnival ends on the very same Tuesday! Can you find Brazil?', ['BR']),
  q('purim', 'find', 'In Israel, children dress up in costumes for Purim. Can you find Israel?', ['IL']),
  q('passover', 'doing', 'Tap a country where Jewish families gather for the Passover seder.', []),
  q('ramadan', 'find', 'In Egypt, children carry colorful lanterns called fanous in Ramadan. Can you find Egypt?', ['EG']),
  q('ramadan', 'doing', 'Tap a country where Muslim families celebrate Ramadan.', []),
  q('orthodox-easter', 'find', 'In Greece, people crack red-dyed eggs together at Easter. Can you find Greece?', ['GR']),
  q('april-fools-day', 'find', 'In France, people stick paper fish on their friends\' backs on 1 April! Can you find France?', ['FR']),
  q('songkran', 'doing', 'Tap a country where people celebrate Songkran with water fights.', ['TH', 'LA', 'KH', 'MM'],
    'Thailand, Laos, Cambodia and Myanmar all splash water to wash away the old year.'),
  q('songkran', 'find', 'Songkran is the New Year in Thailand. Can you find Thailand?', ['TH']),
  q('cinco-de-mayo', 'began', 'Cinco de Mayo remembers a battle in 1862. Spin the globe to the country where it happened!', ['MX'],
    'It happened near the city of Puebla in Mexico. Now it is a big party in the USA too.'),
  q('childrens-day-japan', 'find', 'In Japan, families fly carp-shaped streamers for Children\'s Day. Can you find Japan?', ['JP']),
  q('eid-al-adha', 'find', 'In Turkey, Eid al-Adha is called Kurban Bayramı. Can you find Turkey?', ['TR']),
  q('eid-al-adha', 'doing', 'Tap a country where families share a feast for Eid al-Adha.', []),
  q('dragon-boat-festival', 'began', 'Spin the globe to the country where dragon boat racing began.', ['CN'],
    'China! Teams paddle long boats with dragon heads while drummers keep the beat.'),
  q('canada-day', 'find', 'It is Canada\'s birthday! Can you find Canada?', ['CA'],
    'Canada is the second-biggest country in the whole world.'),
  q('bastille-day', 'find', 'Bastille Day is France\'s national day. Can you find France?', ['FR'],
    'There is a big parade in Paris and fireworks at the Eiffel Tower.'),
  q('independence-day-india', 'find', 'On 15 August, India flies kites to celebrate. Can you find India?', ['IN']),
  q('labor-day', 'doing', 'Tap a country that takes the first Monday of September off for Labor Day.', ['US', 'CA']),
  q('independence-day-mexico', 'find', 'Mexico shouts "¡Viva México!" on the night of 15 September. Can you find Mexico?', ['MX']),
  q('chuseok', 'find', 'Chuseok is Korea\'s harvest moon festival. Can you find Korea?', ['KR', 'KP']),
  q('rosh-hashanah', 'doing', 'Tap a country where Jewish families dip apples in honey for Rosh Hashanah.', []),
  q('bonfire-night', 'began', 'Bonfire Night began in this country in 1605. Spin the globe to it!', ['GB'],
    'The United Kingdom! Fireworks light up the sky every 5 November.'),
  q('st-nicholas-day', 'find', 'In the Netherlands, St Nicholas is called Sinterklaas. Can you find the Netherlands?', ['NL']),
  q('st-nicholas-day', 'doing', 'Tap a country where children leave out their shoes for St Nicholas.', []),
  q('boxing-day', 'doing', 'Tap a country where Boxing Day is a holiday.', []),
];

/** Holidays whose plain "celebrate" question would be odd (somber days, or the whole world). */
const NO_PLAIN = new Set(['memorial-day', 'indigenous-peoples-day', 'leap-day', 'pi-day', 'new-years-day', 'new-years-eve']);

export function hasPlainQuestion(id: string): boolean {
  return !NO_PLAIN.has(id);
}

// ───────────────────────────────────────────── kid-friendly country names

/** Natural Earth abbreviates ("Dem. Rep. Congo"); children read the full name. */
const FRIENDLY: Readonly<Record<string, string>> = {
  US: 'USA', GB: 'United Kingdom', BA: 'Bosnia and Herzegovina', CD: 'DR Congo', CF: 'Central African Republic',
  DO: 'Dominican Republic', EH: 'Western Sahara', FK: 'Falkland Islands', GQ: 'Equatorial Guinea', SB: 'Solomon Islands',
  SS: 'South Sudan', SZ: 'Eswatini', TF: 'French Southern Lands',
};

/** Names that take "the" in a sentence: "That's the USA". */
const THE = new Set(['US', 'GB', 'AE', 'NL', 'PH', 'CD', 'CF', 'DO', 'BS', 'GM', 'SB', 'FK']);

/** "USA", "United Kingdom", "Nepal" — for buttons and labels. */
export function countryLabel(iso: string): string {
  return FRIENDLY[iso] ?? COUNTRY_NAMES[iso] ?? iso;
}

/** "the USA", "Nepal" — for the middle of a sentence. */
export function countryPhrase(iso: string): string {
  return THE.has(iso) ? `the ${countryLabel(iso)}` : countryLabel(iso);
}

/** "The USA", "Nepal" — for the start of a sentence. */
export function countryPhraseStart(iso: string): string {
  const p = countryPhrase(iso);
  return p.charAt(0).toUpperCase() + p.slice(1);
}

/**
 * Countries a seven-year-old has a fair chance of having heard of, used as the other choices in
 * "Choose from a list" so the list is a real choice and not a maze of tiny places.
 */
export const WELL_KNOWN: readonly string[] = [
  'US', 'CA', 'MX', 'BR', 'AR', 'CL', 'PE', 'CO', 'GB', 'IE', 'FR', 'ES', 'PT', 'IT', 'DE', 'NL', 'SE', 'NO', 'FI', 'PL',
  'GR', 'RU', 'UA', 'TR', 'EG', 'MA', 'NG', 'KE', 'ZA', 'ET', 'SA', 'IR', 'IN', 'PK', 'CN', 'JP', 'KR', 'VN', 'TH', 'ID',
  'PH', 'AU', 'NZ', 'MN', 'KZ', 'IS', 'GL', 'MG',
];
