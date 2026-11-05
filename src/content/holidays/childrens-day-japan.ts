import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Children\'s Day, or Kodomo no Hi, is a national holiday in Japan on 5 May that celebrates children\'s health and happiness.',
    'Many families fly koinobori, big cloth carp streamers that fill with wind and look like fish swimming in the sky.',
    'Some families display a small samurai helmet, eat kashiwa-mochi rice cakes wrapped in oak leaves, and take a bath with iris leaves for good health.',
  ],
  facts: [
    {
      text: 'A legend says a carp that swims all the way up a waterfall turns into a dragon, so the carp streamers stand for being strong and never giving up.',
      wow: true,
    },
    {
      text: 'The day used to be called Boys\' Day; in 1948 Japan made 5 May a national holiday for all children, and it is the last day of the spring holidays known as Golden Week.',
      bigKids: true,
    },
    {
      text: 'On a koinobori pole the biggest carp is usually black for the father, the next is red for the mother, and a smaller carp is added for each child.',
    },
  ],
  greetings: [
    {
      lang: 'ja',
      langName: 'Japanese',
      text: 'こどもの日おめでとう',
      roman: 'Kodomo no hi omedetō',
      sayIt: 'koh-DOH-moh noh hee oh-meh-deh-TOH',
      meaning: 'Happy Children\'s Day',
    },
  ],
  recipes: [],
  crafts: [
    {
      id: 'koinobori-streamer',
      title: 'Koinobori Carp Streamer',
      emoji: '🎏',
      blurb: 'Make a paper carp with a wavy tissue-paper tail that swims in the breeze.',
      minutes: 30,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'cardboard tube', qty: '1', substitute: 'a sheet of colored paper rolled into a tube' },
        { item: 'colored paper', qty: '2 sheets' },
        { item: 'white paper', qty: '1 small piece', substitute: 'any light-colored scrap' },
        { item: 'hole punch', qty: '1', substitute: 'a sharpened pencil, used by a grown-up' },
        { item: 'tissue paper', qty: '3 strips in different colors', substitute: 'ribbon or crepe paper' },
        { item: 'glue stick', qty: '1' },
        { item: 'markers or crayons' },
        { item: 'string', qty: '30 cm' },
        { item: 'safety scissors', qty: '1 pair' },
      ],
      steps: [
        { text: 'Wrap a sheet of colored paper around the tube and glue it down so the tube is bright all over.' },
        { text: 'Draw rows of curved scales along the tube with markers, like a fish.' },
        { text: 'Cut two circles from white paper for eyes and glue them near one end of the tube.', adult: true, hazards: ['sharp'] },
        { text: 'Draw a black dot in the middle of each eye.' },
        { text: 'Cut long strips of tissue paper for the tail.', adult: true, hazards: ['sharp'] },
        { text: 'Glue the strips inside the back end of the tube so they hang out like a flowing tail.' },
        { text: 'Ask a grown-up to make two small holes near the mouth end and tie the string through them.', adult: true, hazards: ['sharp'] },
        { text: 'Hang your carp by a window or hold it up and run so it swims through the air!' },
      ],
      learn: 'Carp are strong swimmers that push upstream against the current. In Japan they are a symbol of courage and growing up strong.',
    },
  ],
  parentNote:
    '5 May is a public holiday in Japan. Girls have their own traditional celebration, Hinamatsuri, on 3 March, but Children\'s Day is officially for all children.',
  sources: [
    'Japan National Tourism Organization, "Children\'s Day (Kodomo no Hi)"',
    'Web Japan, Ministry of Foreign Affairs of Japan, "Kids Web Japan: Children\'s Day"',
  ],
};

export default content;
