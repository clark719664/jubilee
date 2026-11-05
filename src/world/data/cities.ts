/**
 * Cities for the World view: the New Year wave, Santa's stops, the "right now" clock row
 * and the day/night counter. Every UTC offset from +14 (Kiritimati) to −11 (Pago Pago) is
 * covered, including the half- and quarter-hour zones, both hemispheres and all continents.
 * `pop` is a rough metro population in millions (it only feeds Santa's present counter).
 * Coordinates are to 2 decimals and were checked by hand: this is a kids' map, so Sydney
 * must not be in the ocean.
 */
export interface City {
  readonly id: string;
  readonly name: string;
  /** ISO 3166-1 alpha-2. */
  readonly country: string;
  readonly lat: number;
  readonly lon: number;
  /** IANA time zone. */
  readonly tz: string;
  /** Flag emoji derived from the country code. */
  readonly emoji?: string;
  /** Rough metro population, millions. */
  readonly pop: number;
}

/** 🇯🇵-style flag from an ISO2 code (regional indicator pairs). */
export function flagEmoji(iso2: string): string | undefined {
  if (!/^[A-Z]{2}$/.test(iso2) || iso2 === 'XK') return undefined;
  const a = iso2.charCodeAt(0) - 65 + 0x1f1e6;
  const b = iso2.charCodeAt(1) - 65 + 0x1f1e6;
  return String.fromCodePoint(a, b);
}

function city(id: string, name: string, country: string, lat: number, lon: number, tz: string, pop: number): City {
  const emoji = flagEmoji(country);
  return emoji === undefined ? { id, name, country, lat, lon, tz, pop } : { id, name, country, lat, lon, tz, emoji, pop };
}

