import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Chuseok, also called Hangawi, is Korea\'s harvest festival, held on the fifteenth day of the eighth month of the lunar calendar, when the moon is full.',
    'Millions of families travel back to their hometowns to share a big meal, hold a short ceremony called charye, setting out a table of food to thank their ancestors, and tidy the family graves.',
    'Many families make songpyeon together, little half-moon rice cakes filled with sesame, beans or chestnuts and steamed on a bed of pine needles, and in the evening they go outside to look at the full moon.',
  ],
  facts: [
    {
      text: 'Chuseok is one of the busiest travel times of the whole year in Korea: roads, trains and airports fill up as people head home to their families.',
      wow: true,
    },
    {
      text: 'A saying goes that whoever shapes the prettiest songpyeon will meet a good partner or have a beautiful baby, so everyone tries their best at the family table.',
    },
    {
      text: 'Chuseok falls on the same lunar day as the Mid-Autumn Festival in China and Vietnam, so families in all three countries are looking at the same full moon.',
      bigKids: true,
    },
  ],
  greetings: [
    {
      lang: 'ko',
      langName: 'Korean',
      text: '즐거운 추석 보내세요',
      roman: 'Jeulgeoun Chuseok bonaeseyo',
      sayIt: 'jul-guh-OON choo-SUK boh-neh-SAY-yo',
      meaning: 'Have a happy Chuseok',
    },
    {
      lang: 'ko',
      langName: 'Korean',
      text: '풍성한 한가위 되세요',
      roman: 'Pungseonghan Hangawi doeseyo',
      sayIt: 'poong-sung-HAHN hahn-gah-WEE dway-SAY-yo',
      meaning: 'Have a plentiful Hangawi',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'Chuseok follows the Korean lunar calendar, so it falls between early September and early October. In South Korea it is a three-day public holiday: the day before, Chuseok itself and the day after.',
  sources: [
    'Korean Culture and Information Service, "Chuseok: Korean Thanksgiving Day"',
    'National Folk Museum of Korea, "Encyclopedia of Korean Seasonal Customs"',
  ],
};

export default content;
