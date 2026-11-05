import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Songkran is the traditional Thai New Year, celebrated from 13 to 15 April in the hottest part of the year.',
    'Many families visit temples, clean their homes and gently pour water over Buddha statues and the hands of grandparents as a blessing for the year ahead.',
    'Out in the streets the blessing turns into a giant water fight, with buckets, water guns and lots of laughing.',
  ],
  facts: [
    {
      text: 'Whole streets become water-fight zones, and people happily get soaked by strangers because being splashed is a wish for good luck.',
      wow: true,
    },
    {
      text: 'The name Songkran comes from a Sanskrit word meaning "passing" or "moving", because the sun moves into a new part of the sky at this time of year.',
      bigKids: true,
    },
    {
      text: 'Some families carry sand to the temple and build little sand pagodas, replacing the sand that has been carried away on everyone\'s feet during the year.',
    },
  ],
  greetings: [
    {
      lang: 'th',
      langName: 'Thai',
      text: 'สวัสดีปีใหม่',
      roman: 'Sawasdee pee mai',
      sayIt: 'sah-wah-DEE pee MY',
      meaning: 'Happy New Year',
    },
    {
      lang: 'th',
      langName: 'Thai',
      text: 'สุขสันต์วันสงกรานต์',
      roman: 'Suk san wan Songkran',
      sayIt: 'sook SAHN wahn song-KRAHN',
      meaning: 'Happy Songkran Day',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'The official public holiday runs 13 to 15 April, though some towns celebrate for longer. In 2023 Songkran in Thailand was added to the UNESCO list of intangible cultural heritage.',
  sources: [
    'UNESCO Intangible Cultural Heritage, "Songkran in Thailand, traditional Thai New Year festival" (2023)',
    'Tourism Authority of Thailand, "Songkran Festival"',
  ],
};

export default content;
