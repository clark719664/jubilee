import type { HolidayContent } from '../types';

const content: HolidayContent = {
  story: [
    'Canada Day on 1 July is Canada\'s birthday: on that day in 1867 three British colonies joined together to form one country with four provinces.',
    'Across Canada people wear red and white, wave maple leaf flags, and gather for concerts, parades and fireworks.',
    'The biggest party is in Ottawa, the capital, and in many towns new Canadians become citizens at special ceremonies that day.',
  ],
  facts: [
    {
      text: 'On 1 July 1867 Nova Scotia, New Brunswick and the Province of Canada, which split into Ontario and Quebec, united as the Dominion of Canada. The holiday was called Dominion Day until 1982, when it was renamed Canada Day.',
      bigKids: true,
    },
    {
      text: 'The red and white maple leaf flag is younger than many grandparents: it flew for the first time on 15 February 1965.',
      wow: true,
    },
    {
      text: 'Canada now has ten provinces and three territories, and the newest province, Newfoundland and Labrador, joined in 1949.',
    },
  ],
  greetings: [
    {
      lang: 'en',
      langName: 'English',
      text: 'Happy Canada Day!',
      sayIt: 'HAP-ee KAN-uh-duh DAY',
      meaning: 'Happy Canada Day',
    },
    {
      lang: 'fr',
      langName: 'French',
      text: 'Bonne fête du Canada !',
      sayIt: 'bun FET doo kah-nah-DAH',
      meaning: 'Happy Canada Day',
    },
  ],
  recipes: [],
  crafts: [
    {
      id: 'red-and-white-paper-chain',
      title: 'Red-and-White Paper Chain',
      emoji: '🍁',
      blurb: 'Loop strips of red and white paper into a long chain to hang across a window or doorway.',
      minutes: 20,
      mess: 1,
      adultHelp: 'some',
      hazards: ['sharp'],
      materials: [
        { item: 'red paper', qty: '2 sheets', substitute: 'white paper coloured red with crayons' },
        { item: 'white paper', qty: '2 sheets' },
        { item: 'glue stick or tape', qty: '1' },
        { item: 'safety scissors', qty: '1 pair' },
        { item: 'red marker', optional: true },
      ],
      steps: [
        { text: 'Cut the red and white paper into strips about as wide as two fingers.', adult: true, hazards: ['sharp'] },
        { text: 'Draw a little maple leaf on some of the white strips with the red marker.' },
        { text: 'Bend one red strip into a ring and glue the ends together.' },
        { text: 'Thread a white strip through the ring, bend it into a loop and glue it closed.' },
        { text: 'Keep adding rings, red then white, until the chain is as long as you like.' },
        { text: 'Hang your chain across a window, a doorway or the party table.' },
      ],
      learn: 'Red and white have been Canada\'s official colours since 1921, long before the maple leaf flag.',
    },
  ],
  parentNote:
    'Canada Day is a statutory holiday. When 1 July falls on a Sunday, the day off is moved to Monday 2 July. In Newfoundland and Labrador, 1 July is also Memorial Day, and the morning is kept quiet to remember the soldiers who died at Beaumont-Hamel in 1916.',
  sources: [
    'Government of Canada, Canadian Heritage, "Canada Day"',
    'Library and Archives Canada, "Confederation"',
  ],
};

export default content;
