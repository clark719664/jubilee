/**
 * Where each holiday is a public holiday or widely celebrated, as ISO2 codes that have an
 * outline in `countries.ts` (the test enforces this). Lists are generous but honest: the
 * first code is the "home" the globe centers on, and `focus` overrides that for holidays
 * that belong to the whole planet. Places too small to draw (Singapore, Hong Kong,
 * Mauritius…) get a mention in the kid-level `note` instead.
 */
import { COUNTRY_NAMES } from './countries';

export interface Celebrated {
  readonly countries: readonly string[];
  /** One kid-level sentence. */
  readonly note: string;
  /** [lon, lat] to center the globe on instead of the first country. */
  readonly focus?: readonly [number, number];
}

const WORLD: readonly string[] = Object.keys(COUNTRY_NAMES);

const EUROPE_WEST = ['GB', 'IE', 'FR', 'DE', 'ES', 'PT', 'IT', 'NL', 'BE', 'LU', 'CH', 'AT', 'DK', 'NO', 'SE', 'FI', 'IS', 'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'LT', 'LV', 'EE'];
const EUROPE_ORTHODOX = ['GR', 'CY', 'RU', 'UA', 'BY', 'MD', 'RO', 'BG', 'RS', 'ME', 'MK', 'BA', 'GE'];
const AMERICAS = ['US', 'CA', 'MX', 'GT', 'BZ', 'HN', 'SV', 'NI', 'CR', 'PA', 'CU', 'JM', 'HT', 'DO', 'PR', 'BS', 'TT', 'CO', 'VE', 'GY', 'SR', 'EC', 'PE', 'BO', 'BR', 'PY', 'UY', 'AR', 'CL', 'FK', 'GL'];
const OCEANIA = ['AU', 'NZ', 'PG', 'SB', 'VU', 'FJ', 'NC'];
const AFRICA_CHRISTIAN = ['NG', 'GH', 'KE', 'ZA', 'ET', 'ER', 'TZ', 'UG', 'RW', 'BI', 'CD', 'CG', 'CM', 'CF', 'GA', 'GQ', 'AO', 'ZM', 'ZW', 'MW', 'MZ', 'MG', 'NA', 'BW', 'LS', 'SZ', 'CI', 'LR', 'SL', 'GM', 'SN', 'GN', 'GW', 'TG', 'BJ', 'BF', 'ML', 'NE', 'TD', 'SS', 'SD'];
const ASIA_CHRISTMAS = ['PH', 'TL', 'LK', 'IN', 'PK', 'BD', 'NP', 'MM', 'MY', 'ID', 'KR', 'JP', 'VN', 'LB', 'SY', 'JO', 'IQ', 'PS', 'KZ', 'KG', 'AM'];
const MUSLIM = ['SA', 'EG', 'ID', 'PK', 'BD', 'TR', 'IR', 'IQ', 'MA', 'DZ', 'TN', 'LY', 'SD', 'SS', 'MR', 'ML', 'NE', 'TD', 'SN', 'GM', 'GN', 'GW', 'SL', 'BF', 'NG', 'SO', 'DJ', 'ER', 'ET', 'KE', 'TZ', 'UG', 'CM', 'CI', 'TG', 'BJ', 'CF', 'LR', 'GH', 'YE', 'OM', 'AE', 'QA', 'KW', 'JO', 'SY', 'LB', 'PS', 'AZ', 'KZ', 'KG', 'UZ', 'TJ', 'TM', 'AF', 'MY', 'BN', 'AL', 'XK', 'BA', 'MK', 'ME', 'CY', 'IN', 'LK', 'NP', 'MM', 'PH', 'FJ', 'TT', 'GY', 'SR', 'RU', 'CN', 'GB', 'FR', 'DE', 'US', 'CA', 'AU'];
const JEWISH = ['IL', 'US', 'CA', 'GB', 'FR', 'AR', 'AU', 'ZA', 'BR', 'RU', 'DE', 'UA', 'HU', 'MX'];
const HINDU = ['IN', 'NP', 'LK', 'MY', 'FJ', 'TT', 'GY', 'SR', 'MM', 'BD', 'GB', 'US', 'CA', 'ZA', 'AU', 'AE'];
const LUNAR = ['CN', 'TW', 'VN', 'KR', 'KP', 'MY', 'ID', 'PH', 'BN', 'MN', 'TH', 'US', 'CA', 'AU'];
const MOTHERS = [...AMERICAS, ...EUROPE_WEST, ...EUROPE_ORTHODOX, ...OCEANIA, 'JP', 'CN', 'TW', 'KR', 'PH', 'IN', 'TH', 'VN', 'MY', 'ID', 'TR', 'EG', 'ZA', 'KE', 'NG', 'GH', 'UG', 'ZM', 'ZW', 'ET', 'IL', 'LB', 'JO', 'AE', 'SA', 'PK', 'BD', 'LK', 'NP'];
const FATHERS = [...AMERICAS, ...EUROPE_WEST, ...OCEANIA, 'JP', 'CN', 'TW', 'KR', 'PH', 'IN', 'TH', 'MY', 'ID', 'TR', 'ZA', 'KE', 'NG', 'GH', 'RU', 'UA', 'GR', 'RO', 'BG', 'AE', 'PK', 'BD', 'LK', 'NP', 'EG'];
const VALENTINE = [...AMERICAS, ...EUROPE_WEST, ...EUROPE_ORTHODOX, ...OCEANIA, 'JP', 'KR', 'TW', 'CN', 'PH', 'TH', 'VN', 'IN', 'ZA', 'NG', 'KE', 'GH', 'EG', 'LB', 'TR', 'IL', 'AE', 'AL', 'XK'];

function uniq(codes: readonly string[]): readonly string[] {
  return Array.from(new Set(codes));
}

function entry(countries: readonly string[], note: string, focus?: readonly [number, number]): Celebrated {
  const list = uniq(countries);
  return focus ? { countries: list, note, focus } : { countries: list, note };
}

const EVERYWHERE = entry(WORLD, 'Anyone, anywhere can join in — it is a just-for-fun day.', [0, 15]);
const US_SILLY = (why: string): Celebrated => entry(['US', 'CA', 'GB', 'AU', 'NZ', 'IE'], why);
const UN_DAY = (why: string): Celebrated => entry(WORLD, why, [0, 15]);

export const CELEBRATED: Readonly<Record<string, Celebrated>> = {
  // ── Tier 1
  christmas: entry(
    [...EUROPE_WEST, ...AMERICAS, ...OCEANIA, ...AFRICA_CHRISTIAN, ...ASIA_CHRISTMAS, ...EUROPE_ORTHODOX, 'AL'],
    'Families in nearly every country hang lights, share food and give presents on Christmas; some, like Russia and Ethiopia, celebrate on January 7.',
    [-25, 30],
  ),
  hanukkah: entry(JEWISH, 'Jewish families light the menorah in Israel and in cities everywhere — we colored in the countries with the biggest Jewish communities.'),
  diwali: entry(HINDU, 'Celebrated by Hindu, Sikh and Jain families in India, Nepal and all over the world — it is a holiday in Singapore and Mauritius too!'),
  'eid-al-fitr': entry(MUSLIM, 'Muslim families in more than 50 countries — from Morocco to Indonesia — and in cities everywhere share sweets to end the month of Ramadan.', [45, 25]),
  'lunar-new-year': entry(LUNAR, 'The biggest holiday of the year in China, Vietnam, Korea and across East and South-East Asia, plus Chinatowns around the world (and Singapore and Hong Kong, too small to color in).'),
  halloween: entry(
    ['US', 'CA', 'GB', 'IE', 'AU', 'NZ', 'JP', 'DE', 'FR', 'ES', 'IT', 'SE', 'NO', 'DK', 'FI', 'NL', 'BE', 'PT', 'RO', 'KR', 'PH', 'BR', 'AR', 'CL', 'MX'],
    'Trick-or-treating started in Ireland and Scotland and is now big in the Americas, Britain, Japan and more places every year.',
    [-40, 35],
  ),
  thanksgiving: entry(['US', 'CA', 'LR'], 'The USA feasts on the fourth Thursday of November, Canada on the second Monday of October, and Liberia in early November.'),
  easter: entry(
    [...EUROPE_WEST, ...AMERICAS, ...OCEANIA, ...AFRICA_CHRISTIAN, 'PH', 'TL', 'LK', 'IN', 'ID', 'MY', 'KR', 'LB', 'SY', 'JO', 'PS', 'AL', 'AM'],
    'Christian families on every continent hunt eggs on Easter Sunday; Orthodox countries usually celebrate on a different Sunday.',
    [-20, 25],
  ),
  holi: entry(['IN', 'NP', 'FJ', 'GY', 'SR', 'TT', 'BD'], 'The festival of colors is celebrated in India, Nepal and wherever Hindu families live — it is a holiday in Guyana and Trinidad too.'),
  'day-of-the-dead': entry(['MX', 'GT', 'SV', 'HN', 'NI', 'EC', 'BO', 'PE', 'BR', 'US', 'PH', 'HT'], "Mexico's Día de los Muertos has cousins across Latin America, Brazil, the Philippines (Undas) and Haiti."),
  kwanzaa: entry(['US', 'CA'], 'Kwanzaa began in the USA in 1966 and is celebrated by African-American families there and in Canada.'),
  juneteenth: entry(['US'], 'Juneteenth remembers June 19, 1865, when the last enslaved people in Texas learned they were free — it is a national holiday in the USA.'),
  nowruz: entry(['IR', 'AF', 'AZ', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'IQ', 'TR', 'AL'], 'The Persian New Year is celebrated from Iran and Afghanistan across Central Asia, and by Kurdish and Albanian families.'),
  'mid-autumn-festival': entry(['CN', 'TW', 'VN', 'KR', 'KP', 'MY', 'JP'], 'On the brightest full moon of fall, families in China, Vietnam, Korea, Japan and across East Asia share mooncakes (Singapore and Hong Kong too).'),
  'st-patricks-day': entry(['IE', 'GB', 'US', 'CA', 'AU', 'NZ'], "Ireland's big day, with parades in Britain, the USA, Canada, Australia and New Zealand turning rivers and fountains green."),
  'valentines-day': entry(VALENTINE, 'Cards and hearts fly around most of the world on February 14.', [0, 30]),
  'mothers-day': entry(MOTHERS, 'Almost every country has a Mother\'s Day — just not always on the same Sunday!', [0, 20]),
  'fathers-day': entry(FATHERS, 'Dads get breakfast in bed across the world, though the date hops around the calendar.', [0, 20]),
  'independence-day-us': entry(['US', 'PR'], "The USA's birthday party, with fireworks in all 50 states and Puerto Rico."),
  'earth-day': entry(WORLD, 'Everyone on Earth is invited — that is the whole point.', [0, 10]),
  'pi-day': entry(WORLD, 'Math fans everywhere eat pie on 3/14, the American way of writing March 14.', [-60, 30]),
  'new-years-eve': entry(WORLD, 'The world counts down one time zone at a time, starting in Kiritimati and ending in American Samoa 26 hours later.', [170, 0]),
  // ── Tier 2
  'new-years-day': entry(WORLD, 'January 1 is a holiday in nearly every country on Earth.', [170, 0]),
  'three-kings-day': entry(['ES', 'MX', 'FR', 'IT', 'DE', 'AT', 'CH', 'PL', 'HR', 'SK', 'SI', 'SE', 'FI', 'GR', 'CY', 'CO', 'VE', 'DO', 'PR', 'CU', 'AR', 'UY', 'PY', 'PE', 'EC', 'BO', 'GT', 'PT', 'BR', 'PH'], 'Children in Spain, Mexico, Latin America, France and Italy get gifts (and a special cake) when the Three Kings arrive.'),
  'mlk-day': entry(['US'], 'The USA honors Dr Martin Luther King Jr. on the third Monday of January.'),
  'groundhog-day': entry(['US', 'CA'], 'Only in the USA and Canada does a groundhog get to forecast the weather.'),
  'lantern-festival': entry(['CN', 'TW', 'VN', 'MY'], 'The last night of Lunar New Year lights up China, Taiwan, Vietnam and Malaysia with lanterns and riddles.'),
  'pancake-day': entry(['GB', 'IE', 'AU', 'NZ', 'CA', 'US', 'FR', 'BR', 'TT', 'IT', 'DE', 'BE', 'ES', 'PT'], 'Pancakes in Britain and Ireland, Mardi Gras in New Orleans, Carnival in Brazil, Trinidad and Venice — all on the same Tuesday!'),
  'leap-day': entry(WORLD, 'February 29 shows up everywhere on Earth, but only once every four years.', [0, 15]),
  purim: entry(JEWISH, 'Jewish families in Israel and around the world dress up and share hamantaschen.'),
  passover: entry(JEWISH, 'Jewish families in Israel and around the world gather for the seder meal.'),
  ramadan: entry(MUSLIM, 'A month of daytime fasting for Muslim families in more than 50 countries and in communities everywhere.', [45, 25]),
  'orthodox-easter': entry([...EUROPE_ORTHODOX, 'ET', 'ER', 'EG'], 'Orthodox Christian countries from Greece and Russia to Ethiopia and Egypt celebrate Easter by the older calendar.'),
  'april-fools-day': entry([...EUROPE_WEST, ...AMERICAS, ...OCEANIA, 'IN', 'JP', 'KR', 'PH', 'ZA', 'RU', 'UA', 'GR', 'RO'], 'Pranks are played all over the world — in France you might get a paper fish stuck to your back!', [-20, 35]),
  songkran: entry(['TH', 'LA', 'KH', 'MM', 'LK', 'NP', 'BD', 'IN'], "Thailand's water-fight New Year; Laos, Cambodia, Myanmar, Sri Lanka, Nepal, Bangladesh and parts of India start their new year the same week."),
  'cinco-de-mayo': entry(['MX', 'US'], 'Remembers a Mexican victory in 1862 and is a big party in the USA too.'),
  'childrens-day-japan': entry(['JP'], 'Japan flies carp streamers for Kodomo no Hi on May 5.'),
  'eid-al-adha': entry(MUSLIM, 'Muslim families in more than 50 countries and in communities everywhere share a feast and give to people in need.', [45, 25]),
  'dragon-boat-festival': entry(['CN', 'TW', 'VN'], 'Drums and dragon boats race in China, Taiwan and Vietnam (and in Hong Kong and Singapore too).'),
  'memorial-day': entry(['US'], 'The USA remembers people who died serving in the military on the last Monday of May.'),
  'canada-day': entry(['CA'], "Canada's birthday party on July 1, with fireworks from coast to coast to coast."),
  'bastille-day': entry(['FR', 'NC'], "France's national day, with a parade in Paris and fireworks everywhere French is spoken."),
  'independence-day-india': entry(['IN'], 'India flies kites and its flag on August 15.'),
  'labor-day': entry(['US', 'CA'], 'The USA and Canada take the first Monday of September off — most of the world celebrates workers on May 1 instead.'),
  'grandparents-day': entry(['US', 'CA', 'GB', 'IT', 'PL', 'FR', 'AU'], 'The USA started it; many countries now have their own day for grandparents.'),
  'independence-day-mexico': entry(['MX', 'US'], "Mexico shouts '¡Viva México!' on the night of September 15, with parties in Mexican-American communities too."),
  chuseok: entry(['KR', 'KP'], "Korea's harvest moon festival, celebrated in both South and North Korea."),
  'rosh-hashanah': entry(JEWISH, 'The Jewish New Year, with apples dipped in honey in Israel and around the world.'),
  'indigenous-peoples-day': entry(['US'], 'A growing number of US states and cities honor Native American peoples on the second Monday of October.'),
  'bonfire-night': entry(['GB', 'NZ'], 'Britain (and New Zealand) light bonfires and fireworks on November 5.'),
  'st-nicholas-day': entry(['DE', 'NL', 'BE', 'AT', 'CH', 'FR', 'LU', 'CZ', 'SK', 'PL', 'HU', 'HR', 'SI', 'RO', 'UA', 'IT'], 'Children in Germany, the Netherlands, Belgium, France and central Europe leave out shoes for St Nicholas on December 6.'),
  'boxing-day': entry(['GB', 'IE', 'CA', 'AU', 'NZ', 'ZA', 'NG', 'GH', 'KE', 'TZ', 'UG', 'ZM', 'ZW', 'MW', 'BW', 'NA', 'FJ', 'TT', 'JM', 'BS', 'BZ', 'GY', 'PG', 'SB', 'VU'], 'The day after Christmas is a holiday across the Commonwealth, from Britain and Canada to Kenya and Fiji.'),
  // ── Tier 3 silly days
  'squirrel-day': US_SILLY('Started in the USA in 2001; squirrel fans everywhere can join in.'),
  'puzzle-day': US_SILLY('Started in the USA; puzzle fans everywhere join in.'),
  'pizza-day': US_SILLY('Started in the USA; pizza fans everywhere join in.'),
  'kind-acts-day': entry(['US', 'NZ', 'CA', 'GB', 'AU', 'IE'], 'Started in the USA and New Zealand; kindness works everywhere.'),
  'tooth-fairy-day': US_SILLY('Started in the USA; the tooth fairy visits wherever wobbly teeth fall out.'),
  'wildlife-day': UN_DAY('A United Nations day for the wild animals and plants of the whole planet.'),
  'happiness-day': UN_DAY('A United Nations day — every country is invited to be happy.'),
  'book-day': UN_DAY('A UNESCO day for books and reading, celebrated by schools all over the world.'),
  'star-wars-day': EVERYWHERE,
  'bee-day': UN_DAY('A United Nations day for bees and all the other busy pollinators.'),
  'childrens-day': entry(['CN', 'RU', 'UA', 'BY', 'KZ', 'KG', 'UZ', 'TJ', 'TM', 'AZ', 'AM', 'GE', 'MD', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'RS', 'BA', 'ME', 'MK', 'LT', 'LV', 'EE', 'PT', 'MZ', 'AO', 'VN', 'KH', 'LA', 'MM', 'MN', 'KP', 'ET', 'TZ', 'NG'], 'Celebrated on June 1 in China, Russia, much of Eastern Europe and many other countries — other countries pick their own day for children.'),
  'donut-day': US_SILLY('Started in the USA in 1938 to thank the volunteers who handed out doughnuts to soldiers — everyone is welcome now.'),
  'oceans-day': UN_DAY('A United Nations day for the oceans that cover most of our planet.'),
  'emoji-day': EVERYWHERE,
  'ice-cream-day': US_SILLY('A US day since 1984, but ice cream is loved everywhere.'),
  'pi-approximation-day': EVERYWHERE,
  'friendship-day': UN_DAY('A United Nations day for friends everywhere.'),
  'left-handers-day': EVERYWHERE,
  'dot-day': EVERYWHERE,
  'pirate-day': US_SILLY('Started in the USA as a joke; pirates everywhere say Arr.'),
  'smile-day': EVERYWHERE,
  'animal-day': UN_DAY('Celebrated worldwide on October 4, the feast day of St Francis, friend of animals.'),
  'kindness-day': EVERYWHERE,
  'hello-day': EVERYWHERE,
};

/** Holiday ids celebrated in `iso`, excluding the world-wide ones unless `includeWorld`. */
export function holidaysCelebratedIn(iso: string, includeWorld = false): string[] {
  const out: string[] = [];
  for (const [id, c] of Object.entries(CELEBRATED)) {
    if (!includeWorld && c.countries.length >= WORLD.length - 5) continue;
    if (c.countries.includes(iso)) out.push(id);
  }
  return out;
}

/** True when the holiday is colored on (nearly) the whole map. */
export function isWorldwide(id: string): boolean {
  const c = CELEBRATED[id];
  return c !== undefined && c.countries.length >= WORLD.length - 5;
}
