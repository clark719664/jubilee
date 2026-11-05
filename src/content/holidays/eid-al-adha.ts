import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Eid al-Adha, the "Festival of the Sacrifice", is one of the two biggest holidays for Muslims around the world.',
    'It remembers the story of the Prophet Ibrahim (Abraham), who was willing to give up what he loved most because God asked him to, and in the story God sends a ram to be offered instead.',
    'Many families pray together in the morning, wear their best clothes, visit relatives and share meat with friends, neighbors and people in need.',
    'It comes at the end of the Hajj, the great pilgrimage to Mecca, and is also called Eid al-Kabir, Bakrid or Kurban Bayramı in different countries.',
  ],
  facts: [
    {
      text: 'Food shared on Eid al-Adha is traditionally split into three parts: one for your family, one for friends and neighbors, and one for people who are poor or hungry.',
    },
    {
      text: 'During the same days, close to two million pilgrims from all over the world gather in Mecca for the Hajj.',
      wow: true,
    },
    {
      text: 'Eid al-Adha falls on the 10th day of Dhu al-Hijjah, the last month of the Islamic calendar. Because that calendar follows the moon, Eid arrives about 11 days earlier each year.',
      bigKids: true,
    },
  ],
  greetings: [
    {
      lang: 'ar',
      langName: 'Arabic',
      text: 'عيد مبارك',
      roman: 'Eid Mubarak',
      sayIt: 'EED moo-BAH-rak',
      meaning: 'Blessed festival',
    },
    {
      lang: 'ur',
      langName: 'Urdu',
      text: 'عید مبارک',
      roman: 'Eid Mubarak',
      sayIt: 'EED moo-BAH-rak',
      meaning: 'Blessed festival',
    },
  ],
  recipes: [],
  crafts: [],
  parentNote:
    'The date shown is expected; the exact day depends on the sighting of the new moon and can differ by a day between countries and communities. Celebrations usually last three to four days.',
  sources: [
    'Encyclopaedia Britannica, "Eid al-Adha"',
    'BBC Bitesize, "Eid al-Adha"',
  ],
};

export default content;