export const CITIES: readonly City[] = [
  // ── Pacific, east of the date line but a day ahead (UTC+14 … +12:45)
  city('kiritimati', 'Kiritimati', 'KI', 1.87, -157.43, 'Pacific/Kiritimati', 0.01),
  city('apia', 'Apia', 'WS', -13.83, -171.76, 'Pacific/Apia', 0.04),
  city('nukualofa', "Nuku'alofa", 'TO', -21.14, -175.2, 'Pacific/Tongatapu', 0.03),
  city('auckland', 'Auckland', 'NZ', -36.85, 174.76, 'Pacific/Auckland', 1.7),
  city('chatham', 'Chatham Islands', 'NZ', -43.95, -176.55, 'Pacific/Chatham', 0.001),
  // ── UTC+12 … +10
  city('suva', 'Suva', 'FJ', -18.14, 178.44, 'Pacific/Fiji', 0.2),
  city('anadyr', 'Anadyr', 'RU', 64.73, 177.51, 'Asia/Anadyr', 0.02),
  city('noumea', 'Nouméa', 'NC', -22.28, 166.46, 'Pacific/Noumea', 0.2),
  city('honiara', 'Honiara', 'SB', -9.43, 159.95, 'Pacific/Guadalcanal', 0.1),
  city('port-vila', 'Port Vila', 'VU', -17.73, 168.32, 'Pacific/Efate', 0.05),
  city('sydney', 'Sydney', 'AU', -33.87, 151.21, 'Australia/Sydney', 5.3),
  city('melbourne', 'Melbourne', 'AU', -37.81, 144.96, 'Australia/Melbourne', 5.1),
  city('brisbane', 'Brisbane', 'AU', -27.47, 153.03, 'Australia/Brisbane', 2.6),
  city('adelaide', 'Adelaide', 'AU', -34.93, 138.6, 'Australia/Adelaide', 1.4),
  city('port-moresby', 'Port Moresby', 'PG', -9.44, 147.18, 'Pacific/Port_Moresby', 0.4),
  city('vladivostok', 'Vladivostok', 'RU', 43.12, 131.89, 'Asia/Vladivostok', 0.6),
  city('darwin', 'Darwin', 'AU', -12.46, 130.84, 'Australia/Darwin', 0.15),
  // ── UTC+9 … +8
  city('tokyo', 'Tokyo', 'JP', 35.68, 139.69, 'Asia/Tokyo', 37),
  city('seoul', 'Seoul', 'KR', 37.57, 126.98, 'Asia/Seoul', 26),
  city('pyongyang', 'Pyongyang', 'KP', 39.02, 125.75, 'Asia/Pyongyang', 3),
  city('eucla', 'Eucla', 'AU', -31.68, 128.88, 'Australia/Eucla', 0.0001),
  city('beijing', 'Beijing', 'CN', 39.9, 116.4, 'Asia/Shanghai', 21),
  city('shanghai', 'Shanghai', 'CN', 31.23, 121.47, 'Asia/Shanghai', 29),
  city('hong-kong', 'Hong Kong', 'HK', 22.32, 114.17, 'Asia/Hong_Kong', 7.5),
  city('taipei', 'Taipei', 'TW', 25.03, 121.57, 'Asia/Taipei', 7),
  city('manila', 'Manila', 'PH', 14.6, 120.98, 'Asia/Manila', 14),
  city('singapore', 'Singapore', 'SG', 1.35, 103.82, 'Asia/Singapore', 5.9),
  city('kuala-lumpur', 'Kuala Lumpur', 'MY', 3.14, 101.69, 'Asia/Kuala_Lumpur', 8),
  city('perth', 'Perth', 'AU', -31.95, 115.86, 'Australia/Perth', 2.2),
  city('ulaanbaatar', 'Ulaanbaatar', 'MN', 47.92, 106.92, 'Asia/Ulaanbaatar', 1.6),
  city('bandar-seri-begawan', 'Bandar Seri Begawan', 'BN', 4.9, 114.94, 'Asia/Brunei', 0.1),
  // ── UTC+7 … +5
  city('bangkok', 'Bangkok', 'TH', 13.76, 100.5, 'Asia/Bangkok', 11),
  city('hanoi', 'Hanoi', 'VN', 21.03, 105.85, 'Asia/Ho_Chi_Minh', 8),
  city('jakarta', 'Jakarta', 'ID', -6.21, 106.85, 'Asia/Jakarta', 34),
  city('phnom-penh', 'Phnom Penh', 'KH', 11.56, 104.92, 'Asia/Phnom_Penh', 2.3),
  city('yangon', 'Yangon', 'MM', 16.87, 96.2, 'Asia/Yangon', 5.5),
  city('dhaka', 'Dhaka', 'BD', 23.81, 90.41, 'Asia/Dhaka', 23),
  city('kathmandu', 'Kathmandu', 'NP', 27.72, 85.32, 'Asia/Kathmandu', 3),
  city('delhi', 'Delhi', 'IN', 28.61, 77.21, 'Asia/Kolkata', 33),
  city('mumbai', 'Mumbai', 'IN', 19.08, 72.88, 'Asia/Kolkata', 21),
  city('kolkata', 'Kolkata', 'IN', 22.57, 88.36, 'Asia/Kolkata', 15),
  city('chennai', 'Chennai', 'IN', 13.08, 80.27, 'Asia/Kolkata', 11),
  city('colombo', 'Colombo', 'LK', 6.93, 79.86, 'Asia/Colombo', 2.5),
  city('karachi', 'Karachi', 'PK', 24.86, 67.01, 'Asia/Karachi', 20),
  city('lahore', 'Lahore', 'PK', 31.55, 74.34, 'Asia/Karachi', 13),
  city('tashkent', 'Tashkent', 'UZ', 41.3, 69.24, 'Asia/Tashkent', 2.9),
  city('almaty', 'Almaty', 'KZ', 43.24, 76.95, 'Asia/Almaty', 2),
  // ── UTC+4:30 … +3
  city('kabul', 'Kabul', 'AF', 34.53, 69.17, 'Asia/Kabul', 4.6),
  city('dubai', 'Dubai', 'AE', 25.2, 55.27, 'Asia/Dubai', 3.5),
  city('baku', 'Baku', 'AZ', 40.41, 49.87, 'Asia/Baku', 2.4),
  city('port-louis', 'Port Louis', 'MU', -20.16, 57.5, 'Indian/Mauritius', 0.15),
  city('tehran', 'Tehran', 'IR', 35.69, 51.39, 'Asia/Tehran', 9.5),
  city('moscow', 'Moscow', 'RU', 55.76, 37.62, 'Europe/Moscow', 13),
  city('riyadh', 'Riyadh', 'SA', 24.71, 46.68, 'Asia/Riyadh', 7.7),
  city('baghdad', 'Baghdad', 'IQ', 33.32, 44.37, 'Asia/Baghdad', 7.5),
  city('istanbul', 'Istanbul', 'TR', 41.01, 28.98, 'Europe/Istanbul', 16),
  city('nairobi', 'Nairobi', 'KE', -1.29, 36.82, 'Africa/Nairobi', 5),
  city('addis-ababa', 'Addis Ababa', 'ET', 9.02, 38.75, 'Africa/Addis_Ababa', 5.5),
  // ── UTC+2
  city('cairo', 'Cairo', 'EG', 30.04, 31.24, 'Africa/Cairo', 22),
  city('jerusalem', 'Jerusalem', 'IL', 31.77, 35.22, 'Asia/Jerusalem', 1),
  city('athens', 'Athens', 'GR', 37.98, 23.73, 'Europe/Athens', 3.2),
  city('johannesburg', 'Johannesburg', 'ZA', -26.2, 28.05, 'Africa/Johannesburg', 6),
  city('cape-town', 'Cape Town', 'ZA', -33.93, 18.42, 'Africa/Johannesburg', 4.8),
  city('kyiv', 'Kyiv', 'UA', 50.45, 30.52, 'Europe/Kyiv', 3),
  // ── UTC+1
  city('rome', 'Rome', 'IT', 41.9, 12.5, 'Europe/Rome', 4.3),
  city('paris', 'Paris', 'FR', 48.86, 2.35, 'Europe/Paris', 11),
  city('berlin', 'Berlin', 'DE', 52.52, 13.41, 'Europe/Berlin', 3.8),
  city('madrid', 'Madrid', 'ES', 40.42, -3.7, 'Europe/Madrid', 6.7),
  city('amsterdam', 'Amsterdam', 'NL', 52.37, 4.9, 'Europe/Amsterdam', 1.2),
  city('warsaw', 'Warsaw', 'PL', 52.23, 21.01, 'Europe/Warsaw', 1.8),
  city('stockholm', 'Stockholm', 'SE', 59.33, 18.07, 'Europe/Stockholm', 1.7),
  city('oslo', 'Oslo', 'NO', 59.91, 10.75, 'Europe/Oslo', 1.1),
  city('copenhagen', 'Copenhagen', 'DK', 55.68, 12.57, 'Europe/Copenhagen', 1.4),
  city('lagos', 'Lagos', 'NG', 6.52, 3.38, 'Africa/Lagos', 16),
  city('kinshasa', 'Kinshasa', 'CD', -4.44, 15.27, 'Africa/Kinshasa', 16),
  city('casablanca', 'Casablanca', 'MA', 33.57, -7.59, 'Africa/Casablanca', 3.7),
  // ── UTC+0
  city('london', 'London', 'GB', 51.51, -0.13, 'Europe/London', 9.6),
  city('dublin', 'Dublin', 'IE', 53.35, -6.26, 'Europe/Dublin', 1.4),
  city('lisbon', 'Lisbon', 'PT', 38.72, -9.14, 'Europe/Lisbon', 2.9),
  city('reykjavik', 'Reykjavík', 'IS', 64.15, -21.94, 'Atlantic/Reykjavik', 0.2),
  city('accra', 'Accra', 'GH', 5.6, -0.19, 'Africa/Accra', 2.6),
  city('dakar', 'Dakar', 'SN', 14.72, -17.47, 'Africa/Dakar', 3.3),
  // ── UTC−1
  city('praia', 'Praia', 'CV', 14.93, -23.51, 'Atlantic/Cape_Verde', 0.16),
  // ── UTC−2 … −3:30
  city('nuuk', 'Nuuk', 'GL', 64.18, -51.72, 'America/Nuuk', 0.02),
  city('sao-paulo', 'São Paulo', 'BR', -23.55, -46.63, 'America/Sao_Paulo', 22),
  city('rio', 'Rio de Janeiro', 'BR', -22.91, -43.17, 'America/Sao_Paulo', 13),
  city('buenos-aires', 'Buenos Aires', 'AR', -34.6, -58.38, 'America/Argentina/Buenos_Aires', 15),
  city('santiago', 'Santiago', 'CL', -33.45, -70.67, 'America/Santiago', 7),
  city('st-johns', "St. John's", 'CA', 47.56, -52.71, 'America/St_Johns', 0.2),
  // ── UTC−4
  city('caracas', 'Caracas', 'VE', 10.48, -66.9, 'America/Caracas', 2.9),
  city('san-juan', 'San Juan', 'PR', 18.47, -66.11, 'America/Puerto_Rico', 2.4),
  city('port-of-spain', 'Port of Spain', 'TT', 10.65, -61.52, 'America/Port_of_Spain', 0.6),
  // ── UTC−5
  city('new-york', 'New York', 'US', 40.71, -74.01, 'America/New_York', 19),
  city('washington', 'Washington, D.C.', 'US', 38.91, -77.04, 'America/New_York', 6.3),
  city('toronto', 'Toronto', 'CA', 43.65, -79.38, 'America/Toronto', 6.4),
  city('montreal', 'Montréal', 'CA', 45.5, -73.57, 'America/Toronto', 4.3),
  city('havana', 'Havana', 'CU', 23.13, -82.38, 'America/Havana', 2.1),
  city('bogota', 'Bogotá', 'CO', 4.71, -74.07, 'America/Bogota', 11),
  city('lima', 'Lima', 'PE', -12.05, -77.04, 'America/Lima', 11),
  city('quito', 'Quito', 'EC', -0.18, -78.47, 'America/Guayaquil', 2.8),
  // ── UTC−6
  city('chicago', 'Chicago', 'US', 41.88, -87.63, 'America/Chicago', 8.9),
  city('houston', 'Houston', 'US', 29.76, -95.37, 'America/Chicago', 7.1),
  city('mexico-city', 'Mexico City', 'MX', 19.43, -99.13, 'America/Mexico_City', 22),
  city('oaxaca', 'Oaxaca', 'MX', 17.07, -96.73, 'America/Mexico_City', 0.7),
  city('guatemala-city', 'Guatemala City', 'GT', 14.63, -90.51, 'America/Guatemala', 3),
  // ── UTC−7 … −8
  city('denver', 'Denver', 'US', 39.74, -104.98, 'America/Denver', 3),
  city('phoenix', 'Phoenix', 'US', 33.45, -112.07, 'America/Phoenix', 4.9),
  city('los-angeles', 'Los Angeles', 'US', 34.05, -118.24, 'America/Los_Angeles', 13),
  city('san-francisco', 'San Francisco', 'US', 37.77, -122.42, 'America/Los_Angeles', 4.7),
  city('vancouver', 'Vancouver', 'CA', 49.28, -123.12, 'America/Vancouver', 2.6),
  // ── UTC−9 … −11
  city('anchorage', 'Anchorage', 'US', 61.22, -149.9, 'America/Anchorage', 0.4),
  city('marquesas', 'Taiohae (Marquesas)', 'PF', -8.91, -140.1, 'Pacific/Marquesas', 0.002),
  city('honolulu', 'Honolulu', 'US', 21.31, -157.86, 'Pacific/Honolulu', 1),
  city('pago-pago', 'Pago Pago', 'AS', -14.28, -170.7, 'Pacific/Pago_Pago', 0.05),
];

const BY_ID = new Map(CITIES.map((c) => [c.id, c]));

export function cityById(id: string): City | undefined {
  return BY_ID.get(id);
}

/** Twelve cities for the "Right now around the world" row, east to west. */
export const SHOWCASE_CITY_IDS: readonly string[] = [
  'auckland', 'sydney', 'tokyo', 'beijing', 'delhi', 'dubai', 'nairobi', 'london', 'sao-paulo', 'new-york', 'los-angeles', 'honolulu',
];

/** The North Pole, Santa's home. */
export const NORTH_POLE = { lon: 0, lat: 90 } as const;
