import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Ramadan is the ninth month of the Islamic calendar and the holiest month of the year for Muslims.',
    'During Ramadan, Muslim adults fast from dawn to sunset, which means no food or drink from first light until the sun goes down, and then share a meal called iftar after sunset, often starting with dates and water.',
    'Children do not have to fast, and many join in instead by helping cook iftar, giving to people in need, and trying a short fast when they are older and ready.',
    'The month ends with the festival of Eid al-Fitr.',
  ],
  facts: [
    {
      text: 'Before dawn, families get up for a meal called suhoor. In some towns a drummer called a mesaharati walks the streets before sunrise to wake everyone up.',
      wow: true,
    },
    {
      text: 'Because the Islamic calendar follows the moon, Ramadan starts about 11 days earlier each year. Over about 33 years it moves all the way through the seasons, so sometimes the fast is short and wintry and sometimes long and hot.',
      bigKids: true,
    },
    {
      text: 'Muslims believe the Quran was first revealed during Ramadan. The last ten nights are especially important, and one of them, Laylat al-Qadr, the Night of Power, is said to be better than a thousand months.',
    },
  ],
  greetings: [
    { lang: 'ar', langName: 'Arabic', text: 'رمضان مبارك', roman: 'Ramadan Mubarak', sayIt: 'rah-mah-DAHN moo-BAH-rak', meaning: 'Blessed Ramadan' },
    { lang: 'ar', langName: 'Arabic', text: 'رمضان كريم', roman: 'Ramadan Kareem', sayIt: 'rah-mah-DAHN kah-REEM', meaning: 'Generous Ramadan' },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'The start of Ramadan depends on the sighting of the new crescent moon, so the dates shown are expected and may shift by a day where you live. The month lasts 29 or 30 days. Children, people who are ill, traveling, pregnant or elderly are not expected to fast.',
  sources: [
    'Encyclopaedia Britannica, \'Ramadan\'',
    'BBC Bitesize, \'What is Ramadan?\'',
    'Quran, chapter 2 verse 185 and chapter 97',
    'Encyclopaedia Britannica, \'Islamic calendar\'',
    'Arab News, \'Mesaharati: An ancient career fights extinction in digital age\'',
  ],
};

export default content;
