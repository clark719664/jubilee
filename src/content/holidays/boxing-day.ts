import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Boxing Day is December 26, the day after Christmas, and a holiday in the United Kingdom, Canada, Australia, New Zealand and other countries.',
    'It has nothing to do with boxing gloves: the name most likely comes from "Christmas boxes", gifts of money or food that were once given to servants, postmen and tradespeople the day after Christmas.',
    'Today it is a lazy day for leftovers, long walks, board games and big sports matches.',
  ],
  facts: [
    {
      text: 'In Ireland and many other countries, December 26 is St Stephen\'s Day. The carol "Good King Wenceslas" is set on this day, "on the feast of Stephen".',
    },
    {
      text: 'In Australia, a famous yacht race from Sydney to Hobart starts on Boxing Day every year, and a huge cricket match, the Boxing Day Test, begins in Melbourne.',
      wow: true,
    },
    {
      text: 'Boxing Day has been an official bank holiday in England and Wales since 1871, when a law first set it aside as a day off.',
      bigKids: true,
    },
  ],
  greetings: [
    {
      lang: 'en',
      langName: 'English',
      text: 'Happy Boxing Day!',
      sayIt: 'HAP-ee BOK-sing DAY',
      meaning: 'Happy Boxing Day',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'When December 26 falls on a weekend, the United Kingdom, Canada and Australia give a substitute day off on the following weekday. In the United States it is not a holiday.',
  sources: [
    'Encyclopaedia Britannica, "Boxing Day"',
    'Oxford English Dictionary, "Boxing Day"',
    'UK Government, "Bank holidays"',
  ],
};

export default content;
