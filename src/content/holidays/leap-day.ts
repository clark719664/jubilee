import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Leap Day is 29 February, a date that appears only once every four years.',
    'We add it because Earth takes about 365 and a quarter days to travel around the Sun, so every four years the calendar needs an extra day to catch up.',
    'People born on 29 February are called leaplings, and in other years many of them celebrate on 28 February or 1 March instead.',
  ],
  facts: [
    {
      text: 'A leapling who is 12 years old has only had 3 real birthdays on the actual date.',
      wow: true,
    },
    {
      text: 'The rule has a twist: years that end in 00 are leap years only if they divide evenly by 400. So 2000 was a leap year, but 1900 was not and 2100 will not be.',
      bigKids: true,
    },
    {
      text: 'The small towns of Anthony, Texas and Anthony, New Mexico, which sit side by side, call themselves the Leap Year Capital of the World and hold a festival for leaplings every four years.',
    },
  ],
  greetings: [
    { lang: 'en', langName: 'English', text: 'Happy Leap Day!', sayIt: 'HAP-ee LEEP DAY', meaning: 'A greeting for the extra day' },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'Leap Day only exists in leap years (2028, 2032, 2036 and so on). In other years the countdown points to the next 29 February.',
  sources: [
    'NASA Space Place, \'What Is a Leap Year?\'',
    'Royal Museums Greenwich, \'Why do we have leap years?\'',
    'NBC News, \'"Leapsters" celebrate birthday at the Leap Year Capital of the World\' (Anthony, Texas and New Mexico)',
  ],
};

export default content;
