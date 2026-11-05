import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'On New Year\'s Day the calendar flips to a brand-new year.',
    'Many families stay up late the night before, then spend 1 January resting, eating special foods and making wishes for the months ahead.',
    'Some people make resolutions: promises to try something new or kind.',
    'Others eat lucky foods, such as black-eyed peas in the southern United States, long noodles in Japan, or lentils in Italy.',
  ],
  facts: [
    {
      text: 'January is named after Janus, a Roman god with two faces: one looks back at the old year and one looks forward to the new one.',
    },
    {
      text: 'The new year does not arrive everywhere at once. Kids on Kiritimati, an island in the Pacific Ocean, have been in the new year for about a whole day by the time people in Hawaii finish their countdown.',
      wow: true,
    },
    {
      text: 'The Romans started their year on 1 January more than 2,000 years ago, and when Julius Caesar introduced his new calendar in 46 BC he kept that date. Most of the world still uses a version of his calendar. Many older calendars had begun the year in March.',
      bigKids: true,
    },
  ],
  greetings: [
    { lang: 'en', langName: 'English', text: 'Happy New Year!', sayIt: 'HAP-ee NOO YEER', meaning: 'Have a happy new year' },
    { lang: 'es', langName: 'Spanish', text: '¡Feliz Año Nuevo!', sayIt: 'feh-LEES AHN-yo NWEH-vo', meaning: 'Happy new year' },
    { lang: 'fr', langName: 'French', text: 'Bonne année !', sayIt: 'bun ah-NAY', meaning: 'Good year' },
    { lang: 'zh-Hans', langName: 'Mandarin Chinese', text: '新年快乐', roman: 'Xinnian kuaile', sayIt: 'shin-NYEN kwye-LUH', meaning: 'New year happy' },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'In the United States, when 1 January falls on a weekend, federal offices and many schools take the nearest weekday off instead. The app shows that day-off date separately.',
  sources: [
    'Encyclopaedia Britannica, \'New Year\'s Day\'',
    'Library of Congress, \'Today in History: January 1\'',
  ],
};

export default content;
